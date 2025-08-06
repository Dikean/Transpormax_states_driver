/**
 * @fileoverview Sistema de logging centralizado
 * @author VehicleManager Team
 * @version 1.0.0
 */

import { getEnvironmentConfig } from '../constants/index.js';

/**
 * Niveles de log disponibles
 * @readonly
 * @enum {string}
 */
const LOG_LEVELS = Object.freeze({
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
});

/**
 * Colores para logging en consola
 * @readonly
 * @private
 */
const LOG_COLORS = Object.freeze({
  [LOG_LEVELS.ERROR]: '\x1b[31m', // Rojo
  [LOG_LEVELS.WARN]: '\x1b[33m',  // Amarillo
  [LOG_LEVELS.INFO]: '\x1b[36m',  // Cian
  [LOG_LEVELS.DEBUG]: '\x1b[37m', // Blanco
  RESET: '\x1b[0m'
});

/**
 * Clase Logger para manejo centralizado de logs
 */
class Logger {
  /**
   * @param {string} context - Contexto del logger (ej: 'AlertService', 'WhatsAppParser')
   */
  constructor(context = 'App') {
    this.context = context;
    this.config = getEnvironmentConfig();
  }

  /**
   * Formatea un mensaje de log
   * @private
   * @param {string} level - Nivel del log
   * @param {string} message - Mensaje principal
   * @param {Object} [meta] - Metadatos adicionales
   * @returns {string} Mensaje formateado
   */
  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = `[${this.context}]`;
    const levelStr = `[${level}]`;
    
    let formattedMessage = `${timestamp} ${levelStr} ${contextStr} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formattedMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Envía log a la consola con colores
   * @private
   * @param {string} level - Nivel del log
   * @param {string} formattedMessage - Mensaje ya formateado
   * @param {*} [data] - Datos adicionales para mostrar
   */
  _logToConsole(level, formattedMessage, data) {
    const color = LOG_COLORS[level] || LOG_COLORS.RESET;
    const coloredMessage = `${color}${formattedMessage}${LOG_COLORS.RESET}`;
    
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(coloredMessage, data || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(coloredMessage, data || '');
        break;
      case LOG_LEVELS.INFO:
        console.info(coloredMessage, data || '');
        break;
      case LOG_LEVELS.DEBUG:
        if (this.config.verboseLogging) {
          console.debug(coloredMessage, data || '');
        }
        break;
      default:
        console.log(coloredMessage, data || '');
    }
  }

  /**
   * Envía log a servicio externo (en producción)
   * @private
   * @param {string} level - Nivel del log
   * @param {string} message - Mensaje del log
   * @param {Object} meta - Metadatos
   * @param {*} [data] - Datos adicionales
   */
  async _logToService(level, message, meta, data) {
    if (this.config.isDevelopment) {
      return; // No enviar a servicio en desarrollo
    }

    try {
      // En producción, aquí podrías enviar a un servicio como:
      // - Firebase Analytics
      // - Sentry
      // - LogRocket
      // - Tu propio endpoint de logs
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        context: this.context,
        message,
        meta,
        data: data ? JSON.stringify(data) : null,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Ejemplo: enviar a endpoint de logs
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });

      console.log('Log entry prepared for external service:', logEntry);
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Método principal de logging
   * @private
   * @param {string} level - Nivel del log
   * @param {string} message - Mensaje principal
   * @param {Object} [meta] - Metadatos adicionales
   * @param {*} [data] - Datos adicionales
   */
  _log(level, message, meta = {}, data = null) {
    const formattedMessage = this._formatMessage(level, message, meta);
    
    // Siempre loggear a consola
    this._logToConsole(level, formattedMessage, data);
    
    // En producción, también enviar a servicio externo
    if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN) {
      this._logToService(level, message, meta, data);
    }
  }

  /**
   * Log de error
   * @param {string} message - Mensaje de error
   * @param {Error|Object} [error] - Error object o metadatos
   * @param {*} [data] - Datos adicionales
   */
  error(message, error = null, data = null) {
    const meta = {};
    
    if (error instanceof Error) {
      meta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (error && typeof error === 'object') {
      meta.error = error;
    }
    
    this._log(LOG_LEVELS.ERROR, message, meta, data);
  }

  /**
   * Log de advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {Object} [meta] - Metadatos adicionales
   * @param {*} [data] - Datos adicionales
   */
  warn(message, meta = {}, data = null) {
    this._log(LOG_LEVELS.WARN, message, meta, data);
  }

  /**
   * Log informativo
   * @param {string} message - Mensaje informativo
   * @param {Object} [meta] - Metadatos adicionales
   * @param {*} [data] - Datos adicionales
   */
  info(message, meta = {}, data = null) {
    this._log(LOG_LEVELS.INFO, message, meta, data);
  }

  /**
   * Log de debug (solo en desarrollo)
   * @param {string} message - Mensaje de debug
   * @param {Object} [meta] - Metadatos adicionales
   * @param {*} [data] - Datos adicionales
   */
  debug(message, meta = {}, data = null) {
    this._log(LOG_LEVELS.DEBUG, message, meta, data);
  }

  /**
   * Log de inicio de operación
   * @param {string} operation - Nombre de la operación
   * @param {Object} [params] - Parámetros de la operación
   */
  startOperation(operation, params = {}) {
    this.info(`Starting operation: ${operation}`, { operation, params });
  }

  /**
   * Log de fin de operación exitosa
   * @param {string} operation - Nombre de la operación
   * @param {number} [duration] - Duración en ms
   * @param {*} [result] - Resultado de la operación
   */
  endOperation(operation, duration = null, result = null) {
    const meta = { operation };
    if (duration !== null) meta.duration = `${duration}ms`;
    
    this.info(`Completed operation: ${operation}`, meta, result);
  }

  /**
   * Log de operación fallida
   * @param {string} operation - Nombre de la operación
   * @param {Error} error - Error ocurrido
   * @param {number} [duration] - Duración en ms
   */
  failOperation(operation, error, duration = null) {
    const meta = { operation };
    if (duration !== null) meta.duration = `${duration}ms`;
    
    this.error(`Failed operation: ${operation}`, error, meta);
  }

  /**
   * Crea un timer para medir duración de operaciones
   * @param {string} operation - Nombre de la operación
   * @returns {Object} Timer object con método end()
   */
  timer(operation) {
    const startTime = Date.now();
    this.startOperation(operation);
    
    return {
      end: (result = null) => {
        const duration = Date.now() - startTime;
        this.endOperation(operation, duration, result);
        return duration;
      },
      fail: (error) => {
        const duration = Date.now() - startTime;
        this.failOperation(operation, error, duration);
        return duration;
      }
    };
  }
}

/**
 * Factory function para crear loggers
 * @param {string} context - Contexto del logger
 * @returns {Logger} Nueva instancia de logger
 */
export const createLogger = (context) => {
  return new Logger(context);
};

/**
 * Logger por defecto de la aplicación
 */
export const logger = new Logger('App');

/**
 * Loggers específicos para diferentes módulos
 */
export const loggers = {
  alert: createLogger('AlertService'),
  whatsapp: createLogger('WhatsAppParser'),
  firebase: createLogger('FirebaseService'),
  ui: createLogger('UI'),
  validation: createLogger('Validation')
};

export default logger;