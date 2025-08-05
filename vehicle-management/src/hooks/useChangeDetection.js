/**
 * @fileoverview Hook personalizado para detección de cambios diarios
 * @author VehicleManager Team
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { alertService } from '../services/AlertService.js';
import { MESSAGES } from '../constants/index.js';
import { loggers } from '../utils/logger.js';

/**
 * @typedef {Object} ChangeDetectionState
 * @property {boolean} checking - Si está verificando cambios
 * @property {Object|null} changeInfo - Información de cambios detectados
 * @property {boolean} showWarning - Si mostrar advertencia de cambios
 * @property {string|null} error - Error en detección
 */

/**
 * @typedef {Object} ChangeDetectionActions
 * @property {Function} detectChanges - Detectar cambios para una fecha y datos
 * @property {Function} recordProcessing - Registrar procesamiento diario
 * @property {Function} clearWarning - Limpiar advertencia
 * @property {Function} clearError - Limpiar error
 * @property {Function} reset - Resetear estado completo
 */

/**
 * Hook personalizado para gestionar la detección de cambios diarios
 * 
 * Proporciona:
 * - Detección de cambios en procesamientos
 * - Registro de procesamientos diarios
 * - Manejo de advertencias y errores
 * - Estado de la verificación
 * 
 * @returns {[ChangeDetectionState, ChangeDetectionActions]} Estado y acciones
 */
export const useChangeDetection = () => {
  const logger = loggers.ui;
  
  // Estado de detección de cambios
  const [state, setState] = useState({
    checking: false,
    changeInfo: null,
    showWarning: false,
    error: null
  });

  /**
   * Actualiza el estado de forma segura
   * @param {Partial<ChangeDetectionState>} updates - Actualizaciones del estado
   */
  const updateState = useCallback((updates) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }));
  }, []);

  /**
   * Detecta cambios para una fecha y datos específicos
   * @param {Date} date - Fecha a verificar
   * @param {Object} processingData - Datos del procesamiento
   * @returns {Promise<Object>} Resultado de la detección
   */
  const detectChanges = useCallback(async (date, processingData) => {
    const timer = logger.timer('changeDetection');
    updateState({ checking: true, error: null });

    try {
      logger.info('Starting change detection', {
        date: date.toISOString().split('T')[0],
        transfersCount: processingData.transfersCount
      });

      const changeInfo = await alertService.detectChanges(date, processingData);
      
      // Determinar si mostrar advertencia
      const shouldShowWarning = changeInfo.hasChanges && 
                               !changeInfo.isFirstProcessing && 
                               changeInfo.changes.length > 0;

      updateState({
        checking: false,
        changeInfo,
        showWarning: shouldShowWarning,
        error: changeInfo.error || null
      });

      logger.info('Change detection completed', {
        hasChanges: changeInfo.hasChanges,
        isFirstProcessing: changeInfo.isFirstProcessing,
        changesCount: changeInfo.changes?.length || 0,
        recommendation: changeInfo.recommendation
      });

      timer.end(changeInfo);
      return changeInfo;

    } catch (error) {
      logger.error('Change detection failed', error, {
        date: date.toISOString().split('T')[0],
        processingData
      });

      const errorInfo = {
        hasChanges: true,
        isFirstProcessing: true,
        changes: [],
        recommendation: 'Procesar - Error en detección',
        error: error.message
      };

      updateState({
        checking: false,
        changeInfo: errorInfo,
        showWarning: false,
        error: error.message
      });

      timer.fail(error);
      return errorInfo;
    }
  }, [updateState, logger]);

  /**
   * Registra un procesamiento diario
   * @param {Date} date - Fecha del procesamiento
   * @param {Object} processingData - Datos del procesamiento
   * @returns {Promise<Object>} Registro creado
   */
  const recordProcessing = useCallback(async (date, processingData) => {
    const timer = logger.timer('recordProcessing');

    try {
      logger.info('Recording daily processing', {
        date: date.toISOString().split('T')[0],
        transfersCount: processingData.transfersCount,
        source: processingData.source
      });

      const record = await alertService.recordDailyProcessing(date, processingData);

      // Limpiar estado después de registrar exitosamente
      updateState({
        changeInfo: null,
        showWarning: false,
        error: null
      });

      logger.info('Daily processing recorded successfully', {
        date: record.date,
        transfersProcessed: record.transfersProcessed
      });

      timer.end(record);
      return record;

    } catch (error) {
      logger.error('Failed to record daily processing', error, {
        date: date.toISOString().split('T')[0],
        processingData
      });

      updateState({
        error: `Error registrando procesamiento: ${error.message}`
      });

      timer.fail(error);
      throw error;
    }
  }, [updateState, logger]);

  /**
   * Obtiene mensaje de estado basado en la detección de cambios
   * @returns {Object} Mensaje de estado
   */
  const getStatusMessage = useCallback(() => {
    const { changeInfo } = state;
    
    if (!changeInfo) {
      return null;
    }

    if (changeInfo.error) {
      return {
        type: 'error',
        message: `Error en detección: ${changeInfo.error}`
      };
    }

    if (!changeInfo.hasChanges) {
      return {
        type: 'warning',
        message: `${MESSAGES.WARNING.NO_CHANGES_DETECTED} - Data idéntica a la procesada anteriormente`
      };
    }

    if (changeInfo.isFirstProcessing) {
      return {
        type: 'success',
        message: `${MESSAGES.INFO.FIRST_PROCESSING} - Proceder con el procesamiento`
      };
    }

    return {
      type: 'info',
      message: `${MESSAGES.INFO.CHANGES_DETECTED} - Se recomienda procesar`
    };
  }, [state]);

  /**
   * Obtiene detalles de los cambios detectados
   * @returns {Array} Lista de cambios con descripciones
   */
  const getChangeDetails = useCallback(() => {
    const { changeInfo } = state;
    
    if (!changeInfo || !changeInfo.changes) {
      return [];
    }

    return changeInfo.changes.map(change => ({
      ...change,
      severity: change.type === 'transfers_count' ? 'high' : 'medium',
      icon: change.type === 'transfers_count' ? '📊' : '📁'
    }));
  }, [state]);

  // Acciones disponibles
  const actions = {
    /**
     * Detectar cambios para fecha y datos específicos
     */
    detectChanges,

    /**
     * Registrar procesamiento diario
     */
    recordProcessing,

    /**
     * Limpiar advertencia de cambios
     */
    clearWarning: useCallback(() => {
      updateState({ showWarning: false });
    }, [updateState]),

    /**
     * Limpiar error actual
     */
    clearError: useCallback(() => {
      updateState({ error: null });
    }, [updateState]),

    /**
     * Resetear estado completo
     */
    reset: useCallback(() => {
      updateState({
        checking: false,
        changeInfo: null,
        showWarning: false,
        error: null
      });
    }, [updateState]),

    /**
     * Obtener mensaje de estado
     */
    getStatusMessage,

    /**
     * Obtener detalles de cambios
     */
    getChangeDetails
  };

  return [state, actions];
};

/**
 * Hook simplificado para verificar solo si hay procesamiento previo
 * @param {Date} date - Fecha a verificar
 * @returns {Object} Estado de verificación
 */
export const useDailyProcessingCheck = (date) => {
  const [state, setState] = useState({
    loading: true,
    processed: false,
    lastProcessing: null,
    error: null
  });

  const checkProcessing = useCallback(async () => {
    if (!date) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await alertService.checkDailyProcessing(date);
      
      setState({
        loading: false,
        processed: result.processed,
        lastProcessing: result.lastProcessing,
        error: result.error || null
      });

    } catch (error) {
      loggers.ui.error('Failed to check daily processing', error);
      
      setState({
        loading: false,
        processed: false,
        lastProcessing: null,
        error: error.message
      });
    }
  }, [date]);

  // Verificar automáticamente cuando cambie la fecha
  useEffect(() => {
    checkProcessing();
  }, [checkProcessing]);

  return {
    ...state,
    refetch: checkProcessing
  };
};

export default useChangeDetection;