import { useEffect, useState } from 'react';
import alertService from '../services/alertService';

const DailyAlertChecker = () => {
  const [alertStatus, setAlertStatus] = useState({
    checking: false,
    lastCheck: null,
    alertsSent: 0,
    error: null
  });

  useEffect(() => {
    // Verificar alertas al cargar la aplicación
    checkAlerts();

    // Configurar verificación periódica cada hora
    const interval = setInterval(checkAlerts, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, []);

  const checkAlerts = async () => {
    try {
      setAlertStatus(prev => ({ ...prev, checking: true, error: null }));
      
      await alertService.checkAndSendDailyAlerts();
      
      setAlertStatus(prev => ({
        ...prev,
        checking: false,
        lastCheck: new Date(),
        alertsSent: prev.alertsSent + 1
      }));
    } catch (error) {
      console.error('Error verificando alertas:', error);
      setAlertStatus(prev => ({
        ...prev,
        checking: false,
        error: error.message,
        lastCheck: new Date()
      }));
    }
  };

  const manualCheck = async () => {
    await checkAlerts();
  };

  // Solo mostrar en desarrollo o para administradores
  const isDevelopment = import.meta.env.DEV;
  if (!isDevelopment) {
    return null; // Ocultar en producción
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-border rounded-lg shadow-md p-sm max-w-xs">
      <div className="flex items-center justify-between mb-xs">
        <h4 className="text-sm font-semibold">Sistema de Alertas</h4>
        <button
          onClick={manualCheck}
          disabled={alertStatus.checking}
          className="btn btn-sm btn-secondary"
          title="Verificar alertas manualmente"
        >
          {alertStatus.checking ? '⏳' : '🔄'}
        </button>
      </div>
      
      <div className="text-xs text-gray">
        <div className="mb-xs">
          <strong>Estado:</strong> {alertStatus.checking ? 'Verificando...' : 'Activo'}
        </div>
        
        {alertStatus.lastCheck && (
          <div className="mb-xs">
            <strong>Última verificación:</strong><br />
            {alertStatus.lastCheck.toLocaleString()}
          </div>
        )}
        
        {alertStatus.error && (
          <div className="text-error mb-xs">
            <strong>Error:</strong> {alertStatus.error}
          </div>
        )}
        
        <div className="mb-xs">
          <strong>Email configurado:</strong><br />
          dylan01aponte@gmail.com
        </div>
        
        <div className="text-xs text-gray">
          Verificación automática cada hora
        </div>
      </div>
    </div>
  );
};

export default DailyAlertChecker;