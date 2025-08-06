// Analizador de texto para chats de WhatsApp
// Busca patrones de transferencia de vehículos entre conductores

export class WhatsAppParser {
  constructor() {
    // Patrones de expresiones regulares para detectar transferencias
    this.transferPatterns = [
      // "le paso el carro X a Y"
      /(?:le\s+paso|paso|entrego|doy)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
      
      // "el carro X se lo paso a Y"
      /(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+se\s+lo\s+(?:paso|entrego|doy)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
      
      // "Y recibe el carro X"
      /([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\s+(?:recibe|toma|agarra)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)/gi,
      
      // "transferir carro X a Y"
      /(?:transferir|transferencia)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi,
      
      // "X deja el carro, Y lo toma"
      /([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\s+(?:deja|entrega)\s+(?:el\s+)?(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+).*?([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)\s+(?:lo\s+toma|lo\s+recibe|lo\s+agarra)/gi,
      
      // "carro X para Y"
      /(?:carro|vehículo|auto|taxi)\s+([A-Z0-9\-\s]+)\s+para\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]+)/gi
    ];

    // Patrones para extraer fechas y horas
    this.dateTimePatterns = [
      // Formato: DD/MM/YYYY, HH:MM
      /(\d{1,2}\/\d{1,2}\/\d{4}),?\s*(\d{1,2}:\d{2})/g,
      
      // Formato: DD/MM/YY, HH:MM
      /(\d{1,2}\/\d{1,2}\/\d{2}),?\s*(\d{1,2}:\d{2})/g,
      
      // Formato WhatsApp: [DD/MM/YY HH:MM:SS]
      /\[(\d{1,2}\/\d{1,2}\/\d{2})\s+(\d{1,2}:\d{2}:\d{2})\]/g
    ];

    // Patrones para limpiar nombres de conductores
    this.cleanNamePatterns = [
      /^\s*-\s*/, // Eliminar guiones al inicio
      /\s*:.*$/, // Eliminar dos puntos y todo lo que sigue
      /\s+/g // Múltiples espacios a uno solo
    ];
  }

  /**
   * Parsea un archivo de chat de WhatsApp (txt o csv)
   * @param {string} content - Contenido del archivo
   * @param {string} fileType - Tipo de archivo ('txt' o 'csv')
   * @returns {Array} Array de transferencias encontradas
   */
  parseChat(content, fileType = 'txt') {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const transfers = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Extraer fecha y hora de la línea
      const dateTime = this.extractDateTime(line);
      
      // Buscar patrones de transferencia
      const foundTransfers = this.findTransferPatterns(line);
      
      foundTransfers.forEach(transfer => {
        transfers.push({
          ...transfer,
          dateTime,
          originalText: line,
          lineNumber: i + 1
        });
      });
    }

    return this.deduplicateTransfers(transfers);
  }

  /**
   * Busca patrones de transferencia en una línea de texto
   * @param {string} text - Texto a analizar
   * @returns {Array} Array de transferencias encontradas
   */
  findTransferPatterns(text) {
    const transfers = [];

    this.transferPatterns.forEach((pattern, patternIndex) => {
      let match;
      // Resetear el índice del patrón para cada línea
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        let vehicleId, fromDriver, toDriver;

        // Interpretar los grupos de captura según el patrón
        switch (patternIndex) {
          case 0: // "le paso el carro X a Y"
          case 1: // "el carro X se lo paso a Y"
          case 3: // "transferir carro X a Y"
          case 5: // "carro X para Y"
            vehicleId = this.cleanVehicleId(match[1]);
            toDriver = this.cleanDriverName(match[2]);
            break;
            
          case 2: // "Y recibe el carro X"
            toDriver = this.cleanDriverName(match[1]);
            vehicleId = this.cleanVehicleId(match[2]);
            break;
            
          case 4: // "X deja el carro, Y lo toma"
            fromDriver = this.cleanDriverName(match[1]);
            vehicleId = this.cleanVehicleId(match[2]);
            toDriver = this.cleanDriverName(match[3]);
            break;
        }

        if (vehicleId && toDriver) {
          transfers.push({
            vehicleId,
            fromDriver: fromDriver || null,
            toDriver,
            patternUsed: patternIndex,
            confidence: this.calculateConfidence(match[0], patternIndex)
          });
        }
      }
    });

    return transfers;
  }

  /**
   * Extrae fecha y hora de una línea de texto
   * @param {string} text - Texto a analizar
   * @returns {Date|null} Fecha extraída o null
   */
  extractDateTime(text) {
    for (const pattern of this.dateTimePatterns) {
      pattern.lastIndex = 0; // Resetear índice
      const match = pattern.exec(text);
      
      if (match) {
        try {
          let dateStr = match[1];
          let timeStr = match[2];
          
          // Convertir formato de fecha si es necesario
          if (dateStr.includes('/')) {
            const dateParts = dateStr.split('/');
            if (dateParts[2].length === 2) {
              // Asumir que años de 2 dígitos son del 2000+
              dateParts[2] = '20' + dateParts[2];
            }
            dateStr = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
          
          // Remover segundos si están presentes
          if (timeStr.split(':').length === 3) {
            timeStr = timeStr.substring(0, 5);
          }
          
          const dateTime = new Date(`${dateStr}T${timeStr}:00`);
          return isNaN(dateTime.getTime()) ? null : dateTime;
        } catch (error) {
          console.warn('Error parseando fecha:', error);
        }
      }
    }
    
    return null;
  }

  /**
   * Limpia y normaliza el ID del vehículo
   * @param {string} vehicleId - ID del vehículo sin limpiar
   * @returns {string} ID limpio
   */
  cleanVehicleId(vehicleId) {
    if (!vehicleId) return '';
    
    return vehicleId
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .replace(/[^\w\s\-]/g, '') // Solo letras, números, espacios y guiones
      .trim();
  }

  /**
   * Limpia y normaliza el nombre del conductor
   * @param {string} driverName - Nombre sin limpiar
   * @returns {string} Nombre limpio
   */
  cleanDriverName(driverName) {
    if (!driverName) return '';
    
    let cleaned = driverName.trim();
    
    // Aplicar patrones de limpieza
    this.cleanNamePatterns.forEach(pattern => {
      if (typeof pattern === 'string') {
        cleaned = cleaned.replace(new RegExp(pattern, 'g'), ' ');
      } else {
        cleaned = cleaned.replace(pattern, ' ');
      }
    });
    
    return cleaned
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar primera letra de cada palabra
  }

  /**
   * Calcula un puntaje de confianza para la transferencia detectada
   * @param {string} matchText - Texto que hizo match
   * @param {number} patternIndex - Índice del patrón usado
   * @returns {number} Puntaje de confianza (0-1)
   */
  calculateConfidence(matchText, patternIndex) {
    let confidence = 0.7; // Base de confianza
    
    // Patrones más específicos tienen mayor confianza
    const patternConfidence = [0.9, 0.85, 0.8, 0.9, 0.75, 0.7];
    confidence = patternConfidence[patternIndex] || 0.7;
    
    // Aumentar confianza si hay palabras clave adicionales
    const keyWords = ['transferir', 'entrego', 'paso', 'recibe'];
    const keyWordCount = keyWords.filter(word => 
      matchText.toLowerCase().includes(word)
    ).length;
    
    confidence += keyWordCount * 0.05;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Elimina transferencias duplicadas
   * @param {Array} transfers - Array de transferencias
   * @returns {Array} Array sin duplicados
   */
  deduplicateTransfers(transfers) {
    const seen = new Set();
    return transfers.filter(transfer => {
      const key = `${transfer.vehicleId}-${transfer.toDriver}-${transfer.dateTime?.getTime() || 'no-date'}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Procesa un archivo CSV específicamente
   * @param {string} csvContent - Contenido del CSV
   * @returns {Array} Array de transferencias
   */
  parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const transfers = [];
    
    // Asumir que el CSV tiene columnas: fecha, hora, remitente, mensaje
    for (let i = 1; i < lines.length; i++) { // Saltar header
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Parsear CSV simple (puede necesitar ajustes según formato específico)
        const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
        
        if (columns.length >= 4) {
          const [date, time, sender, message] = columns;
          const fullText = `${date} ${time} ${sender}: ${message}`;
          
          const foundTransfers = this.findTransferPatterns(message);
          foundTransfers.forEach(transfer => {
            transfers.push({
              ...transfer,
              dateTime: this.parseCSVDateTime(date, time),
              sender,
              originalText: fullText,
              lineNumber: i + 1
            });
          });
        }
      } catch (error) {
        console.warn(`Error procesando línea ${i}:`, error);
      }
    }
    
    return this.deduplicateTransfers(transfers);
  }

  /**
   * Parsea fecha y hora de CSV
   * @param {string} date - Fecha en formato CSV
   * @param {string} time - Hora en formato CSV
   * @returns {Date|null} Fecha parseada
   */
  parseCSVDateTime(date, time) {
    try {
      const dateTime = new Date(`${date} ${time}`);
      return isNaN(dateTime.getTime()) ? null : dateTime;
    } catch {
      return null;
    }
  }
}

export default new WhatsAppParser();