/**
 * @fileoverview Hook personalizado para el sistema de alertas
 * @author VehicleManager Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { alertService } from '../services/AlertService.js';
import { getEnvironmentConfig } from '../constants/index.js';
import { loggers } from '../utils/logger.js';

/**
 * @typedef {Object} AlertSystemState
 * @property {boolean} checking - Si está verificando alertas
 * @property {Date|null} lastCheck - Última verificación
 * @property {number} alertsSent - Número de alertas enviadas
 * @property {string|null} error - Error actual
 * @property {boolean} isConfigured - Si el sistema está configurado
 */

/**
 * @typedef {Object} AlertSystemActions
 * @property {Function} checkAlerts - Verificar alertas manualmente
 * @property {Function} clearError - Limpiar error actual
 * @property {Function} getStatus - Obtener estado completo
 */

/**
 * Hook personalizado para gestionar el sistema de alertas
 * 
 * Proporciona:
 * - Estado del sistema de alertas
 * - Verificación automática periódica
 * - Verificación manual
 * - Manejo de errores
 * 
 * @returns {[AlertSystemState, AlertSystemActions]} Estado y acciones
 */
export const useAlertSystem = () => {
  const logger = loggers.ui;
  const config = getEnvironmentConfig();
  const intervalRef = useRef(null);
  
  // Estado del sistema de alertas
  const [state, setState] = useState({
    checking: false,
    lastCheck: null,
    alertsSent: 0,
    error: null,
    isConfigured: true // Asumimos que está configurado inicialmente
  });

  /**
   * Actualiza el estado de forma segura
   * @param {Partial<AlertSystemState>} updates - Actualizaciones del estado
   */
  const updateState = useCallback((updates) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }));
  }, []);

  /**
   * Verifica alertas y actualiza el estado
   * @param {boolean} isManual - Si es verificación manual
   */
  const performAlertCheck = useCallback(async (isManual = false) => {
    if (state.checking) {
      logger.debug('Alert check already in progress, skipping');
      return;
    }

    const timer = logger.timer('alertCheck');
    updateState({ checking: true, error: null });

    try {
      logger.info('Starting alert check', { manual: isManual });
      
      const results = await alertService.checkAndSendDailyAlerts();
      
      updateState({
        checking: false,
        lastCheck: new Date(),
        alertsSent: state.alertsSent + results.alertsSent,
        error: results.errors.length > 0 ? 
          `Errores en verificación: ${results.errors.length}` : null
      });

      logger.info('Alert check completed', {
        manual: isManual,
        alertsChecked: results.alertsChecked,
        alertsSent: results.alertsSent,
        errors: results.errors.length
      });

      timer.end(results);
      
    } catch (error) {
      logger.error('Alert check failed', error);
      
      updateState({
        checking: false,
        lastCheck: new Date(),
        error: error.message
      });

      timer.fail(error);
    }
  }, [state.checking, state.alertsSent, updateState, logger]);

  /**
   * Configura la verificación automática periódica
   */
  const setupPeriodicCheck = useCallback(() => {
    // Limpiar intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Solo configurar en desarrollo o si está habilitado
    if (!config.showAlertWidget) {
      return;
    }

    const interval = config.alertCheckInterval;
    
    logger.info('Setting up periodic alert check', {
      intervalMs: interval,
      intervalMinutes: Math.round(interval / 60000)
    });

    intervalRef.current = setInterval(() => {
      performAlertCheck(false);
    }, interval);

    // Verificación inicial después de 30 segundos
    setTimeout(() => {
      performAlertCheck(false);
    }, 30000);

  }, [config.showAlertWidget, config.alertCheckInterval, performAlertCheck, logger]);

  /**
   * Limpia recursos al desmontar
   */
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      logger.debug('Alert system cleanup completed');
    }
  }, [logger]);

  // Configurar verificación automática al montar
  useEffect(() => {
    setupPeriodicCheck();
    return cleanup;
  }, [setupPeriodicCheck, cleanup]);

  // Acciones disponibles
  const actions = {
    /**
     * Verificar alertas manualmente
     */
    checkAlerts: useCallback(() => {
      performAlertCheck(true);
    }, [performAlertCheck]),

    /**
     * Limpiar error actual
     */
    clearError: useCallback(() => {
      updateState({ error: null });
    }, [updateState]),

    /**
     * Obtener estado completo del sistema
     */
    getStatus: useCallback(() => {
      return {
        ...state,
        config: {
          isDevelopment: config.isDevelopment,
          showWidget: config.showAlertWidget,
          checkInterval: config.alertCheckInterval
        }
      };
    }, [state, config])
  };

  return [state, actions];
};

/**
 * Hook simplificado para verificar solo el estado de configuración
 * @returns {Object} Estado de configuración
 */
export const useAlertConfiguration = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        // Verificar si los servicios están configurados
        const emailConfigured = alertService.emailService?.isEmailConfigured() || false;
        
        setIsConfigured(emailConfigured);
      } catch (error) {
        loggers.ui.error('Failed to check alert configuration', error);
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    checkConfiguration();
  }, []);

  return {
    isConfigured,
    loading,
    needsConfiguration: !loading && !isConfigured
  };
};

export default useAlertSystem;