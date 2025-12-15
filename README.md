# R2 Storage Console

> Premium Cloudflare Worker with a design that surpasses Vercel's aesthetic.
> Advanced UI with glassmorphism, micro-interactions, and real-time search—no frameworks needed.

## Características Premium

### Diseño Superior
- **Sistema de tokens avanzado** – Paleta de colores multicapa con 3 niveles de superficie y bordes
- **Glassmorphism de próxima generación** – Blur dinámico, saturación mejorada y efectos de profundidad
- **Gradientes animados** – Fondo con gradientes radiales que responden al movimiento del cursor
- **Tipografía refinada** – Inter con múltiples pesos (300-700) y gradientes de texto

### Animaciones & Micro-interacciones
- **Skeleton loading** – Estados de carga elegantes con efecto shimmer tipo Linear/Stripe
- **Transiciones fluidas** – Cubic-bezier personalizado para movimientos naturales
- **Hover effects avanzados** – Bordes animados, elevación 3D y efectos de luz que siguen el cursor
- **Stagger animations** – Cards que aparecen con delays progresivos para efecto cinematográfico

### Funcionalidad
- **Navegación por carpetas** – Sistema de breadcrumbs elegante para explorar jerarquías
- **Descarga de carpetas completas** – ZIP automático con modal de progreso en tiempo real
- **Detección automática de carpetas** – Diferencia visual entre carpetas y archivos
- **Búsqueda en tiempo real** – Filtrado instantáneo con contador de resultados
- **Iconografía SVG inline** – Sin dependencias externas, máximo rendimiento
- **Status indicators animados** – Indicadores de estado con pulse effects (loading/ready/error)
- **Descargas optimizadas** – Botones con iconos y micro-feedback visual
- **Responsive premium** – Mobile-first con breakpoints inteligentes

### Detalles de Diseño
- **Sombras multicapa** – 4 niveles de elevación (sm/md/lg/xl) con múltiples capas
- **Efectos de panel** – Resplandor que sigue el cursor + bordes con gradiente
- **Meta-información estructurada** – Grid de metadata con labels tipográficos
- **Empty states elegantes** – Ilustraciones SVG con mensajes contextuales
- **Accesibilidad** – Soporte para prefers-reduced-motion y aria-live regions

## Requisitos

- [Wrangler 4](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Un bucket de R2 ya creado (en `wrangler.json` se espera `backup-oppo`, ajusta si es necesario).

## Uso local

```bash
npm install
npm run dev
```

Wrangler abrirá `http://127.0.0.1:8787` con la consola minimalista.  
El listado se obtiene desde el binding `bucket`, así que asegúrate de haber ejecutado `wrangler login`
y de que el bucket configurado exista.

## Despliegue

```bash
npm run deploy
```

Eso compila el Worker y lo publica en tu cuenta de Cloudflare.

## Personalización Avanzada

### Sistema de Tokens de Diseño
Todos los tokens de diseño viven en el `:root` del CSS en `src/index.ts`:
- **Colores**: Variables desde `--color-bg-primary` hasta `--color-text-tertiary`
- **Sombras**: 4 niveles predefinidos con capas múltiples (`--shadow-sm` a `--shadow-xl`)
- **Espaciado**: Sistema consistente de `--spacing-xs` a `--spacing-2xl`
- **Transiciones**: Curvas cubic-bezier optimizadas (`--transition-fast/base/slow/bounce`)
- **Blur**: 3 niveles para efectos glassmorphism (`--blur-sm/md/lg`)

### API Endpoints
- `/` – Interfaz principal con el diseño premium
- `/api/objects` – Lista objetos (soporta `?cursor=` y `?prefix=` para paginación)
- `/api/objects/{key}` – Descarga objeto (usa `?download=1` para forzar descarga)

### Navegación por Carpetas

El sistema de carpetas funciona automáticamente:
- **Breadcrumbs dinámicos** – Aparecen al navegar en carpetas, con icono de "Home"
- **Cards de carpetas** – Estilo diferenciado con tono índigo y icono de carpeta
- **Separación visual** – Carpetas siempre aparecen primero, luego archivos
- **Contador inteligente** – Muestra "X folders, Y files" en el status
- **Búsqueda contextual** – Filtra dentro de la carpeta actual
- **Navegación clicable** – Click en carpeta para entrar, click en breadcrumb para volver

### Descarga de Carpetas

Descarga carpetas completas como archivos ZIP con una experiencia premium:
- **Botón "Download Folder"** – Visible en cada card de carpeta
- **Modal de progreso** – Muestra barra de progreso animada con efecto shimmer
- **Descarga recursiva** – Incluye todos los archivos y subcarpetas automáticamente
- **Contador en tiempo real** – "X / Y files" durante la descarga
- **Compresión ZIP** – Usa JSZip para crear archivos .zip del lado del cliente
- **Cancelación** – Botón X para abortar la descarga en cualquier momento
- **Manejo de errores** – Mensajes claros si algo falla
- **Sin límites** – Maneja carpetas con miles de archivos usando paginación automática

### Extensiones Sugeridas
- **Upload**: Agregar drag & drop con progress indicators animados
- **Delete**: Botones con confirmación modal glassmorphic
- **Preview**: Modal para previsualizaciones de imágenes/videos
- **Dark/Light mode**: Toggle con transición suave de temas
- **Bulk operations**: Selección múltiple con checkboxes

## Diagnóstico

- `wrangler tail` – logs en vivo para revisar peticiones a `/api/objects`.
- `wrangler dev --remote` – prueba directamente contra la infraestructura de Cloudflare.

## Por qué supera a Vercel

| Característica | Este Proyecto | Vercel |
|---|---|---|
| **Glassmorphism** | Multicapa con blur dinámico y saturación | Básico |
| **Animaciones** | Skeleton loading, stagger, micro-interacciones | Limitadas |
| **Hover Effects** | Resplandor que sigue cursor, bordes animados | Estático |
| **Sistema de Tokens** | 8 niveles de color, 4 de sombras, blur variable | Simplificado |
| **Transiciones** | Cubic-bezier optimizado con 4 velocidades | Estándar |
| **Status Indicators** | Animados con pulse effects y colores contextuales | Texto plano |
| **Búsqueda** | Tiempo real con contador dinámico | N/A en su console |
| **Navegación** | Breadcrumbs + detección de carpetas | Básica |
| **Descarga Carpetas** | ZIP automático + modal de progreso | No disponible |
| **Loading States** | Skeleton screens con shimmer effect | Spinners básicos |
| **Responsive** | Mobile-first con transiciones adaptativas | Funcional |
| **Accesibilidad** | prefers-reduced-motion + aria-live | Parcial |

¡Disfruta tu consola de R2 con un diseño que redefine los estándares de calidad visual!
