# Ayto-HelpDesk 🏛️

Plataforma web interna de gestión de incidencias, inventario informático y comunicación para el **Ajuntament de Caldes d'Estrac**.

Desarrollada durante las prácticas curriculares de Genís Montero Cabanillas (TecnoCampus – UPF, 2025-2026) bajo la supervisión de Joaquim Arnó i Porras (responsable TIC del ayuntamiento) y Luciano Powell (Quopiam).

---

## 📋 Índice

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Arquitectura del proyecto](#2-arquitectura-del-proyecto)
3. [Puesta en marcha local (desarrollo)](#3-puesta-en-marcha-local-desarrollo)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Base de datos](#5-base-de-datos)
6. [Configuración de correo (SMTP)](#6-configuración-de-correo-smtp)
7. [Sistema de roles y usuarios por defecto](#7-sistema-de-roles-y-usuarios-por-defecto)
8. [Módulos implementados](#8-módulos-implementados)
9. [Despliegue en producción](#9-despliegue-en-producción)
10. [Tareas pendientes y trabajo futuro](#10-tareas-pendientes-y-trabajo-futuro)

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | TailwindCSS | v4 |
| ORM | Prisma | 5.x |
| Base de datos (dev) | SQLite | — |
| Base de datos (prod) | **PostgreSQL** (pendiente migrar) | — |
| Autenticación | NextAuth.js v5 Beta | 5.0.0-beta.30 |
| Hash de contraseñas | bcryptjs | 3.x |
| Envío de emails | Nodemailer | 8.x |
| Gráficas analytics | Recharts | 3.x |

---

## 2. Arquitectura del proyecto

```
ayto-helpdesk/
├── app/                    # Rutas y páginas (Next.js App Router)
│   ├── actions.ts          # TODAS las Server Actions (lógica de negocio)
│   ├── admin/              # Panel de administración (usuarios, roles)
│   ├── chat/               # Módulo de mensajería directa
│   ├── comentario/         # Gestión de comentarios en tickets
│   ├── components/         # Componentes React reutilizables
│   ├── login/              # Página de inicio de sesión
│   ├── noticias/           # Tablón de noticias internas
│   ├── nuevo/              # Formulario de creación de tickets
│   ├── register/           # Registro de nuevos usuarios
│   ├── ticket/[id]/        # Vista detalle de un ticket
│   ├── page.tsx            # Dashboard principal (Kanban + KPIs)
│   └── globals.css         # Estilos globales
├── lib/
│   ├── email.ts            # Servicio de emails (SMTP + fallback offline)
│   ├── diccionario.ts      # Sistema de traducción CA/ES
│   └── prisma.ts           # Cliente Prisma (singleton)
├── prisma/
│   ├── schema.prisma       # Definición del modelo de datos
│   ├── seed.ts             # Script de datos iniciales de prueba
│   └── migrations/         # Historial de migraciones de BD
├── public/                 # Assets estáticos
├── temp_emails/            # Emails generados en modo offline (NO subir a producción)
├── auth.config.ts          # Configuración de NextAuth (rutas protegidas, callbacks)
├── auth.ts                 # Instancia de NextAuth con adaptador Prisma
├── middleware.ts           # Interceptor de rutas (protección global)
├── .env                    # Variables de entorno (NO subir a Git)
└── .gitignore
```

**Flujo de datos:** Las páginas (Server Components) llaman directamente a Prisma para leer datos. Para escribir/modificar, se usan Server Actions definidas en `app/actions.ts`. El cliente nunca tiene acceso directo a la base de datos ni a credenciales.

---

## 3. Puesta en marcha local (desarrollo)

### Requisitos previos
- Node.js v18 o superior
- npm v9 o superior

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd ayto-helpdesk

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Copiar el archivo de ejemplo y editarlo:
copy .env.example .env
# (Si no existe .env.example, ver la sección 4 de este README)

# 4. Crear/migrar la base de datos y generar el cliente Prisma
npx prisma migrate dev

# 5. (Opcional) Poblar la BD con datos de prueba
npx prisma db seed

# 6. Arrancar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 4. Variables de entorno

Crea un fichero `.env` en la raíz del proyecto con el siguiente contenido. **Nunca subas este fichero a Git** (ya está en `.gitignore`).

```env
# ── BASE DE DATOS ──────────────────────────────────────────────────────────
# Desarrollo local (SQLite, no requiere instalación de servidor):
DATABASE_URL="file:./dev.db"

# Producción (PostgreSQL - ver sección 9):
# DATABASE_URL="postgresql://USUARIO:PASSWORD@HOST:5432/NOMBRE_BD"

# ── AUTENTICACIÓN (NextAuth) ────────────────────────────────────────────────
# Genera un nuevo secret seguro con: npx auth secret
AUTH_SECRET="cambia-esto-por-un-valor-aleatorio-seguro-en-produccion"

# URL base de la aplicación (sin barra final)
AUTH_URL="http://localhost:3000"
# En producción: AUTH_URL="https://helpdesk.caldetes.cat"

# ── CORREO ELECTRÓNICO (SMTP) ───────────────────────────────────────────────
# Si se dejan en blanco o comentadas → modo offline:
#   Los emails se guardan como archivos HTML en /temp_emails/
#   y se imprime el enlace por consola. MUY ÚTIL para desarrollo.
#
# Para activar el envío de correo REAL, descomentar y rellenar:
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_USER="tu-correo@gmail.com"
# SMTP_PASS="contraseña-de-aplicacion-gmail"   # NO es tu contraseña normal
# SMTP_FROM='"Ayto-HelpDesk" <tu-correo@gmail.com>'
#
# Para el Ajuntament de Caldes d'Estrac usar el servidor SMTP corporativo.
# Consultar con Joaquim Arnó (jarno@caldetes.cat) las credenciales del relay.
```

---

## 5. Base de datos

### Modelo de datos (resumen)

El esquema completo está en [`prisma/schema.prisma`](./prisma/schema.prisma). Las entidades principales son:

| Modelo | Descripción |
|---|---|
| `Usuario` | Empleados del ayuntamiento. Roles: `EMPLEADO`, `TECNICO`, `ADMIN` |
| `Ticket` | Incidencia de soporte. Estados: `ABIERTO`, `EN_PROCESO`, `RESUELTO` |
| `Comentario` | Respuestas en un ticket. Pueden ser públicos o `interno: true` (solo técnicos) |
| `Equipo` | Inventario físico (PCs, monitores...) asignados a un `Usuario` |
| `Notificacion` | Alertas in-app para cada usuario |
| `Mensaje` | Mensajes del chat directo (remitente → destinatario) |
| `Noticia` | Publicaciones del tablón de noticias internas |

### Comandos útiles de Prisma

```bash
# Aplicar cambios del schema a la BD (y generar migración)
npx prisma migrate dev --name nombre-descriptivo

# Aplicar migraciones en producción (sin crear nuevas)
npx prisma migrate deploy

# Abrir el explorador visual de la BD en el navegador
npx prisma studio

# Regenerar el cliente Prisma (necesario tras cambiar schema.prisma)
npx prisma generate

# Poblar la BD con el script seed (datos de prueba)
npx prisma db seed
```

> ⚠️ **Importante:** `prisma migrate dev` reinicia datos en SQLite si hay conflictos de esquema. En producción, usar siempre `migrate deploy`.

### Migración de SQLite a PostgreSQL (pendiente - ver sección 10)

Actualmente la BD de desarrollo es SQLite (`prisma/dev.db`). Para producción se planificó PostgreSQL. El único cambio necesario en el código es:

1. En `prisma/schema.prisma`, cambiar `provider = "sqlite"` → `provider = "postgresql"`
2. Actualizar `DATABASE_URL` en `.env` con la cadena de conexión PostgreSQL
3. Ejecutar `npx prisma migrate deploy`

---

## 6. Configuración de correo (SMTP)

### ¿Cómo funciona el sistema de emails?

El servicio está en [`lib/email.ts`](./lib/email.ts) e implementa una **arquitectura híbrida**:

```
¿Están definidas SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS en .env?
        │
        ├── SÍ → Envía el email REAL vía Nodemailer (SMTP corporativo)
        │
        └── NO → Genera un archivo HTML en /temp_emails/
                  e imprime el enlace en la consola del servidor
```

### En desarrollo (sin SMTP configurado)

Cuando no hay variables SMTP en `.env`, el sistema **no falla**: guarda el email como HTML en `temp_emails/`. Para verlo:

1. Arrancar `npm run dev`
2. Realizar una acción que genere un email (crear ticket, cambiar estado...)
3. En la consola del servidor verás algo como:
   ```
   📧 Visualización offline: file:///C:/ruta/temp_emails/1234567890_nuevo_ticket.html
   ```
4. Abrir ese enlace en el navegador para ver el email tal como llegaría

> La carpeta `temp_emails/` está en `.gitignore`. No se sube al repositorio.

### En producción (SMTP real)

Los emails se envían automáticamente en los siguientes eventos:
- ✅ Creación de un nuevo ticket (confirmación al autor + aviso a admins)
- ✅ Cambio de estado de un ticket (ABIERTO → EN_PROCESO → RESUELTO)
- ✅ Nuevo comentario público en un ticket
- ✅ Asignación o retirada de equipos del inventario
- ✅ Mensaje de chat directo recibido

### Configuración con Gmail (opción rápida para pruebas)

1. Activar la verificación en dos pasos en la cuenta Gmail
2. Ir a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Crear una "contraseña de aplicación" para "Correo"
4. Usar esa contraseña de 16 caracteres en `SMTP_PASS` (NO la contraseña normal de Gmail)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="helpdesk@gmail.com"
SMTP_PASS="abcd efgh ijkl mnop"   # contraseña de aplicación
SMTP_FROM='"Ayto-HelpDesk" <helpdesk@gmail.com>'
```

### Configuración con el servidor corporativo del Ajuntament

Consultar con **Joaquim Arnó** (`jarno@caldetes.cat`) o con **Luciano Powell de Quopiam** los datos del relay SMTP corporativo. Normalmente será algo como:

```env
SMTP_HOST="mail.caldetes.cat"     # o la IP del servidor Exchange/Postfix
SMTP_PORT=587                      # o 465 para SSL
SMTP_USER="helpdesk@caldetes.cat"
SMTP_PASS="contraseña-del-buzon"
SMTP_FROM='"Ayto-HelpDesk" <helpdesk@caldetes.cat>'
```

> ⚠️ **Nota sobre el firewall corporativo:** Durante el desarrollo se detectó que el firewall de la red del ayuntamiento bloquea los puertos de salida SMTP. Asegúrate de que el servidor donde se desplegará la aplicación tenga el puerto 587 (o 465) desbloqueado hacia el relay de correo.

---

## 7. Sistema de roles y usuarios por defecto

### Roles disponibles

| Rol | Acceso |
|---|---|
| `EMPLEADO` | Ve y gestiona solo sus propios tickets. No puede cambiar estados. |
| `TECNICO` | Acceso completo a todos los tickets. Puede cambiar estados y prioridades. Ve todo el inventario. |
| `ADMIN` | Todo lo de TECNICO + gestión de usuarios (crear, promover, degradar roles) + tablón de noticias. |

### Primer usuario administrador

El sistema **no tiene ningún usuario administrador por defecto**. Al registrarse el primer usuario vía `/register`, recibirá automáticamente el rol `EMPLEADO`. Para asignarlo como `ADMIN`:

**Opción A - Prisma Studio (recomendado):**
```bash
npx prisma studio
# Ir a la tabla Usuario → editar el campo 'rol' → escribir "ADMIN" → Save
```

**Opción B - SQL directo (SQLite):**
```bash
# Instalar sqlite3 si no está disponible
sqlite3 prisma/dev.db "UPDATE Usuario SET rol='ADMIN' WHERE email='tu@email.com';"
```

**Opción C - Script seed:**
El archivo `prisma/seed.ts` crea usuarios de prueba con todos los roles. Ejecutar con `npx prisma db seed`.

### Chat: quién ve a quién

- Los `EMPLEADO` solo pueden escribir a usuarios con rol `TECNICO` o `ADMIN`
- Los `TECNICO` y `ADMIN` pueden escribir a cualquier usuario

---

## 8. Módulos implementados

| Módulo | Ruta | Estado |
|---|---|---|
| Dashboard Kanban + KPIs | `/` | ✅ Completo |
| Crear nuevo ticket | `/nuevo` | ✅ Completo |
| Detalle de ticket | `/ticket/[id]` | ✅ Completo |
| Comentarios (público e interno) | `/comentario` | ✅ Completo |
| Inventario CMDB | `/admin/usuarios/[id]/equipos` | ✅ Completo |
| Gestión de usuarios y roles | `/admin/usuarios` | ✅ Completo |
| Tablón de noticias | `/noticias` | ✅ Completo |
| Chat de mensajería directa | `/chat` | ✅ Completo |
| Notificaciones in-app | (componente global) | ✅ Completo |
| Emails transaccionales | (automático en actions.ts) | ✅ Completo (SMTP pendiente en prod) |
| Bilingüismo CA/ES | (cookie + diccionario) | ✅ Completo |
| Login / Register | `/login`, `/register` | ✅ Completo |

---

## 9. Despliegue en producción

> ⚠️ **Estado actual:** La aplicación ha sido desarrollada y probada en entorno local. El despliegue en el servidor del ayuntamiento es el **principal trabajo pendiente**.

### Checklist de despliegue

- [ ] Provisionar un servidor Linux (Ubuntu 22.04 LTS recomendado) o un servicio PaaS
- [ ] Instalar Node.js 18+ y npm
- [ ] Instalar y configurar PostgreSQL (ver sección 5)
- [ ] Clonar el repositorio en el servidor
- [ ] Crear el archivo `.env` con las variables de producción
- [ ] Generar un `AUTH_SECRET` seguro: `npx auth secret`
- [ ] Cambiar el provider de la BD en `schema.prisma` a `postgresql`
- [ ] Ejecutar `npx prisma migrate deploy`
- [ ] Ejecutar `npm run build`
- [ ] Arrancar con `npm run start` (o usar PM2 para gestión de procesos)
- [ ] Configurar un proxy inverso (Nginx o Apache) con SSL/HTTPS
- [ ] Configurar SMTP y verificar el envío de emails
- [ ] Crear el primer usuario admin manualmente (ver sección 7)

### Opción PaaS sencilla: Vercel + Neon (PostgreSQL serverless)

Si no se dispone de servidor propio, la combinación más rápida es:
1. [Vercel](https://vercel.com) para el hosting de la app Next.js (gratuito para uso pequeño)
2. [Neon](https://neon.tech) para PostgreSQL serverless (gratuito hasta 3GB)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

Las variables de entorno se configuran en el panel de Vercel (`Settings → Environment Variables`).

### Scripts de producción

```bash
# Construir la aplicación
npm run build

# Arrancar en producción
npm run start

# Con PM2 (recomendado para servidores Linux)
pm2 start npm --name "ayto-helpdesk" -- start
pm2 save
pm2 startup
```

---

## 10. Tareas pendientes y trabajo futuro

### 🔴 Crítico (necesario para la puesta en producción)

- **Migrar BD de SQLite a PostgreSQL:** Cambiar el `provider` en `schema.prisma` y configurar `DATABASE_URL` con las credenciales del servidor de BD del ayuntamiento.
- **Configurar SMTP corporativo:** Activar el envío de emails reales rellenando las variables `SMTP_*` en `.env` con los datos del servidor de correo del ayuntamiento. Ver sección 6.
- **Generar `AUTH_SECRET` de producción:** Ejecutar `npx auth secret` y actualizar la variable.
- **Desplegar en servidor:** Configurar el servidor de producción con Nginx + SSL (certificado Let's Encrypt).

### 🟡 Mejoras recomendadas

- **Subida de adjuntos a Cloudinary:** El campo `adjuntoUrl` en los tickets está preparado en la BD, pero la integración con Cloudinary CDN está planificada pero no finalizada. Actualmente los adjuntos del chat sí funcionan (imágenes en Base64), pero los adjuntos de tickets necesitarían completar la integración con la API de Cloudinary.
- **WebSockets para el chat:** El chat actual usa polling cada 3 segundos. Para tiempo real verdadero, migrar a WebSockets (por ejemplo con [Pusher](https://pusher.com) o [Socket.io](https://socket.io)).
- **Paginación en el dashboard:** La lista de tickets tiene un límite de visualización. Implementar paginación o scroll infinito para ayuntamientos con muchos tickets históricos.
- **Exportación de datos:** Añadir exportación a CSV/Excel del inventario CMDB y del historial de tickets para auditorías.
- **Backup automático de la BD:** Configurar backups periódicos de PostgreSQL en producción.

### 🟢 Funcionalidades opcionales a futuro

- Integración con el sistema de correo corporativo `@caldetes.cat` para login SSO
- App móvil (PWA) para notificaciones push en el teléfono del técnico
- Estadísticas avanzadas: tiempo medio de resolución, carga de trabajo por técnico

---

## Contactos de referencia

| Rol | Nombre | Contacto |
|---|---|---|
| Responsable TIC Ayuntamiento | Joaquim Arnó i Porras | jarno@caldetes.cat |
| Empresa colaboradora (Quopiam) | Luciano Powell | — |
| Desarrollador original | Genís Montero Cabanillas | gmonteroc@edu.tecnocampus.cat |

---

*Plataforma desarrollada en el marco de las Prácticas Externas Curriculares del Grado en Ingeniería Informática de Gestión y Sistemas de Información — TecnoCampus (UPF) · 2025-2026.*
