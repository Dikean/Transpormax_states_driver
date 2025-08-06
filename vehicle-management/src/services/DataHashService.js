/**
 * @fileoverview Servicio de hashing de datos para detección de cambios
 * @author VehicleManager Team
 * @version 1.0.0
 */

import { loggers } from '../utils/logger.js';

/**
 * @typedef {Object} ProcessingData
 * @property {number} transfersCount - Número de transferencias
 * @property {Array} transfers - Array de transferencias
 * @property {Array<string>} filesProcessed - Archivos procesados
 * @property {string} source - Fuente del procesamiento
 */

/**
 * Servicio para generar hashes de datos y detectar cambios
 * 
 * Responsabilidades:
 * - Generar hashes consistentes de datos de procesamiento
 * - Normalizar datos antes del hashing
 * - Comparar hashes para detectar cambios
 * 
 * @class DataHashService
 */
export class DataHashService {
  /**
   * Constructor del servicio de hashing
   */
  constructor() {
    this.logger = loggers.alert;
    this.logger.debug('DataHashService initialized');
  }

  // ================================
  // MÉTODOS PÚBLICOS
  // ================================

  /**
   * Genera un hash de los datos de procesamiento
   * @param {ProcessingData} data - Datos a hashear
   * @returns {string} Hash generado
   */
  generateDataHash(data) {
    try {
      const normalizedData = this._normalizeData(data);
      const dataString = this._serializeData(normalizedData);
      const hash = this._calculateHash(dataString);
      
      this.logger.debug('Generated data hash', {
        transfersCount: data.transfersCount,
        filesCount: data.filesProcessed?.length || 0,
        hash: hash.substring(0, 8) + '...' // Solo mostrar inicio del hash
      });
      
      return hash;
      
    } catch (error) {
      this.logger.error('Failed to generate data hash', error, data);
      // Retornar hash basado en timestamp como fallback
      return this._generateFallbackHash();
    }
  }

  /**
   * Compara dos hashes para determinar si son iguales
   * @param {string} hash1 - Primer hash
   * @param {string} hash2 - Segundo hash
   * @returns {boolean} True si son iguales
   */
  compareHashes(hash1, hash2) {
    if (typeof hash1 !== 'string' || typeof hash2 !== 'string') {
      this.logger.warn('Invalid hash types for comparison', { hash1: typeof hash1, hash2: typeof hash2 });
      return false;
    }
    
    return hash1 === hash2;
  }

  /**
   * Genera un hash de un archivo basado en su contenido
   * @param {string} fileContent - Contenido del archivo
   * @param {string} fileName - Nombre del archivo
   * @returns {string} Hash del archivo
   */
  generateFileHash(fileContent, fileName) {
    try {
      const normalizedContent = this._normalizeFileContent(fileContent);
      const dataString = `${fileName}:${normalizedContent}`;
      return this._calculateHash(dataString);
      
    } catch (error) {
      this.logger.error('Failed to generate file hash', error, { fileName });
      return this._generateFallbackHash();
    }
  }

  // ================================
  // MÉTODOS PRIVADOS - NORMALIZACIÓN
  // ================================

  /**
   * Normaliza los datos antes del hashing
   * @private
   * @param {ProcessingData} data - Datos a normalizar
   * @returns {Object} Datos normalizados
   */
  _normalizeData(data) {
    const normalized = {
      transfersCount: this._normalizeNumber(data.transfersCount),
      transfers: this._normalizeTransfers(data.transfers),
      filesProcessed: this._normalizeFilesList(data.filesProcessed),
      source: this._normalizeString(data.source),
      department: this._normalizeString(data.department)
    };
    
    return normalized;
  }

  /**
   * Normaliza un número
   * @private
   * @param {*} value - Valor a normalizar
   * @returns {number} Número normalizado
   */
  _normalizeNumber(value) {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Normaliza un string
   * @private
   * @param {*} value - Valor a normalizar
   * @returns {string} String normalizado
   */
  _normalizeString(value) {
    if (typeof value !== 'string') {
      return String(value || '');
    }
    return value.trim().toLowerCase();
  }

  /**
   * Normaliza array de transferencias
   * @private
   * @param {Array} transfers - Array de transferencias
   * @returns {Array} Transferencias normalizadas
   */
  _normalizeTransfers(transfers) {
    if (!Array.isArray(transfers)) {
      return [];
    }
    
    return transfers
      .map(transfer => ({
        vehicleId: this._normalizeString(transfer.vehicleId),
        toDriver: this._normalizeString(transfer.toDriver),
        fromDriver: this._normalizeString(transfer.fromDriver),
        dateTime: transfer.dateTime ? new Date(transfer.dateTime).toISOString() : null
      }))
      .sort((a, b) => {
        // Ordenar para consistencia
        const aKey = `${a.vehicleId}-${a.toDriver}-${a.fromDriver}`;
        const bKey = `${b.vehicleId}-${b.toDriver}-${b.fromDriver}`;
        return aKey.localeCompare(bKey);
      });
  }

  /**
   * Normaliza lista de archivos
   * @private
   * @param {Array} files - Lista de archivos
   * @returns {Array} Lista normalizada
   */
  _normalizeFilesList(files) {
    if (!Array.isArray(files)) {
      return [];
    }
    
    return files
      .map(file => this._normalizeString(file))
      .filter(file => file.length > 0)
      .sort(); // Ordenar para consistencia
  }

  /**
   * Normaliza contenido de archivo
   * @private
   * @param {string} content - Contenido del archivo
   * @returns {string} Contenido normalizado
   */
  _normalizeFileContent(content) {
    if (typeof content !== 'string') {
      return '';
    }
    
    return content
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea
      .replace(/\r/g, '\n')
      .trim()
      .toLowerCase();
  }

  // ================================
  // MÉTODOS PRIVADOS - SERIALIZACIÓN
  // ================================

  /**
   * Serializa datos normalizados a string
   * @private
   * @param {Object} data - Datos normalizados
   * @returns {string} String serializado
   */
  _serializeData(data) {
    try {
      // Usar JSON.stringify con replacer para orden consistente
      return JSON.stringify(data, this._getJSONReplacer(), 0);
    } catch (error) {
      this.logger.error('Failed to serialize data', error);
      return String(data);
    }
  }

  /**
   * Replacer function para JSON.stringify que ordena las claves
   * @private
   * @returns {Function} Replacer function
   */
  _getJSONReplacer() {
    return (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Ordenar claves del objeto para consistencia
        const ordered = {};
        Object.keys(value).sort().forEach(k => {
          ordered[k] = value[k];
        });
        return ordered;
      }
      return value;
    };
  }

  // ================================
  // MÉTODOS PRIVADOS - HASHING
  // ================================

  /**
   * Calcula hash de un string usando algoritmo simple pero consistente
   * @private
   * @param {string} str - String a hashear
   * @returns {string} Hash calculado
   */
  _calculateHash(str) {
    // Usar algoritmo djb2 hash - simple pero efectivo
    let hash = 5381;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; // hash * 33 + char
      hash = hash & hash; // Convertir a 32-bit integer
    }
    
    // Convertir a string hexadecimal positivo
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    
    // Agregar checksum simple para mayor robustez
    const checksum = this._calculateChecksum(str);
    
    return `${hashStr}${checksum}`;
  }

  /**
   * Calcula checksum simple de un string
   * @private
   * @param {string} str - String para checksum
   * @returns {string} Checksum calculado
   */
  _calculateChecksum(str) {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    return (sum % 256).toString(16).padStart(2, '0');
  }

  /**
   * Genera hash de fallback basado en timestamp
   * @private
   * @returns {string} Hash de fallback
   */
  _generateFallbackHash() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return this._calculateHash(`fallback_${timestamp}_${random}`);
  }

  // ================================
  // MÉTODOS PÚBLICOS - UTILIDADES
  // ================================

  /**
   * Valida si un hash tiene formato válido
   * @param {string} hash - Hash a validar
   * @returns {boolean} True si es válido
   */
  isValidHash(hash) {
    if (typeof hash !== 'string') {
      return false;
    }
    
    // Debe ser hexadecimal de 10 caracteres (8 hash + 2 checksum)
    return /^[0-9a-f]{10}$/.test(hash);
  }

  /**
   * Obtiene información sobre un hash
   * @param {string} hash - Hash a analizar
   * @returns {Object} Información del hash
   */
  getHashInfo(hash) {
    if (!this.isValidHash(hash)) {
      return {
        valid: false,
        error: 'Invalid hash format'
      };
    }
    
    return {
      valid: true,
      algorithm: 'djb2',
      length: hash.length,
      hashPart: hash.substring(0, 8),
      checksumPart: hash.substring(8, 10)
    };
  }
}

// ================================
// SINGLETON EXPORT
// ================================

/**
 * Instancia singleton del servicio de hashing
 * @type {DataHashService}
 */
let dataHashServiceInstance = null;

/**
 * Obtiene la instancia singleton del servicio de hashing
 * @returns {DataHashService} Instancia del servicio
 */
export const getDataHashService = () => {
  if (!dataHashServiceInstance) {
    dataHashServiceInstance = new DataHashService();
  }
  return dataHashServiceInstance;
};

export default getDataHashService();