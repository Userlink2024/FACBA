# C&A Cloud Factory - Sistema ERP para Fábrica de Calzado

## 📋 Descripción
Sistema de gestión empresarial (ERP) diseñado para **C&A Manufacturas**, una empresa familiar de maquila de calzado ubicada en Bucaramanga, Colombia. El sistema gestiona producción por destajo, nómina, inventario y recursos humanos.

## 🛠️ Stack Tecnológico
- **Frontend:** HTML5 (Multi-page), Tailwind CSS (CDN), JavaScript Vanilla ES6+
- **Backend:** Firebase (Firestore + Auth + Realtime Database)
- **Hosting:** GitHub Pages compatible

## 👥 Roles del Sistema

### 1. Anderson (Admin Finanzas)
- Gestión de órdenes de trabajo (CRUD)
- Definición de tarifas por operario
- Control de inventario de insumos
- Cálculo y cierre de nómina semanal

### 2. Carolina (Admin RRHH)
- Gestión de empleados
- Registro de asistencia (marca llegadas tardías después de 7:00 AM)
- Aplicación y levantamiento de sanciones
- **Regla de Oro:** "La familia es aparte" - Control estricto de disciplina

### 3. Operarios
- Registro de producción (pares completados)
- Visualización de ganancias semanales
- Selección de órdenes de trabajo activas

## 📁 Estructura de Archivos

```
SISTEMA CALZADO C&A/
├── index.html          # Login
├── dashboard.html      # Vista general con gráficas
├── produccion.html     # Registro de producción (operarios)
├── rrhh.html           # Panel de RRHH (Carolina)
├── finanzas.html       # Panel de Finanzas (Anderson)
├── setup.html          # Configuración inicial
├── README.md           # Este archivo
└── js/
    ├── firebase-init.js  # Configuración de Firebase
    ├── auth.js           # Autenticación y sesiones
    ├── roles.js          # Validación de permisos
    ├── utils.js          # Funciones de utilidad
    └── finanzas.js       # Lógica del módulo de finanzas
```

## 🚀 Instalación y Configuración

### Paso 1: Clonar/Descargar el Proyecto
Copie todos los archivos a su servidor web o carpeta local.

### Paso 2: Configuración de Firebase
El proyecto ya incluye la configuración de Firebase. Si desea usar su propio proyecto:
1. Cree un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilite Authentication (Email/Password)
3. Cree una base de datos Firestore
4. Cree una Realtime Database
5. Actualice las credenciales en `js/firebase-init.js`

### Paso 3: Reglas de Firebase (Modo Desarrollo)
Para desarrollo, configure las reglas en modo abierto:

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Realtime Database Rules:**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Paso 4: Inicialización de Datos
1. Abra `setup.html` en su navegador
2. Haga clic en "Inicializar Sistema"
3. Espere a que se creen los usuarios y datos de ejemplo

## 🔐 Credenciales de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Anderson | anderson@ca-factory.com | admin123 | Admin Finanzas |
| Carolina | carolina@ca-factory.com | admin123 | Admin RRHH |
| Juan Pérez | operario1@ca-factory.com | operario123 | Operario |
| María López | operario2@ca-factory.com | operario123 | Operario |
| Carlos Ruiz | operario3@ca-factory.com | operario123 | Operario |

## 📊 Modelado de Datos

### Firestore Collections

**users**
```javascript
{
  uid: string,
  nombre: string,
  email: string,
  rol: 'admin_finanzas' | 'admin_rrhh' | 'operario',
  tarifa_par: number,
  estado: 'activo' | 'sancionado',
  fecha_creacion: Timestamp
}
```

**ordenes**
```javascript
{
  id: string,
  cliente: string,
  modelo: string,
  cantidad_total: number,
  pares_hechos: number,
  estado: 'activa' | 'completada',
  fecha_creacion: Timestamp
}
```

**produccion_logs**
```javascript
{
  id: string,
  uid_operario: string,
  nombre_operario: string,
  id_orden: string,
  orden_cliente: string,
  orden_modelo: string,
  cantidad: number,
  tarifa: number,
  monto_ganado: number,
  fecha: Timestamp
}
```

**sanciones**
```javascript
{
  id: string,
  uid_operario: string,
  nombre_empleado: string,
  motivo: string,
  fecha: Timestamp,
  activa: boolean,
  fecha_levantada?: Timestamp
}
```

**inventario**
```javascript
{
  id: string,
  nombre: string,
  cantidad: number,
  unidad: string,
  minimo: number,
  consumo_por_par: number
}
```

**asistencia**
```javascript
{
  id: string,
  uid_empleado: string,
  nombre_empleado: string,
  fecha: Timestamp,
  tarde: boolean
}
```

### Realtime Database

**presence/{uid}**
```javascript
{
  online: boolean,
  nombre: string,
  lastSeen: ServerTimestamp
}
```

## 💰 Reglas de Negocio

### Cálculo de Nómina
```
Ganancia Operario = Pares Registrados × Tarifa Personal
```

### Llegadas Tardías
- Hora límite: **7:00 AM**
- Las llegadas después de esta hora se marcan en ROJO

### Sanciones
- Un operario sancionado **NO puede registrar producción**
- Solo RRHH puede aplicar y levantar sanciones

### Inventario
- Se descuenta automáticamente al cerrar la semana
- Alerta cuando el stock está por debajo del mínimo

## 🌐 Despliegue en GitHub Pages

1. Cree un repositorio en GitHub
2. Suba todos los archivos
3. Vaya a Settings > Pages
4. Seleccione la rama `main` y carpeta `/ (root)`
5. El sitio estará disponible en `https://usuario.github.io/repositorio`

## 🔧 Servidor Local

Para desarrollo local, use un servidor HTTP simple:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (npx)
npx serve

# Con VS Code
# Instale la extensión "Live Server"
```

Luego abra `http://localhost:8000` en su navegador.

## 📱 Diseño Responsivo

El sistema está optimizado para:
- 📱 Móviles (botones grandes para producción)
- 💻 Tablets
- 🖥️ Escritorio

## 🎨 Paleta de Colores

- **Fondo Principal:** Gris oscuro (#1a1a2e)
- **Acento Primario:** Azul acero (#3b82f6)
- **Éxito:** Esmeralda (#10b981)
- **Peligro:** Rojo (#ef4444)
- **Advertencia:** Ámbar (#f59e0b)

## 📞 Soporte

Sistema desarrollado para C&A Manufacturas
Bucaramanga, Colombia

---

**Versión:** 1.0.0  
**Última actualización:** 2024
