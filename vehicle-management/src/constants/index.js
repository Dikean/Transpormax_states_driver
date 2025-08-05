/**
 * @fileoverview Constantes centralizadas de la aplicación
 * @author VehicleManager Team
 * @version 1.0.0
 */

// ================================
// COLECCIONES DE FIREBASE
// ================================

/**
 * Nombres de las colecciones en Firestore
 * @readonly
 * @enum {string}
 */
export const FIREBASE_COLLECTIONS = Object.freeze({
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  TRANSFERS: 'transfers',
  DAILY_PROCESSING: 'daily_processing',
  SENT_ALERTS: 'sent_alerts',
  PENDING_EMAILS: 'pending_emails',
  SYSTEM_LOGS: 'system_logs'
});

// ================================
// ESTADOS DE ENTIDADES
// ================================

/**
 * Estados disponibles para conductores
 * @readonly
 * @enum {string}
 */
export const DRIVER_STATES = Object.freeze({
  ACTIVE: 'activo',
  INACTIVE: 'inactivo'
});

/**
 * Estados disponibles para vehículos
 * @readonly
 * @enum {string}
 */
export const VEHICLE_STATES = Object.freeze({
  ACTIVE: 'activo',
  INACTIVE: 'inactivo',
  MAINTENANCE: 'mantenimiento'
});

/**
 * Fuentes de transferencias
 * @readonly
 * @enum {string}
 */
export const TRANSFER_SOURCES = Object.freeze({
  MANUAL: 'manual',
  WHATSAPP: 'whatsapp'
});

// ================================
// CONFIGURACIÓN DE ALERTAS
// ================================

/**
 * Tipos de alertas del sistema
 * @readonly
 * @enum {string}
 */
export const ALERT_TYPES = Object.freeze({
  DAILY_PROCESSING: 'daily_processing',
  CHANGE_DETECTED: 'change_detected',
  SYSTEM_ERROR: 'system_error'
});

/**
 * Configuración por defecto de alertas
 * @readonly
 */
export const ALERT_CONFIG = Object.freeze({
  /** Hora después de la cual enviar alerta (formato 24h) */
  DEFAULT_ALERT_HOUR: 18,
  
  /** Días de la semana para enviar alertas (0=Domingo, 6=Sábado) */
  ALERT_DAYS: Object.freeze([1, 2, 3, 4, 5, 6]), // Lunes a Sábado
  
  /** Máximo número de alertas por día */
  MAX_ALERTS_PER_DAY: 2,
  
  /** Intervalo de verificación en milisegundos (1 hora) */
  CHECK_INTERVAL_MS: 60 * 60 * 1000,
  
  /** Email del administrador */
  ADMIN_EMAIL: 'dylan01aponte@gmail.com'
});

// ================================
// CONFIGURACIÓN DE ARCHIVOS
// ================================

/**
 * Configuración para procesamiento de archivos
 * @readonly
 */
export const FILE_CONFIG = Object.freeze({
  /** Tipos de archivo aceptados */
  ACCEPTED_TYPES: Object.freeze(['.txt', '.csv']),
  
  /** Tamaño máximo de archivo en MB */
  MAX_SIZE_MB: 10,
  
  /** Tamaño máximo en bytes */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  
  /** Extensiones soportadas */
  SUPPORTED_EXTENSIONS: Object.freeze(['txt', 'csv'])
});

// ================================
// PATRONES DE WHATSAPP
// ================================

/**
 * Patrones de expresiones regulares para detectar transferencias
 * @readonly
 */
export const WHATSAPP_PATTERNS = Object.freeze([
  {
    id: 'PASS_VEHICLE_TO',
    pattern: /(?:le\s+paso|paso|entrego|doy)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
    confidence: 0.9,
    description: 'Patrón: "le paso el carro X a Y"'
  },
  {
    id: 'VEHICLE_PASS_TO',
    pattern: /(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+se\s+lo\s+(?:paso|entrego|doy)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
    confidence: 0.85,
    description: 'Patrón: "el carro X se lo paso a Y"'
  },
  {
    id: 'DRIVER_RECEIVES',
    pattern: /([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\s+(?:recibe|toma|agarra)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)/gi,
    confidence: 0.8,
    description: 'Patrón: "Y recibe el carro X"'
  },
  {
    id: 'TRANSFER_VEHICLE',
    pattern: /(?:transferir|transferencia)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
    confidence: 0.9,
    description: 'Patrón: "transferir carro X a Y"'
  },
  {
    id: 'HANDOVER_PATTERN',
    pattern: /([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\s+(?:deja|entrega)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+).*?([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\s+(?:lo\s+toma|lo\s+recibe|lo\s+agarra)/gi,
    confidence: 0.75,
    description: 'Patrón: "X deja el carro, Y lo toma"'
  },
  {
    id: 'VEHICLE_FOR_DRIVER',
    pattern: /(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+para\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
    confidence: 0.7,
    description: 'Patrón: "carro X para Y"'
  }
]);

/**
 * Patrones para extraer fechas de WhatsApp
 * @readonly
 */
export const DATE_PATTERNS = Object.freeze([
  {
    pattern: /(\d{1,2}\/\d{1,2}\/\d{4}),?\s*(\d{1,2}:\d{2})/g,
    description: 'Formato: DD/MM/YYYY, HH:MM'
  },
  {
    pattern: /(\d{1,2}\/\d{1,2}\/\d{2}),?\s*(\d{1,2}:\d{2})/g,
    description: 'Formato: DD/MM/YY, HH:MM'
  },
  {
    pattern: /\[(\d{1,2}\/\d{1,2}\/\d{2})\s+(\d{1,2}:\d{2}:\d{2})\]/g,
    description: 'Formato WhatsApp: [DD/MM/YY HH:MM:SS]'
  }
]);

// ================================
// MENSAJES Y TEXTOS
// ================================

/**
 * Mensajes de la aplicación
 * @readonly
 */
export const MESSAGES = Object.freeze({
  SUCCESS: Object.freeze({
    DRIVER_CREATED: 'Conductor creado exitosamente',
    DRIVER_UPDATED: 'Conductor actualizado exitosamente',
    DRIVER_DELETED: 'Conductor eliminado exitosamente',
    VEHICLE_CREATED: 'Vehículo creado exitosamente',
    VEHICLE_UPDATED: 'Vehículo actualizado exitosamente',
    VEHICLE_DELETED: 'Vehículo eliminado exitosamente',
    TRANSFERS_SAVED: 'Transferencias guardadas exitosamente',
    ALERT_SENT: 'Alerta enviada exitosamente'
  }),
  
  ERROR: Object.freeze({
    LOADING_DATA: 'Error cargando datos',
    SAVING_DATA: 'Error guardando datos',
    DELETING_DATA: 'Error eliminando datos',
    PROCESSING_FILE: 'Error procesando archivo',
    SENDING_ALERT: 'Error enviando alerta',
    INVALID_FILE: 'Archivo no válido',
    FILE_TOO_LARGE: 'Archivo muy grande',
    NETWORK_ERROR: 'Error de conexión'
  }),
  
  WARNING: Object.freeze({
    NO_CHANGES_DETECTED: 'No se detectaron cambios en los datos',
    DUPLICATE_PROCESSING: 'Este procesamiento ya se realizó hoy',
    UNSUPPORTED_FILE: 'Tipo de archivo no soportado'
  }),
  
  INFO: Object.freeze({
    FIRST_PROCESSING: 'Primera vez procesando datos de este día',
    CHANGES_DETECTED: 'Se detectaron cambios en los datos',
    NO_TRANSFERS_FOUND: 'No se encontraron transferencias en el archivo'
  })
});

// ================================
// CONFIGURACIÓN DE VALIDACIÓN
// ================================

/**
 * Reglas de validación
 * @readonly
 */
export const VALIDATION_RULES = Object.freeze({
  DRIVER: Object.freeze({
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    LICENSE_MIN_LENGTH: 5,
    LICENSE_MAX_LENGTH: 20,
    PHONE_PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }),
  
  VEHICLE: Object.freeze({
    PLATE_MIN_LENGTH: 3,
    PLATE_MAX_LENGTH: 10,
    BRAND_MIN_LENGTH: 2,
    BRAND_MAX_LENGTH: 50,
    MODEL_MIN_LENGTH: 1,
    MODEL_MAX_LENGTH: 50,
    YEAR_MIN: 1900,
    YEAR_MAX: new Date().getFullYear() + 1
  })
});

// ================================
// CONFIGURACIÓN DE UI
// ================================

/**
 * Configuración de la interfaz de usuario
 * @readonly
 */
export const UI_CONFIG = Object.freeze({
  /** Número de elementos por página en tablas */
  ITEMS_PER_PAGE: 10,
  
  /** Tiempo de espera para mostrar mensajes (ms) */
  MESSAGE_TIMEOUT: 5000,
  
  /** Tiempo de debounce para búsquedas (ms) */
  SEARCH_DEBOUNCE: 300,
  
  /** Número máximo de elementos en dropdown */
  MAX_DROPDOWN_ITEMS: 100
});

// ================================
// CONFIGURACIÓN DE DESARROLLO
// ================================

/**
 * Configuración específica para desarrollo
 * @readonly
 */
export const DEV_CONFIG = Object.freeze({
  /** Mostrar logs detallados */
  VERBOSE_LOGGING: true,
  
  /** Mostrar widget de alertas */
  SHOW_ALERT_WIDGET: true,
  
  /** Intervalo reducido para testing (5 minutos) */
  TEST_CHECK_INTERVAL: 5 * 60 * 1000
});

// ================================
// UTILIDADES
// ================================

/**
 * Obtiene la configuración según el entorno
 * @returns {Object} Configuración del entorno actual
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  
  return {
    isDevelopment,
    alertCheckInterval: isDevelopment 
      ? DEV_CONFIG.TEST_CHECK_INTERVAL 
      : ALERT_CONFIG.CHECK_INTERVAL_MS,
    showAlertWidget: isDevelopment && DEV_CONFIG.SHOW_ALERT_WIDGET,
    verboseLogging: isDevelopment && DEV_CONFIG.VERBOSE_LOGGING
  };
};

/**
 * Valida si un valor está en un enum
 * @param {*} value - Valor a validar
 * @param {Object} enumObject - Objeto enum
 * @returns {boolean} True si es válido
 */
export const isValidEnumValue = (value, enumObject) => {
  return Object.values(enumObject).includes(value);
};

/**
 * Obtiene todas las claves de un enum como array
 * @param {Object} enumObject - Objeto enum
 * @returns {Array<string>} Array de claves
 */
export const getEnumKeys = (enumObject) => {
  return Object.keys(enumObject);
};

/**
 * Obtiene todos los valores de un enum como array
 * @param {Object} enumObject - Objeto enum
 * @returns {Array<*>} Array de valores
 */
export const getEnumValues = (enumObject) => {
  return Object.values(enumObject);
};