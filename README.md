# Franki AI — Frontend

Tablero Kanban para gestión de tareas construido con **React 18 + TypeScript + Vite**. Consume el API REST de Franki AI para persistir las tareas en el backend.

---

## Tabla de contenido

- [Vista general](#vista-general)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Scripts disponibles](#scripts-disponibles)
- [Variables de entorno](#variables-de-entorno)
- [Arquitectura y decisiones técnicas](#arquitectura-y-decisiones-técnicas)
- [Componentes](#componentes)
- [Tests](#tests)
- [Funcionalidades](#funcionalidades)

---

## Vista general

La aplicación presenta un tablero Kanban con tres columnas — **Pendiente**, **En Progreso** y **Completado** — donde cada tarjeta representa una tarea almacenada en el backend. El estado de la tarea (`status`) se persiste directamente en la API; no se usa `localStorage`.

Una barra de progreso en la cabecera muestra en tiempo real cuántas tareas están completadas, en progreso y pendientes.

---

## Tecnologías

| Categoría | Librería / Herramienta |
|---|---|
| Framework UI | React 18 |
| Lenguaje | TypeScript 5 (strict mode) |
| Bundler | Vite 6 |
| Drag & Drop | @dnd-kit/core |
| Iconos | lucide-react |
| Testing | Vitest + React Testing Library + jsdom |
| Estilos | CSS puro con metodología BEM y variables CSS |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── DeleteConfirmModal/   # Modal de confirmación de borrado
│   ├── Sidebar/              # Navegación lateral
│   ├── TaskCard/             # Tarjeta individual de tarea (draggable)
│   ├── TaskColumn/           # Columna Kanban (droppable)
│   └── TaskFormModal/        # Modal para crear y editar tareas
├── hooks/
│   └── useFocusTrap.ts       # Trampa de foco para accesibilidad en modales
├── services/
│   └── api.ts                # Cliente HTTP hacia el backend
├── types/
│   └── index.ts              # Tipos compartidos (Task, TaskStatus, etc.)
├── App.tsx                   # Componente raíz — estado global con useReducer
├── App.css
├── index.css                 # Variables CSS, reset, animaciones y tooltips globales
└── main.tsx
```

---

## Requisitos previos

- **Node.js** ≥ 18
- El **backend de Franki AI** corriendo en `http://localhost:3000`

---

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:5173`.

El proxy de Vite redirige automáticamente las peticiones `/api/*` y `/health` al backend en el puerto 3000, por lo que no hay que configurar CORS ni URLs absolutas en el código.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción localmente |
| `npm test` | Tests en modo watch (ideal durante desarrollo) |
| `npm run test:run` | Tests en modo CI (una sola ejecución, sin watch) |

---

## Variables de entorno

El proyecto no requiere un archivo `.env` para funcionar en desarrollo. La URL del backend está configurada en `vite.config.ts` como proxy:

```ts
proxy: {
  '/api':    'http://localhost:3000',
  '/health': 'http://localhost:3000',
}
```

Si el backend corre en un puerto diferente, modifica ese archivo.

---

## Arquitectura y decisiones técnicas

### Estado global con `useReducer`

El estado de `App.tsx` se divide en dos reducers independientes:

- **`dataReducer`** — maneja `tasks`, `loading` y `globalError`.
- **`modalReducer`** — maneja el estado del modal de formulario y del modal de confirmación de borrado.

Esto evita múltiples `useState` dispersos y hace que las transiciones de estado sean predecibles y fáciles de testear.

### `React.memo` + `useCallback`

`TaskCard` está envuelto en `memo()`. Los callbacks `onEdit`, `onDelete` y `onAdd` que se pasan a los componentes hijos se estabilizan con `useCallback`, evitando re-renders de las tarjetas cuando cambia el estado de los modales.

### `groupedTasks` con `useMemo`

Las tres listas de tareas por columna se calculan en un solo `useMemo` que depende de `data.tasks`. Se recalcula únicamente cuando el arreglo de tareas cambia.

### Patrón `key`-remount para los modales

En lugar de reiniciar el estado del formulario con `useEffect`, el modal recibe una `key` que cambia cada vez que se abre. React destruye y recrea el componente, garantizando que el estado interno parte siempre limpio.

### Drag & Drop con update optimista

Al soltar una tarjeta en otra columna:
1. La UI se actualiza **inmediatamente** (optimista).
2. Se envía el `PUT` al backend con el nuevo `status`.
3. Si la API responde con éxito, se reemplaza la tarea con la respuesta del servidor.
4. Si falla, se hace **rollback** automático al estado anterior.

### Accesibilidad

- Los modales usan `role="dialog"` y `aria-modal="true"`.
- El hook `useFocusTrap` atrapa el foco dentro del modal activo, ciclando con Tab / Shift+Tab.
- Escape cierra cualquier modal desde `onKeyDown` en el overlay (sin `useEffect` con listeners globales).
- Todos los botones tienen `aria-label` descriptivo.

### Tooltips sin JavaScript

Los tooltips se implementan con el pseudo-elemento `::after` en `index.css` usando el atributo `data-tooltip`. No dependen de ninguna librería y son puramente CSS. Soportan las variantes `data-tooltip-pos="bottom"` y `data-tooltip-pos="right"`.

---

## Componentes

### `TaskCard`

Tarjeta arrastrable que muestra título, descripción truncada a 2 líneas, fecha de creación y botones de editar / eliminar. El handle de arrastre aparece al hacer hover en la esquina superior derecha.

### `TaskColumn`

Zona droppable que agrupa las tarjetas por `status`. Se resalta con fondo azul claro y borde punteado cuando una tarjeta pasa por encima durante el drag.

### `TaskFormModal`

Modal para crear o editar una tarea. Incluye:

- Validación en tiempo real con las mismas reglas que el backend.
- Contador de caracteres para título (máx. 100) y descripción (máx. 200).
- Selector de estado segmentado: Pendiente / En progreso / Completado.

### `DeleteConfirmModal`

Modal de confirmación antes de eliminar. Muestra el nombre de la tarea, estado de carga durante el `DELETE` y mensaje de error si la API falla.

### `useFocusTrap`

Hook genérico que recibe un `ref` de contenedor y atrapa el foco dentro de él mientras el modal está activo. Se desregistra automáticamente al desmontar.

---

## Tests

```bash
npm run test:run
```

**34 tests** distribuidos en 4 archivos:

| Archivo | Cobertura |
|---|---|
| `App.reducers.test.ts` | `dataReducer` (6 casos) y `modalReducer` (7 casos) |
| `services/api.test.ts` | Normalización de `status` inválido o nulo desde el backend (5 casos) |
| `TaskCard/TaskCard.test.tsx` | Render, callbacks de editar/eliminar, lógica de tooltip (6 casos) |
| `DeleteConfirmModal/DeleteConfirmModal.test.tsx` | Estados abierto/cerrado, loading, error e interacciones (9 casos) |

---

## Funcionalidades

- **Crear tarea** desde cualquier columna, con el estado preseleccionado según la columna de origen.
- **Editar tarea** — cambia título, descripción y/o estado desde el formulario.
- **Eliminar tarea** con modal de confirmación y rollback automático si la API falla.
- **Drag & Drop** entre columnas para cambiar el estado de una tarea arrastrando la tarjeta.
- **Barra de progreso** con segmentos por estado y porcentaje completado, animada en tiempo real al mover tarjetas.
- **Tooltips** en todos los controles interactivos.
- **Responsive** — en móvil las columnas se apilan verticalmente y el sidebar se oculta.
