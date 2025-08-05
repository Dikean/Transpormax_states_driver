import { db } from '../firebase/config';
import { collection, doc, getDocs, setDoc, query, where, orderBy, limit } from 'firebase/firestore';

class AlertService {
  constructor() {
    this.adminEmail = 'dylan01aponte@gmail.com';
    this.emailServiceUrl = 'https://api.emailjs.com/api/v1.0/email/send'; // Usar EmailJS como ejemplo
  }

  /**
   * Verifica si ya se procesó data para una fecha específica
   * @param {Date} date - Fecha a verificar
   * @returns {Object} Información sobre procesamiento del día
   */
  async checkDailyProcessing(date) {
    try {
      const dateStr = this.formatDateString(date);
      
      // Buscar registros de procesamiento del día
      const processingRef = collection(db, 'daily_processing');
      const q = query(
        processingRef,
        where('date', '==', dateStr),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          processed: false,
          lastProcessing: null,
          shouldAlert: this.shouldSendAlert(date)
        };
      }

      const lastProcessing = snapshot.docs[0].data();
      return {
        processed: true,
        lastProcessing,
        shouldAlert: false
      };
    } catch (error) {
      console.error('Error verificando procesamiento diario:', error);
      return {
        processed: false,
        lastProcessing: null,
        shouldAlert: true,
        error: error.message
      };
    }
  }

  /**
   * Registra que se procesó data para un día específico
   * @param {Date} date - Fecha procesada
   * @param {Object} processingData - Datos del procesamiento
   */
  async recordDailyProcessing(date, processingData) {
    try {
      const dateStr = this.formatDateString(date);
      const timestamp = new Date();
      
      const processingRecord = {
        date: dateStr,
        timestamp,
        transfersProcessed: processingData.transfersCount || 0,
        filesProcessed: processingData.filesProcessed || [],
        source: processingData.source || 'whatsapp',
        hash: this.generateDataHash(processingData),
        ...processingData
      };

      const docRef = doc(db, 'daily_processing', `${dateStr}_${timestamp.getTime()}`);
      await setDoc(docRef, processingRecord);

      console.log(`Procesamiento registrado para ${dateStr}`);
      return processingRecord;
    } catch (error) {
      console.error('Error registrando procesamiento diario:', error);
      throw error;
    }
  }

  /**
   * Detecta si hay cambios en la data del mismo día
   * @param {Date} date - Fecha a comparar
   * @param {Object} newData - Nueva data a procesar
   * @returns {Object} Información sobre cambios detectados
   */
  async detectChanges(date, newData) {
    try {
      const existingProcessing = await this.checkDailyProcessing(date);
      
      if (!existingProcessing.processed) {
        return {
          hasChanges: true,
          isFirstProcessing: true,
          changes: [],
          recommendation: 'Procesar - Primera vez del día'
        };
      }

      const oldHash = existingProcessing.lastProcessing.hash;
      const newHash = this.generateDataHash(newData);

      if (oldHash === newHash) {
        return {
          hasChanges: false,
          isFirstProcessing: false,
          changes: [],
          recommendation: 'No procesar - Data idéntica'
        };
      }

      // Detectar cambios específicos
      const changes = this.compareProcessingData(
        existingProcessing.lastProcessing, 
        newData
      );

      return {
        hasChanges: true,
        isFirstProcessing: false,
        changes,
        recommendation: 'Procesar - Se detectaron cambios',
        oldProcessing: existingProcessing.lastProcessing
      };
    } catch (error) {
      console.error('Error detectando cambios:', error);
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
   * Envía alerta por email cuando no se ha procesado data diariamente
   * @param {Date} date - Fecha que debería haberse procesado
   */
  async sendDailyAlert(date) {
    try {
      const dateStr = this.formatDateString(date);
      const message = this.buildAlertMessage(date);

      // Verificar si ya se envió alerta para este día
      const alertSent = await this.checkAlertSent(dateStr);
      if (alertSent) {
        console.log(`Alerta ya enviada para ${dateStr}`);
        return false;
      }

      // Enviar email usando EmailJS (o tu servicio preferido)
      const emailData = {
        to_email: this.adminEmail,
        subject: `🚨 ALERTA: Procesamiento diario pendiente - ${dateStr}`,
        message: message,
        from_name: 'VehicleManager System'
      };

      await this.sendEmail(emailData);
      
      // Registrar que se envió la alerta
      await this.recordAlertSent(dateStr);
      
      console.log(`Alerta enviada exitosamente a ${this.adminEmail}`);
      return true;
    } catch (error) {
      console.error('Error enviando alerta diaria:', error);
      throw error;
    }
  }

  /**
   * Verifica automáticamente si se debe enviar alerta
   * Llamar esta función diariamente (por ejemplo, con un cron job)
   */
  async checkAndSendDailyAlerts() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Verificar si se procesó data ayer
      const yesterdayProcessing = await this.checkDailyProcessing(yesterday);
      
      if (!yesterdayProcessing.processed && yesterdayProcessing.shouldAlert) {
        await this.sendDailyAlert(yesterday);
      }

      // Verificar si se ha procesado data hoy (después de cierta hora)
      const currentHour = today.getHours();
      if (currentHour >= 18) { // Después de las 6 PM
        const todayProcessing = await this.checkDailyProcessing(today);
        
        if (!todayProcessing.processed) {
          await this.sendDailyAlert(today);
        }
      }
    } catch (error) {
      console.error('Error en verificación automática de alertas:', error);
    }
  }

  // Métodos auxiliares
  formatDateString(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  shouldSendAlert(date) {
    const today = new Date();
    const diffTime = today - date;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Enviar alerta si han pasado más de 1 día sin procesar
    return diffDays >= 1;
  }

  generateDataHash(data) {
    // Generar hash simple de los datos para detectar cambios
    const dataString = JSON.stringify({
      transfersCount: data.transfersCount || 0,
      transfers: data.transfers?.map(t => ({
        vehicleId: t.vehicleId,
        toDriver: t.toDriver,
        fromDriver: t.fromDriver,
        dateTime: t.dateTime
      })) || []
    });
    
    // Hash simple (en producción usar crypto)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return hash.toString();
  }

  compareProcessingData(oldData, newData) {
    const changes = [];
    
    if (oldData.transfersProcessed !== (newData.transfersCount || 0)) {
      changes.push({
        type: 'transfers_count',
        old: oldData.transfersProcessed,
        new: newData.transfersCount || 0,
        description: `Número de transferencias cambió de ${oldData.transfersProcessed} a ${newData.transfersCount || 0}`
      });
    }

    // Comparar archivos procesados
    const oldFiles = oldData.filesProcessed || [];
    const newFiles = newData.filesProcessed || [];
    
    if (JSON.stringify(oldFiles) !== JSON.stringify(newFiles)) {
      changes.push({
        type: 'files_processed',
        old: oldFiles,
        new: newFiles,
        description: 'Archivos procesados son diferentes'
      });
    }

    return changes;
  }

  buildAlertMessage(date) {
    const dateStr = this.formatDateString(date);
    const today = this.formatDateString(new Date());
    
    return `
🚨 ALERTA DEL SISTEMA VEHICLEMANAGER

No se ha procesado información de transferencias para la fecha: ${dateStr}

Detalles:
- Fecha sin procesar: ${dateStr}
- Fecha actual: ${today}
- Sistema: VehicleManager
- Acción requerida: Procesar chats de WhatsApp del día

Por favor, ingresa al sistema y procesa los chats correspondientes a esta fecha.

URL del sistema: ${window.location?.origin || 'https://tu-app.com'}

---
Este es un mensaje automático del sistema.
Para configurar estas alertas, contacta al administrador.
    `.trim();
  }

  async checkAlertSent(dateStr) {
    try {
      const alertsRef = collection(db, 'sent_alerts');
      const q = query(alertsRef, where('date', '==', dateStr), where('type', '==', 'daily_processing'));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error verificando alerta enviada:', error);
      return false;
    }
  }

  async recordAlertSent(dateStr) {
    try {
      const alertRecord = {
        date: dateStr,
        type: 'daily_processing',
        sentAt: new Date(),
        recipient: this.adminEmail
      };
      
      const docRef = doc(db, 'sent_alerts', `daily_${dateStr}`);
      await setDoc(docRef, alertRecord);
    } catch (error) {
      console.error('Error registrando alerta enviada:', error);
    }
  }

  async sendEmail(emailData) {
    // Implementación usando EmailJS (gratuito)
    // Necesitarás configurar una cuenta en emailjs.com
    
    try {
      // Ejemplo con fetch - ajustar según tu servicio de email preferido
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'your_service_id', // Configurar en EmailJS
          template_id: 'your_template_id', // Configurar en EmailJS
          user_id: 'your_user_id', // Configurar en EmailJS
          template_params: emailData
        })
      });

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error en servicio de email:', error);
      
      // Fallback: guardar en base de datos para envío manual
      await this.saveEmailForManualSending(emailData);
      throw error;
    }
  }

  async saveEmailForManualSending(emailData) {
    try {
      const emailRecord = {
        ...emailData,
        status: 'pending',
        createdAt: new Date(),
        attempts: 0
      };
      
      const docRef = doc(db, 'pending_emails', `email_${Date.now()}`);
      await setDoc(docRef, emailRecord);
      
      console.log('Email guardado para envío manual');
    } catch (error) {
      console.error('Error guardando email para envío manual:', error);
    }
  }
}

export default new AlertService();