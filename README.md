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

### Extensiones Sugeridas
- **Upload**: Agregar drag & drop con progress indicators animados
- **Delete**: Botones con confirmación modal glassmorphic
- **Preview**: Modal para previsualizaciones de imágenes/videos
- **Dark/Light mode**: Toggle con transición suave de temas
- **Folders**: Navegación tipo breadcrumb con iconos

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
| **Loading States** | Skeleton screens con shimmer effect | Spinners básicos |
| **Responsive** | Mobile-first con transiciones adaptativas | Funcional |
| **Accesibilidad** | prefers-reduced-motion + aria-live | Parcial |

¡Disfruta tu consola de R2 con un diseño que redefine los estándares de calidad visual!
