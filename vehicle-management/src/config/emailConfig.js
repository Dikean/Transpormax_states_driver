// Configuración para EmailJS
// Para configurar:
// 1. Crear cuenta en https://www.emailjs.com/
// 2. Crear un servicio de email (Gmail, Outlook, etc.)
// 3. Crear un template de email
// 4. Obtener las credenciales y reemplazar aquí

export const emailConfig = {
  // Credenciales de EmailJS (reemplazar con las tuyas)
  serviceId: 'your_service_id',
  templateId: 'your_template_id', 
  userId: 'your_user_id',
  
  // Email del administrador
  adminEmail: 'dylan01aponte@gmail.com',
  
  // Configuración de alertas
  alertSettings: {
    // Hora después de la cual enviar alerta si no se procesó data del día
    alertAfterHour: 18, // 6 PM
    
    // Días de la semana para enviar alertas (0 = Domingo, 6 = Sábado)
    alertDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    
    // Máximo de alertas por día
    maxAlertsPerDay: 2
  },
  
  // Templates de mensajes
  templates: {
    dailyAlert: {
      subject: '🚨 ALERTA: Procesamiento diario pendiente - {{date}}',
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
    },
    
    changeDetected: {
      subject: '📝 VehicleManager: Cambios detectados en procesamiento',
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
    }
  }
};

// Función para verificar si EmailJS está configurado
export const isEmailConfigured = () => {
  return (
    emailConfig.serviceId !== 'your_service_id' &&
    emailConfig.templateId !== 'your_template_id' &&
    emailConfig.userId !== 'your_user_id'
  );
};

// Función para obtener configuración de desarrollo/producción
export const getEmailConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    return {
      ...emailConfig,
      // En desarrollo, usar configuración de prueba
      adminEmail: 'dylan01aponte@gmail.com',
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || emailConfig.serviceId,
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || emailConfig.templateId,
      userId: import.meta.env.VITE_EMAILJS_USER_ID || emailConfig.userId
    };
  }
  
  return emailConfig;
};