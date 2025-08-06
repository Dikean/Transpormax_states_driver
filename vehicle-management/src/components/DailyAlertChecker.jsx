import React from 'react';
import { useAlertSystem, useAlertConfiguration } from '../hooks/useAlertSystem.js';
import { ALERT_CONFIG } from '../constants/index.js';

/**
 * Componente para monitorear y controlar el sistema de alertas
 * Solo visible en desarrollo para debugging y testing
 */
const DailyAlertChecker = () => {
  const [alertState, alertActions] = useAlertSystem();
  const { isConfigured, loading, needsConfiguration } = useAlertConfiguration();

  // Solo mostrar en desarrollo
  const config = alertActions.getStatus().config;
  if (!config.showWidget) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-border rounded-lg shadow-md p-sm max-w-xs">
        <div className="text-center text-xs text-gray">
          ⏳ Cargando sistema de alertas...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-border rounded-lg shadow-md p-sm max-w-xs z-50">
      <div className="flex items-center justify-between mb-xs">
        <h4 className="text-sm font-semibold">
          Sistema de Alertas
          {needsConfiguration && <span className="text-warning ml-xs">⚠️</span>}
        </h4>
        <div className="flex gap-xs">
          {alertState.error && (
            <button
              onClick={alertActions.clearError}
              className="btn btn-xs btn-secondary"
              title="Limpiar error"
            >
              ✕
            </button>
          )}
          <button
            onClick={alertActions.checkAlerts}
            disabled={alertState.checking}
            className="btn btn-sm btn-secondary"
            title="Verificar alertas manualmente"
          >
            {alertState.checking ? '⏳' : '🔄'}
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray">
        <div className="mb-xs">
          <strong>Estado:</strong> {alertState.checking ? 'Verificando...' : 'Activo'}
          {!isConfigured && <span className="text-warning ml-xs">(No configurado)</span>}
        </div>
        
        {alertState.lastCheck && (
          <div className="mb-xs">
            <strong>Última verificación:</strong><br />
            {alertState.lastCheck.toLocaleString()}
          </div>
        )}

        <div className="mb-xs">
          <strong>Alertas enviadas:</strong> {alertState.alertsSent}
        </div>
        
        {alertState.error && (
          <div className="text-error mb-xs text-xs">
            <strong>Error:</strong><br />
            {alertState.error}
          </div>
        )}
        
        <div className="mb-xs">
          <strong>Email configurado:</strong><br />
          {ALERT_CONFIG.ADMIN_EMAIL}
        </div>
        
        <div className="text-xs text-gray">
          Verificación automática cada {Math.round(config.checkInterval / 60000)} min
        </div>

        {needsConfiguration && (
          <div className="mt-xs p-xs bg-warning bg-opacity-10 rounded text-xs">
            <strong>⚠️ Configuración requerida:</strong><br />
            EmailJS no está configurado. Las alertas se guardarán para envío manual.
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAlertChecker;