# 🚚 LogisticsRoute App# LogisticsRoute App - MVP



Aplicación móvil para optimización de rutas de entrega con IA integrada. Desarrollada con React Native, Supabase y Google Maps API.Una aplicación móvil para optimizar rutas de entrega de empresas de logística, ahorrando tiempo, combustible y costos operativos.



## 📋 Tabla de Contenidos## Estructura del Proyecto



- [Características](#-características)El proyecto está dividido en dos partes principales:

- [Tecnologías](#-tecnologías)

- [Requisitos Previos](#-requisitos-previos)- **Frontend**: Aplicación móvil desarrollada con React Native y Expo

- [Instalación](#-instalación)- **Backend**: API REST desarrollada con Node.js, Express y PostgreSQL

- [Configuración](#-configuración)

- [Ejecución](#-ejecución)## Requisitos Previos

- [Estructura del Proyecto](#-estructura-del-proyecto)

Para ejecutar este proyecto necesitas:

## ✨ Características

- Node.js (v14 o superior)

- 🔐 Autenticación con email y OTP- npm o yarn

- 📍 Optimización de rutas con Google Maps- PostgreSQL (v12 o superior)

- 🤖 Asistente virtual con Gemini AI- Expo CLI (`npm install -g expo-cli`)

- 📊 Dashboard con estadísticas- Una cuenta de Google Cloud para obtener las API Keys de Google Maps

- ⛽ Cálculo de ahorro de combustible

- 🗺️ Visualización de rutas en mapa## Configuración del Backend

- 📱 Interfaz responsive

1. Navega a la carpeta del backend:

## 🛠️ Tecnologías   ```

   cd backend

- **Frontend:** React Native + Expo SDK 54   ```

- **Backend:** Supabase (PostgreSQL + Auth)

- **Mapas:** Google Maps API (Geocoding, Directions, Places)2. Instala las dependencias:

- **IA:** Google Gemini AI 2.0   ```

- **UI:** React Native Paper   npm install

   ```

## 📦 Requisitos Previos

3. Configura la base de datos PostgreSQL:

Antes de comenzar, asegúrate de tener instalado:   - Crea una base de datos en PostgreSQL

   - Ejecuta el script de configuración:

- **Node.js** (v18 o superior) - [Descargar](https://nodejs.org/)     ```

- **npm** (viene con Node.js) o **yarn**     psql -U postgres -f database_setup.sql

- **Git** - [Descargar](https://git-scm.com/)     ```

- **Expo CLI:** `npm install -g expo-cli`

- **Expo Go** app en tu teléfono móvil:4. Configura las variables de entorno:

  - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)   - Copia el archivo `.env.example` a `.env`

  - [iOS](https://apps.apple.com/app/expo-go/id982107779)   - Edita el archivo `.env` con tus configuraciones



## 🚀 Instalación5. Inicia el servidor:

   ```

### 1. Clonar el repositorio   npm run dev

   ```

```bash

git clone https://github.com/tu-usuario/LogisticsRouteApp.gitEl servidor estará disponible en `http://localhost:5000`.

cd LogisticsRouteApp

```## Configuración del Frontend



### 2. Instalar dependencias1. Navega a la carpeta del frontend:

   ```

#### Frontend   cd frontend

```bash   ```

cd frontend

npm install2. Instala las dependencias:

```   ```

   npm install

#### Backend (opcional, si usas el servidor Node.js)   ```

```bash

cd backend3. Configura las API Keys:

npm install   - Edita el archivo `src/services/api.js` y agrega tu API Key de Google Maps

```

4. Inicia la aplicación con Expo:

## ⚙️ Configuración   ```

   npm start

### 1. Configurar Supabase   ```



#### a) Crear proyecto en Supabase5. Escanea el código QR con la aplicación Expo Go en tu dispositivo móvil o utiliza un emulador.



1. Ve a [Supabase](https://supabase.com) y crea una cuenta## Configuración de la API de Google Maps

2. Click en "New Project"

3. Completa:Para utilizar las funcionalidades de mapas y optimización de rutas, necesitas configurar las siguientes APIs en Google Cloud Console:

   - **Name:** LogisticsRoute

   - **Database Password:** (guarda esta contraseña)1. Maps JavaScript API

   - **Region:** Elige la más cercana a tus usuarios2. Places API

4. Click en "Create Project" (toma 2-3 minutos)3. Directions API

4. Geocoding API

#### b) Ejecutar el esquema de base de datos

Pasos:

1. En Supabase Dashboard, ve a **SQL Editor** (menú lateral)1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/)

2. Click en **"New Query"**2. Habilita las APIs mencionadas

3. Abre el archivo `database_schema.sql` de este proyecto3. Crea una API Key con restricciones adecuadas

4. Copia TODO el contenido y pégalo en el editor4. Configura la API Key en el frontend y backend

5. Click en **"Run"** o presiona `Ctrl+Enter`

6. Verifica que aparezca: "Success. No rows returned"## Características Principales



#### c) Configurar autenticación- Autenticación con sistema OTP por correo

- Optimización de rutas de entrega

1. Ve a **Authentication** → **Providers**- Seguimiento de entregas en tiempo real

2. Habilita **Email**:- Cálculo de ahorro de combustible

   - ✅ Enable Email provider- Dashboard con métricas y estadísticas

   - ✅ Confirm email: OFF (para desarrollo)- Historial de rutas y entregas

   - ✅ Secure email change: OFF (para desarrollo)

3. Click en **Save**## Tecnologías Utilizadas



#### d) Configurar SMTP (envío de OTP)### Frontend

- React Native

1. Ve a **Authentication** → **Email Templates**- Expo

2. En "SMTP Settings":- React Navigation

   - **SMTP Host:** `smtp.gmail.com`- React Native Maps

   - **Port:** `587`- React Native Paper (UI)

   - **Sender Email:** tu correo de Gmail- Axios

   - **Sender Name:** LogisticsRoute- AsyncStorage

   - **Username:** tu correo de Gmail

   - **Password:** Contraseña de aplicación de Gmail### Backend

3. Click en **Save**- Node.js

- Express.js

> **Nota:** Para crear una contraseña de aplicación de Gmail:- PostgreSQL

> 1. Ve a [Seguridad de Google](https://myaccount.google.com/security)- Sequelize ORM

> 2. Habilita "Verificación en 2 pasos"- JSON Web Tokens (JWT)

> 3. Ve a "Contraseñas de aplicaciones"- Nodemailer

> 4. Genera una nueva contraseña para "Correo"- Winston (logging)



#### e) Obtener credenciales de Supabase## Contribución



1. Ve a **Settings** → **API**Este es un proyecto MVP en desarrollo. Para contribuir:

2. Copia estos valores:

   - **Project URL:** `https://tu-proyecto.supabase.co`1. Haz un fork del repositorio

   - **anon public key:** `eyJhbG...` (clave larga)2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)

3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)

### 2. Configurar Google Maps API4. Push a la rama (`git push origin feature/amazing-feature`)

5. Abre un Pull Request

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)

2. Crea un nuevo proyecto o selecciona uno existente## Licencia

3. Ve a **APIs & Services** → **Library**

4. Habilita estas APIs:Este proyecto es privado y confidencial.

   - ✅ Maps SDK for Android
   - ✅ Maps SDK for iOS
   - ✅ Geocoding API
   - ✅ Directions API
   - ✅ Distance Matrix API
   - ✅ Places API
5. Ve a **Credentials** → **Create Credentials** → **API Key**
6. Copia la API Key generada
7. (Opcional) Restringe la key:
   - Application restrictions: **Android apps** e **iOS apps**
   - API restrictions: Selecciona solo las APIs habilitadas arriba

### 3. Configurar Gemini AI

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Click en **"Create API Key"**
4. Selecciona un proyecto de Google Cloud (o crea uno nuevo)
5. Copia la API Key generada
6. Verifica que el modelo `gemini-2.0-flash-exp` esté disponible

### 4. Configurar Variables de Entorno

#### Frontend

1. Ve a la carpeta `frontend/`
2. Crea el archivo `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

3. Abre `.env` y completa con tus credenciales:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbG...tu_clave_publica
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...tu_api_key_de_google
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...tu_api_key_de_gemini
OTP_EXPIRES_IN=600000
OTP_LENGTH=4
```

#### Backend (opcional)

1. Ve a la carpeta `backend/`
2. Crea el archivo `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

3. Completa con tus credenciales:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
GOOGLE_MAPS_API_KEY=tu_api_key_de_google
OTP_EXPIRES_IN=600000
OTP_LENGTH=4
```

## 🎮 Ejecución

### Iniciar el proyecto

1. Ve a la carpeta frontend:

```bash
cd frontend
```

2. Inicia el servidor de desarrollo:

```bash
npm start
# o
expo start
```

3. Verás un QR code en la terminal

### Ejecutar en dispositivo físico

#### Android:
1. Abre **Expo Go** en tu teléfono Android
2. Escanea el QR code desde la app Expo Go
3. Espera a que cargue la aplicación

#### iOS:
1. Abre la app **Cámara** de iOS
2. Escanea el QR code
3. Click en la notificación que aparece
4. Se abrirá en Expo Go

### Ejecutar en emulador

#### Android (Emulador):
```bash
npm run android
```

#### iOS (Simulator - solo Mac):
```bash
npm run ios
```

## 📁 Estructura del Proyecto

```
LogisticsRouteApp/
├── frontend/                  # Aplicación React Native
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   └── AddressInput.js
│   │   ├── screens/          # Pantallas de la app
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── OtpVerificationScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── RouteOptimizationScreen.js
│   │   │   ├── RouteDetailsScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   └── ChatbotScreen.js
│   │   ├── services/         # Lógica de negocio
│   │   │   ├── supabaseService.js    # Servicios de Supabase
│   │   │   └── api.js
│   │   ├── navigation/       # Configuración de navegación
│   │   │   └── AppNavigator.js
│   │   ├── Libs/            # Librerías y configuración
│   │   │   └── supabase.ts
│   │   └── utils/           # Funciones auxiliares
│   ├── .env                 # Variables de entorno (NO subir a Git)
│   ├── .env.example         # Plantilla de variables
│   ├── app.json             # Configuración de Expo
│   └── package.json
│
├── backend/                 # Servidor Node.js (opcional)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── .env
│   └── package.json
│
├── database_schema.sql      # Esquema completo de la BD
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Este archivo
```

## 🔒 Seguridad

⚠️ **IMPORTANTE:**

- **NUNCA** subas el archivo `.env` a Git
- El archivo `.env` está en `.gitignore` por seguridad
- Solo comparte `.env.example` (sin credenciales reales)
- Cambia todas las API Keys si accidentalmente se exponen

## 🧪 Probar la Aplicación

### Flujo de prueba:

1. **Registro:**
   - Abre la app → Click en "Registrarse"
   - Completa el formulario
   - Recibirás un código OTP por email

2. **Verificación OTP:**
   - Ingresa el código de 6 dígitos
   - Puedes pegar el código completo

3. **Dashboard:**
   - Verás estadísticas de entregas
   - Click en "Nueva Ruta" para optimizar

4. **Optimización de Ruta:**
   - Ingresa 2 o más destinos
   - Click en "Optimizar Ruta"
   - Visualiza la ruta optimizada en el mapa

5. **Chatbot IA:**
   - Click en el ícono del chat
   - Pregunta sobre rutas, entregas, etc.

## 🐛 Troubleshooting

### Error: "Network request failed"
- Verifica que el dispositivo esté en la misma red que tu PC
- Revisa que las URLs en `.env` sean correctas

### Error: "API Key inválida"
- Verifica que las API Keys estén correctas en `.env`
- Asegúrate de haber habilitado las APIs en Google Cloud Console

### Error: "Row Level Security policy violation"
- Verifica que ejecutaste `database_schema.sql` completo
- Las políticas RLS deben estar creadas

### No llegan los códigos OTP
- Verifica la configuración SMTP en Supabase
- Revisa que uses una contraseña de aplicación de Gmail (no tu contraseña normal)
- Verifica la carpeta de spam

### Error: "Gemini model not found"
- El modelo `gemini-2.0-flash-exp` debe estar disponible
- Verifica que la API Key de Gemini sea válida
- Intenta regenerar la API Key

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o soporte, abre un issue en el repositorio.

---

**¡Hecho con ❤️ para optimizar rutas de entrega!**
