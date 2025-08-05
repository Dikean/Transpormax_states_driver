/**
 * @fileoverview Servicio de envío de emails
 * @author VehicleManager Team
 * @version 1.0.0
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { 
  FIREBASE_COLLECTIONS, 
  ALERT_TYPES, 
  MESSAGES 
} from '../constants/index.js';
import { loggers } from '../utils/logger.js';
import { getEmailConfig } from '../config/emailConfig.js';

/**
 * @typedef {Object} EmailData
 * @property {string} type - Tipo de email (ALERT_TYPES)
 * @property {string} recipient - Email del destinatario
 * @property {string} subject - Asunto del email
 * @property {Object} templateData - Datos para el template
 */

/**
 * @typedef {Object} EmailResult
 * @property {boolean} success - Si se envió exitosamente
 * @property {string} [messageId] - ID del mensaje enviado
 * @property {string} [error] - Mensaje de error si falló
 */

/**
 * Servicio para envío de emails usando EmailJS
 * 
 * Responsabilidades:
 * - Enviar emails de alerta
 * - Gestionar templates de email
 * - Manejar errores de envío
 * - Guardar emails fallidos para reintento
 * 
 * @class EmailService
 */
export class EmailService {
  /**
   * Constructor del servicio de email
   */
  constructor() {
    this.logger = loggers.alert.createLogger ? loggers.alert.createLogger('EmailService') : loggers.alert;
    this.config = getEmailConfig();
    this.isConfigured = this._validateConfiguration();
    
    if (!this.isConfigured) {
      this.logger.warn('EmailJS not configured - emails will be saved for manual sending');
    } else {
      this.logger.info('EmailService initialized', {
        serviceId: this.config.serviceId,
        adminEmail: this.config.adminEmail
      });
    }
  }

  // ================================
  // MÉTODOS PÚBLICOS
  // ================================

  /**
   * Envía una alerta por email
   * @param {EmailData} emailData - Datos del email a enviar
   * @returns {Promise<EmailResult>} Resultado del envío
   */
  async sendAlert(emailData) {
    const timer = this.logger.timer('sendAlert');
    
    try {
      this._validateEmailData(emailData);
      
      this.logger.info('Sending alert email', {
        type: emailData.type,
        recipient: emailData.recipient
      });

      if (!this.isConfigured) {
        // Si no está configurado, guardar para envío manual
        await this._saveForManualSending(emailData);
        const result = {
          success: false,
          error: 'EmailJS not configured - saved for manual sending'
        };
        timer.end(result);
        return result;
      }

      // Preparar datos para EmailJS
      const emailjsData = this._prepareEmailJSData(emailData);
      
      // Enviar email
      const response = await this._sendViaEmailJS(emailjsData);
      
      const result = {
        success: true,
        messageId: response.text || 'sent'
      };
      
      this.logger.info('Alert email sent successfully', {
        type: emailData.type,
        recipient: emailData.recipient,
        messageId: result.messageId
      });
      
      timer.end(result);
      return result;
      
    } catch (error) {
      this.logger.error('Failed to send alert email', error, emailData);
      
      // Guardar para reintento
      await this._saveForManualSending(emailData, error.message);
      
      const result = {
        success: false,
        error: error.message
      };
      
      timer.fail(error);
      return result;
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   * @returns {boolean} True si está configurado
   */
  isEmailConfigured() {
    return this.isConfigured;
  }

  /**
   * Obtiene la configuración actual del servicio
   * @returns {Object} Configuración actual
   */
  getConfiguration() {
    return {
      isConfigured: this.isConfigured,
      serviceId: this.config.serviceId,
      templateId: this.config.templateId,
      adminEmail: this.config.adminEmail
    };
  }

  // ================================
  // MÉTODOS PRIVADOS - VALIDACIÓN
  // ================================

  /**
   * Valida la configuración de EmailJS
   * @private
   * @returns {boolean} True si está configurada correctamente
   */
  _validateConfiguration() {
    const required = ['serviceId', 'templateId', 'userId'];
    
    return required.every(field => {
      const value = this.config[field];
      return value && 
             typeof value === 'string' && 
             value.trim() !== '' && 
             !value.startsWith('your_');
    });
  }

  /**
   * Valida los datos del email
   * @private
   * @param {EmailData} emailData - Datos a validar
   * @throws {Error} Si los datos no son válidos
   */
  _validateEmailData(emailData) {
    if (!emailData || typeof emailData !== 'object') {
      throw new Error('Invalid email data provided');
    }

    const required = ['type', 'recipient', 'subject'];
    for (const field of required) {
      if (!emailData[field] || typeof emailData[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.recipient)) {
      throw new Error('Invalid recipient email address');
    }

    // Validar tipo de alerta
    if (!Object.values(ALERT_TYPES).includes(emailData.type)) {
      throw new Error('Invalid alert type');
    }
  }

  // ================================
  // MÉTODOS PRIVADOS - ENVÍO
  // ================================

  /**
   * Prepara datos para EmailJS
   * @private
   * @param {EmailData} emailData - Datos del email
   * @returns {Object} Datos formateados para EmailJS
   */
  _prepareEmailJSData(emailData) {
    const template = this._getTemplate(emailData.type);
    const message = this._buildMessage(template, emailData.templateData);

    return {
      service_id: this.config.serviceId,
      template_id: this.config.templateId,
      user_id: this.config.userId,
      template_params: {
        to_email: emailData.recipient,
        subject: emailData.subject,
        message: message,
        from_name: 'VehicleManager System',
        reply_to: this.config.adminEmail
      }
    };
  }

  /**
   * Envía email usando EmailJS
   * @private
   * @param {Object} emailjsData - Datos para EmailJS
   * @returns {Promise<Object>} Respuesta de EmailJS
   */
  async _sendViaEmailJS(emailjsData) {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailjsData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
    }

    return await response.json().catch(() => ({ text: 'OK' }));
  }

  // ================================
  // MÉTODOS PRIVADOS - TEMPLATES
  // ================================

  /**
   * Obtiene el template para un tipo de alerta
   * @private
   * @param {string} alertType - Tipo de alerta
   * @returns {Object} Template de email
   */
  _getTemplate(alertType) {
    const templates = this.config.templates || {};
    
    switch (alertType) {
      case ALERT_TYPES.DAILY_PROCESSING:
        return templates.dailyAlert || this._getDefaultDailyTemplate();
      case ALERT_TYPES.CHANGE_DETECTED:
        return templates.changeDetected || this._getDefaultChangeTemplate();
      case ALERT_TYPES.SYSTEM_ERROR:
        return templates.systemError || this._getDefaultErrorTemplate();
      default:
        return this._getDefaultTemplate();
    }
  }

  /**
   * Construye el mensaje usando el template
   * @private
   * @param {Object} template - Template de email
   * @param {Object} data - Datos para reemplazar
   * @returns {string} Mensaje construido
   */
  _buildMessage(template, data = {}) {
    let message = template.body || template;
    
    // Reemplazar variables del template
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] || '';
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return message;
  }

  /**
   * Template por defecto para alertas diarias
   * @private
   * @returns {Object} Template
   */
  _getDefaultDailyTemplate() {
    return {
      body: `
🚨 ALERTA DEL SISTEMA VEHICLEMANAGER

No se ha procesado información de transferencias para la fecha: {{date}}

Detalles:
- Fecha sin procesar: {{date}}
- Fecha actual: {{currentDate}}
- Sistema: VehicleManager
- Acción requerida: Procesar chats de WhatsApp del día

Por favor, ingresa al sistema y procesa los chats correspondientes a esta fecha.

URL del sistema: {{systemUrl}}

---
Este es un mensaje automático del sistema.
Para configurar estas alertas, contacta al administrador.
      `.trim()
    };
  }

  /**
   * Template por defecto para cambios detectados
   * @private
   * @returns {Object} Template
   */
  _getDefaultChangeTemplate() {
    return {
      body: `
📝 CAMBIOS DETECTADOS EN VEHICLEMANAGER

Se detectaron cambios en el procesamiento de transferencias para la fecha: {{date}}

Cambios detectados:
{{changes}}

Recomendación: {{recommendation}}

---
Sistema: VehicleManager
Fecha: {{currentDate}}
      `.trim()
    };
  }

  /**
   * Template por defecto para errores del sistema
   * @private
   * @returns {Object} Template
   */
  _getDefaultErrorTemplate() {
    return {
      body: `
❌ ERROR DEL SISTEMA VEHICLEMANAGER

Se ha producido un error en el sistema:

Error: {{error}}
Fecha: {{currentDate}}
URL: {{systemUrl}}

Por favor, revisa el sistema lo antes posible.

---
Este es un mensaje automático del sistema.
      `.trim()
    };
  }

  /**
   * Template genérico por defecto
   * @private
   * @returns {Object} Template
   */
  _getDefaultTemplate() {
    return {
      body: `
📧 NOTIFICACIÓN DEL SISTEMA VEHICLEMANAGER

{{message}}

---
Sistema: VehicleManager
Fecha: {{currentDate}}
      `.trim()
    };
  }

  // ================================
  // MÉTODOS PRIVADOS - FALLBACK
  // ================================

  /**
   * Guarda email para envío manual cuando falla
   * @private
   * @param {EmailData} emailData - Datos del email
   * @param {string} [error] - Error ocurrido
   * @returns {Promise<void>}
   */
  async _saveForManualSending(emailData, error = null) {
    try {
      const emailRecord = {
        ...emailData,
        status: 'pending',
        error: error,
        createdAt: new Date(),
        attempts: 0,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };
      
      const docId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, FIREBASE_COLLECTIONS.PENDING_EMAILS, docId);
      
      await setDoc(docRef, emailRecord);
      
      this.logger.info('Email saved for manual sending', {
        type: emailData.type,
        recipient: emailData.recipient,
        docId
      });
      
    } catch (saveError) {
      this.logger.error('Failed to save email for manual sending', saveError, emailData);
      // No lanzar error aquí para no interrumpir el flujo principal
    }
  }
}

// ================================
// FACTORY Y SINGLETON
// ================================

/**
 * Instancia singleton del servicio de email
 * @type {EmailService}
 */
let emailServiceInstance = null;

/**
 * Obtiene la instancia singleton del servicio de email
 * @returns {EmailService} Instancia del servicio
 */
export const getEmailService = () => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

export default getEmailService();