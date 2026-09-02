# Architecture Decision Record (ADR)
## ADR-007: Sistema de Selección de Frames de la Línea de Tiempo (Fase 1 Definida)

Este documento establece la arquitectura definitiva y el flujo de diseño del **Sistema de Selección de Frames** del Timeline para **OnePixel Studio** desarrollado en la Fase 1. Garantiza una gestión unificada, determinista y matemáticamente sólida para las selecciones simples, por rangos (Shift) y alternadas (Ctrl/Cmd) sobre fotogramas de animación.

---

## 1. Diseño Arquitectónico y Estado de la Selección

Siguiendo los principios de **separación estricta de lógica de negocio y visualización**, toda la gestión de selección se centraliza en un único estado inmutable operado por funciones puras.

### 1.1 Estructura del Estado (`FrameSelectionState`)

Definido en `src/types.ts`, encapsula el foco de teclado, el frame activo de edición, el ancla de rango y el conjunto de elementos seleccionados:

```typescript
export interface FrameSelectionState {
  readonly activeFrameId: string;         // Frame cargado en el Canvas para edición activa
  readonly focusedFrameId: string;        // Frame enfocado visualmente con el cursor del teclado/timeline
  readonly anchorFrameId: string;         // Frame pivote/ancla para expansiones de selección de rango
  readonly selectedFrameIds: readonly string[]; // Listado inmutable de todos los frames seleccionados (sin duplicados)
}
```

### 1.2 Principio de Fuente Única de Verdad

* **React (App.tsx / Context)**: Administra únicamente el almacenamiento reactivo de este estado mediante `const [frameSelection, setFrameSelection] = useState<FrameSelectionState>(...)`. No realiza cálculos aritméticos ni lógicos de selección. Proporciona getters compatibles (como `selectedFrameId` adaptado de `activeFrameId`) para preservar la retrocompatibilidad del sistema.
* **SelectionService**: Centraliza el 100% de las operaciones de negocio y la aritmética de rangos como una clase estática de funciones puras. No almacena estado interno.

---

## 2. Diagrama del Flujo de Eventos de Selección

El sistema opera mediante un flujo de datos unidireccional estricto y reactivo:

```
┌─────────────────────────────────────────────────────────┐
│                    Evento de Usuario                    │
│   (Click en Frame UI / Teclas Ctrl, Shift, Cmd, Esc)    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  Componente Timeline.tsx                │
│    - Detecta el clic y las teclas modificadoras         │
│    - NO calcula la selección directamente               │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               SelectionService (Puro)                   │
│   - Invoca método correspondiente (ej: shiftClick)      │
│   - Realiza cálculo de rango y uniones inmutables      │
│   - Garantiza invariantes y sanitiza IDs               │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               React App.tsx setFrameSelection           │
│   - Aplica el nuevo FrameSelectionState calculado       │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Renderizado de Componentes UI             │
│   - Timeline.tsx dibuja los frames seleccionados/foco   │
│   - CanvasArea.tsx visualiza el frame activo            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Catálogo de Métodos de `SelectionService`

Cada método de `SelectionService` recibe el estado actual y los parámetros contextuales del proyecto para retornar un nuevo estado inmutable de selección:

### 3.1 `click(allFrameIds, targetId)`
* **Acción**: Selección simple por clic normal.
* **Efecto**: `active`, `focused` y `anchor` se asocian a `targetId`. `selectedFrameIds` se colapsa a `[targetId]`.

### 3.2 `shiftClick(currentState, allFrameIds, targetId, options)`
* **Acción**: Selección por rango (Shift+Clic).
* **Efecto**: Determina el índice del `anchorFrameId` anterior y de `targetId`. Selecciona todos los frames incluidos en ese rango dentro del array `allFrameIds`. El frame de foco se actualiza a `targetId`. Por defecto, el `activeFrameId` se sincroniza a `targetId` a menos que se indique lo contrario por opciones arquitectónicas.

### 3.3 `ctrlClick(currentState, allFrameIds, targetId)`
* **Acción**: Selección alternada (Ctrl/Cmd + Clic).
* **Efecto**: Si `targetId` ya está seleccionado, lo retira de `selectedFrameIds` (salvo que sea el único, garantizando la selección mínima). Si no está seleccionado, lo agrega a la lista. El frame `focused` y el `anchor` se actualizan a `targetId`.

### 3.4 `ctrlShiftClick(currentState, allFrameIds, targetId)`
* **Acción**: Selección compuesta de unión por rango (Ctrl+Shift+Clic).
* **Efecto**: Calcula el rango desde el frame enfocado (`focusedFrameId`) hasta el `targetId`, y realiza una unión inmutable de este rango con la lista de seleccionados previa.

### 3.5 `escape(currentState)`
* **Acción**: Cancelar multi-selección.
* **Efecto**: Colapsa la selección a un único elemento basado en el `activeFrameId` actual.

### 3.6 `sanitize(currentState, allFrameIds)`
* **Acción**: Sello de garantía de consistencia.
* **Efecto**: Corrige cualquier inconsistencia:
  * Remueve IDs seleccionados que no existan en `allFrameIds` (ej: tras eliminaciones).
  * Si la lista queda vacía, selecciona automáticamente el primer frame de `allFrameIds`.
  * Previene IDs duplicados mediante saneamiento de conjuntos.
  * Garantiza que `activeFrameId`, `focusedFrameId` y `anchorFrameId` apunten a IDs válidos y pertenezcan al conjunto seleccionado.

---

## 4. Invariantes del Sistema de Selección

El sistema implementa y audita activamente estas cinco reglas indestructibles:

1. **Selección Mínima Garantizada**: `selectedFrameIds` jamás puede estar vacío. Siempre se autocompleta con al menos un ID válido.
2. **Coherencia de Punteros**: `activeFrameId`, `focusedFrameId` y `anchorFrameId` deben pertenecer obligatoriamente a `selectedFrameIds`.
3. **Pertenencia al Proyecto**: Todos los IDs contenidos en `FrameSelectionState` deben existir dentro del listado de frames del proyecto actual activo (`project.frames`).
4. **Inmutabilidad Absoluta**: Los arrays del estado de selección son tratados con restricciones estáticas como `readonly string[]` para prevenir mutaciones directas de punteros.
5. **No Duplicidad**: La lista de selección no permite IDs duplicados de forma interna.

---

## 5. Auditoría de Integración, Rendimiento y Dependencias

### 5.1 Dependencias Permitidas
* **SelectionService** es un módulo de lógica pura (**Pure Domain Logic**).
* **NO está permitido** que `SelectionService` tenga dependencias de React, hooks, estado de la UI ni de componentes visuales (como `Timeline` o `CanvasArea`).
* Solo se permite importar tipos estructurados desde `src/types.ts` (específicamente `FrameSelectionState`).
* Los componentes de la UI (`Timeline`, `CanvasArea`, `App.tsx`) solo se comunican con `SelectionService` mediante su API pública estática. No se permite acceder a implementaciones internas o lógicas duplicadas.

### 5.2 Puntos de Integración con el Timeline
El componente `Timeline.tsx` expone dos propiedades fundamentales para integrarse con este sistema:
* `selection?: FrameSelectionState`: El estado actual de la selección provisto por la fuente única de verdad en React.
* `onSelectionChange?: (nextSelection: FrameSelectionState) => void`: Un callback que emite los nuevos estados de selección calculados por `SelectionService` ante la interacción del usuario.

### 5.3 Diagrama del Estado e Interacciones (Mapeo de Transiciones)
```
[Estado Inicial] ──(Click normal)───────────► click(targetId) ──► Solo targetId seleccionado
       │
       ├──(Shift + Click)──────────────────► shiftClick(targetId) ──► Rango continuo seleccionado
       │
       ├──(Ctrl/Cmd + Click)───────────────► ctrlClick(targetId) ──► Agrega/quita del conjunto seleccionado
       │
       ├──(Ctrl+Shift + Click)─────────────► ctrlShiftClick(targetId) ──► Une rango actual a la selección previa
       │
       └──(Escape / Fuera de rango)────────► escape() ──► Colapsa selección a activeFrameId
```

---

## 6. Rendimiento y Sincronización Reactiva

* **Sincronización de Estructuras**: Se eliminaron los efectos redundantes. La sincronización estructural con `project.frames` ocurre a través de un único `useEffect` reactivo de bajo coste computacional en `App.tsx`.
* **Desacoplamiento**: El Timeline y otros módulos visuales no conocen la estructura lógica de los cálculos de selección, actuando meramente como despachadores de interacciones hacia la lógica pura y consumidores visuales del estado resultante.
