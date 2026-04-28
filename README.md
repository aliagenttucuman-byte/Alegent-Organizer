# 🤖 Alegent Calendar Organizer (Local-First AI Agent)

Alegent Organizer es una aplicación agentica de última generación para la gestión inteligente de agendas. Está diseñada bajo la filosofía **Local-First**, donde la privacidad y la velocidad son la prioridad: los datos residen exclusivamente en el dispositivo del usuario.

---

## 🏗️ Arquitectura del Sistema (Edge Computing)

1.  **Interfaz (React Native / Expo):** Diseño futurista Dark Mode con alta respuesta táctil.
2.  **Cerebro Agentico (OpenRouter):** Utiliza el modelo `minimax/minimax-m2.5:free` para interpretar lenguaje natural y decidir acciones sobre la agenda.
3.  **Motor de Voz (Groq Cloud):** Transcripción ultra-veloz mediante el modelo Open Source `Whisper Large V3`.
4.  **Almacenamiento (SQLite):** Base de datos relacional interna (`expo-sqlite`) para una persistencia segura y offline.

---

## 🛠️ Stack Tecnológico

-   **Frontend:** React Native (Expo SDK 54/55).
-   **IA Razonamiento:** OpenRouter API.
-   **IA Voz:** Groq API (Whisper).
-   **Persistencia:** SQLite Local.
-   **Estilos:** Expo Linear Gradient + Neón Themes.

---

## ⚙️ Configuración de API Keys

La configuración de las llaves se encuentra en `frontend/AgentLocal.js`:
-   `OPENROUTER_API_KEY`: Para la inteligencia de razonamiento.
-   `GROQ_API_KEY`: Para la transcripción de audio a texto.

---

## 🚀 Instalación y Ejecución Local

```powershell
# 1. Acceder a la carpeta del proyecto
cd frontend

# 2. Instalar dependencias (ignorar conflictos de peer dependencies)
npm install --force

# 3. Iniciar entorno de desarrollo
npx expo start
```
*Escanea el código QR con la app **Expo Go** en tu Android.*

---

## 📱 Funcionalidades Destacadas

### 🎤 Control por Voz (Groq)
-   Mantén presionado el icono **🎙️** para grabar tu comando.
-   Ejemplo: *"Agendar reunión con el equipo el viernes a las 11 AM"*.
-   La IA transcribirá y agendará automáticamente.

### 📅 Dashboard Inteligente
-   **Resaltado Neón:** La aplicación identifica y resalta tu próxima reunión de forma automática.
-   **Badge de Pendientes:** Contador en tiempo real de eventos futuros en la barra superior.
-   **Calendario Activo:** Toca cualquier día para filtrar la lista instantáneamente.

### 🛠️ Consola Debug en Tiempo Real
-   Accede al botón **DEBUG** para ver la traza del sistema.
-   Incluye test de conectividad a Internet y traza de base de datos desde el arranque.

---

## 🆘 Solución de Problemas (Troubleshooting)

Si encuentras errores de base de datos (NullPointer) o el empaquetador de Metro se bloquea:

1.  **Limpiar PC:**
    ```powershell
    cmd /c "rd /s /q .expo"
    cmd /c "rd /s /q node_modules"
    npm install --force
    npx expo start --clear
    ```
2.  **Limpiar Celular:** Ve a *Ajustes > Aplicaciones > Expo Go > Borrar Datos*.

---

## 👨‍💻 Autor
**Nelson Acosta** - *AliAgent Creator*
*Impulsando la productividad con Inteligencia Artificial Local.*
