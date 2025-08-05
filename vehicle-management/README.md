# VehicleManager - Sistema de Gestión de Conductores y Vehículos

Una aplicación web completa desarrollada con **Vite + React** y **Firebase** para gestionar conductores, vehículos y transferencias. Incluye un analizador inteligente de chats de WhatsApp para extraer automáticamente transferencias de vehículos entre conductores.

## 🚀 Características Principales

### ✨ Funcionalidades
- **CRUD Completo**: Gestión de conductores y vehículos con operaciones crear, leer, actualizar y eliminar
- **Analizador de WhatsApp**: Procesamiento automático de chats (.txt/.csv) para extraer transferencias
- **Gestión por Departamentos**: Organización de data por Sucre y Córdoba con selectores visuales
- **Detección de Cambios**: Sistema inteligente que detecta si ya se procesó data del día y qué cambió
- **Alertas Automáticas**: Envío de emails a `dylan01aponte@gmail.com` si no se procesa data diariamente
- **Historial de Transferencias**: Registro completo con filtros avanzados por departamento
- **Dashboard Interactivo**: Estadísticas en tiempo real y acciones rápidas
- **Estados Dinámicos**: Gestión de estados (activo/inactivo/mantenimiento)
- **Asignación Inteligente**: Control de qué conductor tiene cada vehículo

### 🎨 Diseño
- **Minimalista**: Paleta blanco/negro con acentos sutiles
- **Responsive**: Totalmente adaptable a móviles y tablets
- **Intuitivo**: Interfaz limpia y fácil de usar
- **Accesible**: Diseño pensado para todos los usuarios

### 🔧 Tecnologías
- **Frontend**: Vite + React 18 + React Router
- **Backend**: Firebase Firestore
- **Estilos**: CSS personalizado con variables
- **Análisis**: Expresiones regulares avanzadas para parsing de texto

## 📋 Requisitos Previos

- **Node.js** 16 o superior
- **npm** o **yarn**
- **Cuenta de Firebase** con proyecto configurado

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd vehicle-management
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Firestore Database
3. Obtener las credenciales del proyecto
4. Editar `src/firebase/config.js` con tus credenciales:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-project-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 4. Configurar reglas de Firestore

En Firebase Console > Firestore Database > Reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura a todas las colecciones
    // En producción, implementar reglas de seguridad apropiadas
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. Configurar EmailJS (Opcional - Para Alertas)

1. Crear cuenta gratuita en [EmailJS](https://www.emailjs.com/)
2. Configurar un servicio de email (Gmail, Outlook, etc.)
3. Crear un template de email
4. Editar `src/config/emailConfig.js` con tus credenciales:

```javascript
export const emailConfig = {
  serviceId: 'tu_service_id',
  templateId: 'tu_template_id', 
  userId: 'tu_user_id',
  adminEmail: 'dylan01aponte@gmail.com'
};
```

### 6. Ejecutar la aplicación
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📱 Uso de la Aplicación

### 🏠 Dashboard
- **Estadísticas generales**: Resumen de conductores, vehículos y transferencias
- **Acciones rápidas**: Enlaces directos a las principales funciones
- **Actividad reciente**: Últimas transferencias y asignaciones

### 👤 Gestión de Conductores
- **Crear/Editar**: Formulario completo con validación
- **Estados**: Activar/desactivar conductores
- **Información**: Nombre, licencia, teléfono, email

### 🚗 Gestión de Vehículos
- **Crear/Editar**: Datos completos del vehículo
- **Estados**: Activo, inactivo, mantenimiento
- **Asignación**: Control directo de conductor asignado
- **Información**: Placa, marca, modelo, año, color

### 📱 Procesador de Chats de WhatsApp

#### Formatos Soportados
- **Archivos .txt**: Exportación directa de WhatsApp
- **Archivos .csv**: Con columnas fecha, hora, remitente, mensaje
- **Tamaño máximo**: 10MB por archivo

#### Patrones Reconocidos
El analizador detecta automáticamente estos patrones:
- `"le paso el carro ABC-123 a Juan"`
- `"el carro XYZ-456 se lo paso a María"`
- `"Pedro recibe el carro DEF-789"`
- `"transferir carro GHI-012 a Luis"`
- `"carro JKL-345 para Ana"`

#### Proceso de Análisis
1. **Departamento**: Seleccionar entre Sucre 🌊 o Córdoba 🌿
2. **Upload**: Arrastrar archivo o seleccionar
3. **Análisis**: Procesamiento automático con IA
4. **Validación**: Revisión de coincidencias encontradas
5. **Corrección**: Ajustes manuales si es necesario
6. **Guardado**: Almacenamiento en base de datos con departamento

### 📊 Historial de Transferencias
- **Filtros avanzados**: Por vehículo, conductor, fecha, fuente y departamento
- **Estadísticas**: Contadores dinámicos por departamento
- **Detalles completos**: Información de cada transferencia con departamento
- **Visualización**: Badges de colores distintivos para cada departamento
- **Texto original**: Acceso al mensaje de WhatsApp original

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── DriverForm.jsx
│   ├── DriverList.jsx
│   ├── VehicleForm.jsx
│   ├── VehicleList.jsx
│   ├── TransferList.jsx
│   ├── TransferPreview.jsx
│   ├── FileUpload.jsx
│   ├── Modal.jsx
│   └── Navbar.jsx
├── pages/               # Páginas principales
│   ├── Dashboard.jsx
│   ├── Drivers.jsx
│   ├── Vehicles.jsx
│   ├── Transfers.jsx
│   └── ChatUpload.jsx
├── services/           # Servicios de datos
│   └── firebaseService.js
├── utils/              # Utilidades
│   └── whatsappParser.js
├── models/             # Modelos de datos
│   └── index.js
├── firebase/           # Configuración Firebase
│   └── config.js
└── index.css          # Estilos globales
```

## 🎨 Personalización de Estilos

El diseño utiliza variables CSS para fácil personalización:

```css
:root {
  /* Colores principales */
  --color-primary: #000000;
  --color-secondary: #333333;
  --color-tertiary: #666666;
  
  /* Colores de estado */
  --color-success: #2e7d32;
  --color-warning: #f57c00;
  --color-error: #d32f2f;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
}
```

## 🔍 Funcionalidades Avanzadas

### Analizador de Texto Inteligente
- **Múltiples patrones**: 6+ expresiones regulares diferentes
- **Limpieza automática**: Normalización de nombres y placas
- **Detección de fechas**: Extracción automática de timestamps
- **Puntaje de confianza**: Evaluación de la calidad del match
- **Sugerencias**: Recomendaciones para matches parciales

### Sistema de Detección de Cambios
- **Verificación diaria**: Detecta si ya se procesó data para una fecha específica
- **Comparación inteligente**: Identifica qué cambió entre procesamientos
- **Hash de datos**: Genera firmas únicas para detectar cambios exactos
- **Recomendaciones**: Sugiere si procesar o no según los cambios detectados

### Sistema de Alertas Automáticas
- **Verificación periódica**: Chequea cada hora si se debe enviar alerta
- **Email automático**: Envía alerta a `dylan01aponte@gmail.com` si no se procesa data
- **Prevención de spam**: Solo una alerta por día sin procesar
- **Configuración flexible**: Horarios y días personalizables

### Validación de Datos
- **Modelos con validación**: Clases con métodos de validación integrados
- **Feedback en tiempo real**: Errores mostrados inmediatamente
- **Consistencia**: Validación tanto en frontend como en modelo de datos

### Gestión de Estados
- **Estados múltiples**: Diferentes estados para conductores y vehículos
- **Transiciones inteligentes**: Lógica para cambios de estado
- **Visualización clara**: Badges y colores distintivos

## 🚀 Despliegue

### Build de Producción
```bash
npm run build
```

### Deploy en Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Variables de Entorno
Para producción, considera usar variables de entorno:

```bash
# .env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-dominio
VITE_FIREBASE_PROJECT_ID=tu-project-id
```

## 🧪 Testing

```bash
# Ejecutar tests (si se implementan)
npm run test

# Linting
npm run lint

# Preview de build
npm run preview
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. **Issues**: Crear un issue en GitHub
2. **Documentación**: Revisar este README
3. **Firebase**: Consultar [documentación oficial](https://firebase.google.com/docs)

## 🔄 Actualizaciones Futuras

### Próximas Funcionalidades
- [ ] Autenticación de usuarios
- [ ] Notificaciones push
- [ ] Exportación de reportes
- [ ] API REST
- [ ] App móvil nativa
- [ ] Integración con GPS
- [ ] Dashboard de métricas avanzadas

### Mejoras Técnicas
- [ ] Tests unitarios e integración
- [ ] PWA (Progressive Web App)
- [ ] Optimización de rendimiento
- [ ] Caching inteligente
- [ ] Modo offline

---

**Desarrollado con ❤️ usando Vite + React + Firebase**
