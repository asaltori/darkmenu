# Guía de Configuración de Base de Datos (Supabase)

Para que tu plataforma funcione con datos reales y sincronizados entre dispositivos (Waiters, Clientes, Cocina), hemos integrado **Supabase** (PostgreSQL).

## Paso 1: Crear Proyecto en Supabase
1. Ve a [https://supabase.com/](https://supabase.com/) y crea una cuenta gratuita.
2. Crea un "New Project".
3. Dale un nombre (ej: `restaurant-platform`) y una contraseña segura.
4. Espera a que se provisione la base de datos.

## Paso 2: Crear Tablas y Datos Iniciales
1. En el panel izquierdo de Supabase, ve a **SQL Editor**.
2. Haz clic en "New Query".
3. Copia y pega el contenido del archivo `SUPABASE_SETUP.sql` que he creado en tu proyecto.
4. Haz clic en **RUN** (botón verde).
   - Esto creará las tablas `users`, `menu_items`, `orders`.
   - Y habilitará el "Realtime" para que los pedidos lleguen al instante.

## Paso 3: Conectar tu Aplicación
Necesitas las credenciales de tu proyecto.

1. Ve a **Project Settings** (icono de engranaje) -> **API**.
2. Copia la `Project URL` y la `anon` `public` Key.

### Opción A: Para Desarrollo Local
Crea un archivo `.env.local` en la raíz del proyecto (basado en `.env.local.example`) y pega tus claves:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-larga-anonima
```

### Opción B: Para Vercel (Producción)
1. Ve a tu dashboard de Vercel.
2. Selecciona tu proyecto -> **Settings** -> **Environment Variables**.
3. Añade las mismas dos variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Vercel redeplegará automáticamente (o puedes forzar un redeploy).

## ¡Listo!
Una vez configurado, la aplicación detectará automáticamente la conexión y dejará de usar los datos de prueba para usar tu base de datos real.
