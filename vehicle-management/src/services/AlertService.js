/**
 * @fileoverview Servicio de alertas y detección de cambios
 * @author VehicleManager Team
 * @version 1.0.0
 */

import { db } from '../firebase/config.js';
import { collection, doc, getDocs, setDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  FIREBASE_COLLECTIONS, 
  ALERT_TYPES, 
  ALERT_CONFIG, 
  MESSAGES,
  getEnvironmentConfig 
} from '../constants/index.js';
import { loggers } from '../utils/logger.js';
import { EmailService } from './EmailService.js';
import { DataHashService } from './DataHashService.js';

/**
 * @typedef {Object} ProcessingData
 * @property {number} transfersCount - Número de transferencias procesadas
 * @property {Array} transfers - Array de transferencias
 * @property {Array<string>} filesProcessed - Nombres de archivos procesados
 * @property {string} source - Fuente del procesamiento ('whatsapp' | 'manual')
 */

/**
 * @typedef {Object} ChangeDetectionResult
 * @property {boolean} hasChanges - Si se detectaron cambios
 * @property {boolean} isFirstProcessing - Si es el primer procesamiento del día
 * @property {Array} changes - Lista de cambios detectados
 * @property {string} recommendation - Recomendación de acción
 * @property {Object} [oldProcessing] - Datos del procesamiento anterior
 * @property {string} [error] - Mensaje de error si ocurrió
 */

/**
 * @typedef {Object} DailyProcessingCheck
 * @property {boolean} processed - Si ya se procesó data para la fecha
 * @property {Object} [lastProcessing] - Último procesamiento registrado
 * @property {boolean} shouldAlert - Si se debe enviar alerta
 * @property {string} [error] - Mensaje de error si ocurrió
 */

/**
 * Servicio para gestión de alertas y detección de cambios diarios
 * 
 * Responsabilidades:
 * - Detectar cambios en procesamientos diarios
 * - Enviar alertas por email cuando no se procesa data
 * - Registrar procesamientos diarios
 * - Gestionar configuración de alertas
 * 
 * @class AlertService
 */
class AlertService {
  /**
   * @param {EmailService} emailService - Servicio de email
   * @param {DataHashService} hashService - Servicio de hashing
   */
  constructor(emailService = null, hashService = null) {
    this.logger = loggers.alert;
    this.config = getEnvironmentConfig();
    this.emailService = emailService || new EmailService();
    this.hashService = hashService || new DataHashService();
    
    this.logger.info('AlertService initialized', {
      isDevelopment: this.config.isDevelopment,
      adminEmail: ALERT_CONFIG.ADMIN_EMAIL
    });
  }

  // ================================
  // MÉTODOS PÚBLICOS - DETECCIÓN DE CAMBIOS
  // ================================

  /**
   * Verifica si ya se procesó data para una fecha específica
   * @param {Date} date - Fecha a verificar
   * @returns {Promise<DailyProcessingCheck>} Resultado de la verificación
   */
  async checkDailyProcessing(date) {
    const timer = this.logger.timer('checkDailyProcessing');
    
    try {
      this._validateDate(date);
      const dateStr = this._formatDateString(date);
      
      this.logger.debug('Checking daily processing', { date: dateStr });
      
      const processingRef = collection(db, FIREBASE_COLLECTIONS.DAILY_PROCESSING);
      const q = query(
        processingRef,
        where('date', '==', dateStr),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const result = {
          processed: false,
          lastProcessing: null,
          shouldAlert: this._shouldSendAlert(date)
        };
        
        timer.end(result);
        return result;
      }

      const lastProcessing = snapshot.docs[0].data();
      const result = {
        processed: true,
        lastProcessing,
        shouldAlert: false
      };
      
      timer.end(result);
      return result;
      
    } catch (error) {
      timer.fail(error);
      
      return {
        processed: false,
        lastProcessing: null,
        shouldAlert: true,
        error: error.message
      };
    }
  }

  /**
   * Detecta cambios comparando nueva data con procesamiento existente
   * @param {Date} date - Fecha a comparar
   * @param {ProcessingData} newData - Nueva data a procesar
   * @returns {Promise<ChangeDetectionResult>} Resultado de la detección
   */
  async detectChanges(date, newData) {
    const timer = this.logger.timer('detectChanges');
    
    try {
      this._validateDate(date);
      this._validateProcessingData(newData);
      
      const existingProcessing = await this.checkDailyProcessing(date);
      
      // Primera vez del día
      if (!existingProcessing.processed) {
        const result = {
          hasChanges: true,
          isFirstProcessing: true,
          changes: [],
          recommendation: MESSAGES.INFO.FIRST_PROCESSING
        };
        
        timer.end(result);
        return result;
      }

      // Comparar hashes
      const oldHash = existingProcessing.lastProcessing.hash;
      const newHash = this.hashService.generateDataHash(newData);

      // Sin cambios
      if (oldHash === newHash) {
        const result = {
          hasChanges: false,
          isFirstProcessing: false,
          changes: [],
          recommendation: MESSAGES.WARNING.NO_CHANGES_DETECTED
        };
        
        timer.end(result);
        return result;
      }

      // Detectar cambios específicos
      const changes = this._compareProcessingData(
        existingProcessing.lastProcessing, 
        newData
      );

      const result = {
        hasChanges: true,
        isFirstProcessing: false,
        changes,
        recommendation: MESSAGES.INFO.CHANGES_DETECTED,
        oldProcessing: existingProcessing.lastProcessing
      };
      
      timer.end(result);
      return result;
      
    } catch (error) {
      timer.fail(error);
      
      return {
        hasChanges: true,
        isFirstProcessing: true,
        changes: [],
        recommendation: 'Procesar - Error en comparación',
        error: error.message
      };
    }
  }

  /**
   * Registra que se procesó data para un día específico
   * @param {Date} date - Fecha procesada
   * @param {ProcessingData} processingData - Datos del procesamiento
   * @returns {Promise<Object>} Registro creado
   */
  async recordDailyProcessing(date, processingData) {
    const timer = this.logger.timer('recordDailyProcessing');
    
    try {
      this._validateDate(date);
      this._validateProcessingData(processingData);
      
      const dateStr = this._formatDateString(date);
      const timestamp = new Date();
      
      const processingRecord = {
        date: dateStr,
        timestamp,
        transfersProcessed: processingData.transfersCount || 0,
        filesProcessed: processingData.filesProcessed || [],
        source: processingData.source || 'manual',
        hash: this.hashService.generateDataHash(processingData),
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };

      const docId = `${dateStr}_${timestamp.getTime()}`;
      const docRef = doc(db, FIREBASE_COLLECTIONS.DAILY_PROCESSING, docId);
      
      await setDoc(docRef, processingRecord);
      
      this.logger.info('Daily processing recorded', { 
        date: dateStr, 
        transfers: processingRecord.transfersProcessed 
      });
      
      timer.end(processingRecord);
      return processingRecord;
      
    } catch (error) {
      timer.fail(error);
      throw new Error(`${MESSAGES.ERROR.SAVING_DATA}: ${error.message}`);
    }
  }

  // ================================
  // MÉTODOS PÚBLICOS - ALERTAS
  // ================================

  /**
   * Envía alerta por email cuando no se ha procesado data
   * @param {Date} date - Fecha que debería haberse procesado
   * @returns {Promise<boolean>} True si se envió exitosamente
   */
  async sendDailyAlert(date) {
    const timer = this.logger.timer('sendDailyAlert');
    
    try {
      this._validateDate(date);
      
      const dateStr = this._formatDateString(date);
      
      // Verificar si ya se envió alerta
      const alertSent = await this._checkAlertSent(dateStr);
      if (alertSent) {
        this.logger.warn('Alert already sent for date', { date: dateStr });
        timer.end(false);
        return false;
      }

      // Preparar datos del email
      const emailData = this._buildAlertEmailData(date);
      
      // Enviar email
      await this.emailService.sendAlert(emailData);
      
      // Registrar alerta enviada
      await this._recordAlertSent(dateStr);
      
      this.logger.info('Daily alert sent successfully', { 
        date: dateStr, 
        recipient: ALERT_CONFIG.ADMIN_EMAIL 
      });
      
      timer.end(true);
      return true;
      
    } catch (error) {
      timer.fail(error);
      throw new Error(`${MESSAGES.ERROR.SENDING_ALERT}: ${error.message}`);
    }
  }

  /**
   * Verifica automáticamente si se deben enviar alertas
   * Debe llamarse periódicamente (ej: cada hora)
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async checkAndSendDailyAlerts() {
    const timer = this.logger.timer('checkAndSendDailyAlerts');
    
    try {
      const today = new Date();
      const results = {
        alertsChecked: 0,
        alertsSent: 0,
        errors: []
      };

      // Verificar día anterior
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      try {
        const yesterdayResult = await this._checkAndSendForDate(yesterday);
        results.alertsChecked++;
        if (yesterdayResult) results.alertsSent++;
      } catch (error) {
        results.errors.push({ date: 'yesterday', error: error.message });
      }

      // Verificar día actual (después de cierta hora)
      if (this._shouldCheckToday(today)) {
        try {
          const todayResult = await this._checkAndSendForDate(today);
          results.alertsChecked++;
          if (todayResult) results.alertsSent++;
        } catch (error) {
          results.errors.push({ date: 'today', error: error.message });
        }
      }

      timer.end(results);
      return results;
      
    } catch (error) {
      timer.fail(error);
      throw error;
    }
  }

  // ================================
  // MÉTODOS PRIVADOS - VALIDACIÓN
  // ================================

  /**
   * Valida que la fecha sea válida
   * @private
   * @param {Date} date - Fecha a validar
   * @throws {Error} Si la fecha no es válida
   */
  _validateDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
  }

  /**
   * Valida los datos de procesamiento
   * @private
   * @param {ProcessingData} data - Datos a validar
   * @throws {Error} Si los datos no son válidos
   */
  _validateProcessingData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid processing data provided');
    }
    
    if (typeof data.transfersCount !== 'number' || data.transfersCount < 0) {
      throw new Error('Invalid transfers count');
    }
  }

  // ================================
  // MÉTODOS PRIVADOS - UTILIDADES
  // ================================

  /**
   * Formatea fecha como string YYYY-MM-DD
   * @private
   * @param {Date} date - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  _formatDateString(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Determina si se debe enviar alerta para una fecha
   * @private
   * @param {Date} date - Fecha a evaluar
   * @returns {boolean} True si se debe enviar alerta
   */
  _shouldSendAlert(date) {
    const today = new Date();
    const diffTime = today - date;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Solo alertar si es día laboral y ha pasado tiempo suficiente
    const dayOfWeek = date.getDay();
    const isWorkDay = ALERT_CONFIG.ALERT_DAYS.includes(dayOfWeek);
    
    return isWorkDay && diffDays >= 1;
  }

  /**
   * Determina si se debe verificar alertas para hoy
   * @private
   * @param {Date} today - Fecha actual
   * @returns {boolean} True si se debe verificar
   */
  _shouldCheckToday(today) {
    const currentHour = today.getHours();
    const dayOfWeek = today.getDay();
    const isWorkDay = ALERT_CONFIG.ALERT_DAYS.includes(dayOfWeek);
    
    return isWorkDay && currentHour >= ALERT_CONFIG.DEFAULT_ALERT_HOUR;
  }

  /**
   * Compara datos de procesamiento para detectar cambios
   * @private
   * @param {Object} oldData - Datos anteriores
   * @param {ProcessingData} newData - Datos nuevos
   * @returns {Array} Lista de cambios detectados
   */
  _compareProcessingData(oldData, newData) {
    const changes = [];
    
    // Comparar número de transferencias
    if (oldData.transfersProcessed !== newData.transfersCount) {
      changes.push({
        type: 'transfers_count',
        old: oldData.transfersProcessed,
        new: newData.transfersCount,
        description: `Número de transferencias cambió de ${oldData.transfersProcessed} a ${newData.transfersCount}`
      });
    }

    // Comparar archivos procesados
    const oldFiles = oldData.filesProcessed || [];
    const newFiles = newData.filesProcessed || [];
    
    if (JSON.stringify(oldFiles.sort()) !== JSON.stringify(newFiles.sort())) {
      changes.push({
        type: 'files_processed',
        old: oldFiles,
        new: newFiles,
        description: 'Archivos procesados son diferentes'
      });
    }

    return changes;
  }

  /**
   * Construye datos para email de alerta
   * @private
   * @param {Date} date - Fecha sin procesar
   * @returns {Object} Datos del email
   */
  _buildAlertEmailData(date) {
    const dateStr = this._formatDateString(date);
    const today = this._formatDateString(new Date());
    
    return {
      type: ALERT_TYPES.DAILY_PROCESSING,
      recipient: ALERT_CONFIG.ADMIN_EMAIL,
      subject: `🚨 ALERTA: Procesamiento diario pendiente - ${dateStr}`,
      templateData: {
        date: dateStr,
        currentDate: today,
        systemUrl: window.location?.origin || 'Sistema VehicleManager'
      }
    };
  }

  /**
   * Verifica y envía alerta para una fecha específica
   * @private
   * @param {Date} date - Fecha a verificar
   * @returns {Promise<boolean>} True si se envió alerta
   */
  async _checkAndSendForDate(date) {
    const processing = await this.checkDailyProcessing(date);
    
    if (!processing.processed && processing.shouldAlert) {
      return await this.sendDailyAlert(date);
    }
    
    return false;
  }

  /**
   * Verifica si ya se envió alerta para una fecha
   * @private
   * @param {string} dateStr - Fecha en formato YYYY-MM-DD
   * @returns {Promise<boolean>} True si ya se envió
   */
  async _checkAlertSent(dateStr) {
    try {
      const alertsRef = collection(db, FIREBASE_COLLECTIONS.SENT_ALERTS);
      const q = query(
        alertsRef, 
        where('date', '==', dateStr), 
        where('type', '==', ALERT_TYPES.DAILY_PROCESSING)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
      
    } catch (error) {
      this.logger.error('Error checking if alert was sent', error, { date: dateStr });
      return false; // En caso de error, asumir que no se envió
    }
  }

  /**
   * Registra que se envió una alerta
   * @private
   * @param {string} dateStr - Fecha en formato YYYY-MM-DD
   * @returns {Promise<void>}
   */
  async _recordAlertSent(dateStr) {
    try {
      const alertRecord = {
        date: dateStr,
        type: ALERT_TYPES.DAILY_PROCESSING,
        sentAt: new Date(),
        recipient: ALERT_CONFIG.ADMIN_EMAIL,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };
      
      const docRef = doc(db, FIREBASE_COLLECTIONS.SENT_ALERTS, `daily_${dateStr}`);
      await setDoc(docRef, alertRecord);
      
    } catch (error) {
      this.logger.error('Error recording alert sent', error, { date: dateStr });
      // No lanzar error aquí para no interrumpir el flujo principal
    }
  }
}

// ================================
// SINGLETON EXPORT
// ================================

/**
 * Instancia singleton del servicio de alertas
 * @type {AlertService}
 */
export const alertService = new AlertService();

export default alertService;