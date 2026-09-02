# Architecture Decision Record (ADR)
## ADR-004: Sistema de Animación de Alto Rendimiento y Estructura Desacoplada

Este documento define la especificación técnica y el diseño arquitectónico definitivo para el **Sistema de Animación Profesional** de **OnePixel Studio**. Se establece una separación rigurosa del estado en tres niveles jerárquicos e independientes (Persistencia, Sesión y Preferencias), complementado por un motor de tiempo puro, renderizado por capas (Render Passes) y desacoplamiento mediante un bus de eventos reactivo.

---

## 1. Arquitectura de Tres Niveles de Estado

Para garantizar un ciclo de vida limpio, rendimiento óptimo y sincronización libre de efectos colaterales, el estado de animación se divide en tres niveles con fronteras claras:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   ESTADO GLOBAL                                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
       ┌─────────────────────────────────┼────────────────────────────────┐
       ▼                                 ▼                                ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│      AnimationDocument       │ │       AnimationSession       │ │        EditorSettings        │
│    (Persistente / Disco)     │ │     (Temporal / Memoria)     │ │    (Preferencias / Local)    │
│                              │ │                              │ │                              │
│  - Estructura de fotogramas  │ │  - Cuadro visible activo     │ │  - Onion Skin (On/Off, etc.) │
│  - Duraciones individuales   │ │  - Multi-selección (índices) │ │  - Rejilla (Show/Hide)       │
│  - AnimationClips (Lógica)   │ │  - Estado de reproducción    │ │  - Tema visual (Cosmic)      │
│  - AnimationTags (Visual)    │ │  - Scroll y Zoom del Timeline│ │  - Snapping e interfaz       │
└──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

### 1.1 `AnimationDocument` (Única Fuente de Verdad Persistente)
Representa exclusivamente los datos que forman parte del proyecto y que deben ser grabados en disco o persistidos en la base de datos de Firebase. **No contiene ninguna propiedad relacionada con el estado actual de la interfaz de usuario.**

```typescript
export interface FrameMetadata {
  id: string;          // ID único e inmutable (UUIDv4)
  name: string;        // Nombre identificador (ej. "Knight_Run_03")
  durationMs: number;  // Duración exacta del cuadro en milisegundos (ej. 83ms para ~12fps)
}

export interface AnimationClip {
  id: string;
  name: string;
  startFrameIndex: number; // Índice visible de inicio
  endFrameIndex: number;   // Índice visible de fin
  repeatMode: 'loop' | 'once' | 'pingpong';
}

export interface AnimationTag {
  id: string;
  name: string;
  color: string;           // Color hexadecimal para la UI del Timeline
  startFrameIndex: number; // Índice visible de inicio (inclusive)
  endFrameIndex: number;   // Índice visible de fin (inclusive)
}

export interface AnimationDocument {
  id: string;
  projectName: string;
  frames: FrameMetadata[];        // Mapeo ordenado de fotogramas
  clips: AnimationClip[];         // Clips de animación disponibles (ej. para motores de juegos)
  tags: AnimationTag[];           // Etiquetas visuales para la Timeline
  schemaVersion: '1.0.0';
}
```

### 1.2 `AnimationSession` (Estado Temporal y Volátil de la Edición)
Representa el estado activo de la sesión del usuario durante la edición. **No se guarda en el archivo del proyecto.** Se inicializa con valores por defecto al abrir el editor.

```typescript
export interface AnimationSession {
  activeFrameIndex: number;      // Índice del cuadro actualmente visible/editable en el lienzo
  selectedFrameIndices: number[]; // Soporte nativo para selección múltiple (operaciones en lote)
  isPlaying: boolean;            // Indica si la simulación de tiempo está activa
  activeClipId: string | null;   // ID del clip que limita el rango de reproducción activa
  playbackSpeedMultiplier: number; // Factor de velocidad (ej: 0.5, 1.0, 2.0)
  timelineScrollX: number;       // Posición horizontal de la línea de tiempo
  timelineZoom: number;          // Nivel de zoom de la pista (densidad visual)
  clipboard: {                   // Búfer del portapapeles inmutable de la sesión
    frames: FrameMetadata[];
    pixels: Record<string, Record<string, string>>; // frameId -> layerId -> pixelData (serializado)
  } | null;
}
```

### 1.3 `EditorSettings` (Preferencias de Interfaz del Usuario)
Preferencias globales del usuario aplicables a toda la aplicación y persistidas en `localStorage`. Estas opciones configuran el comportamiento visual del lienzo y la timeline.

```typescript
export interface OnionSkinSettings {
  enabled: boolean;
  framesBefore: number;    // Cantidad de fotogramas anteriores
  framesAfter: number;     // Cantidad de fotogramas posteriores
  opacityBefore: number;   // Opacidad inicial (0.0 - 1.0)
  opacityAfter: number;    // Opacidad inicial (0.0 - 1.0)
  colorBefore: string;     // Color de tinte para fotogramas pasados (ej. "#FF0055")
  colorAfter: string;      // Color de tinte para fotogramas futuros (ej. "#00FFAA")
  tintMode: boolean;       // True: aplica tinte plano; False: conserva color original con alfa
}

export interface EditorSettings {
  onionSkin: OnionSkinSettings;   // Configuración detallada del pase de cebolla
  showGrid: boolean;              // Visibilidad de la rejilla de píxeles
  theme: 'dark' | 'light' | 'cosmic';
  snappingEnabled: boolean;       // Snapping para operaciones de timeline y dibujo
  timelineCompactMode: boolean;   // Alternar entre timeline normal y de alta densidad
}
```

---

## 2. División de Servicios (Separation of Concerns)

Para evitar un acoplamiento estrecho, las operaciones sobre estas tres estructuras se delegan en servicios independientes de responsabilidad única (Single Responsibility Principle):

*   **`FrameService`**: Opera sobre `AnimationDocument.frames` de forma inmutable, gestionando inserciones, eliminaciones, duplicaciones y reordenamiento mediante operaciones de array puras.
*   **`TagService`**: Sincroniza los límites de `AnimationTag` de manera automática frente a inserciones, movimientos o eliminaciones de fotogramas (ej: si se borra el cuadro 2, las etiquetas que iniciaban en el cuadro 3 se ajustan dinámicamente al cuadro 2).
*   **`ClipboardService`**: Orquesta la copia e interpolación del estado inmutable de los píxeles sin duplicar lógicas de renderizado.
*   **`SelectionService`**: Gestiona las operaciones de selección múltiple (selección contigua con Shift, selectiva con Ctrl/Cmd, etc.) de `AnimationSession.selectedFrameIndices`.

---

## 3. PlaybackController: Desacoplamiento Temporal Puro

El `PlaybackController` actúa como un despachador de tiempo de precisión. No tiene conocimiento directo de píxeles, capas ni herramientas de dibujo. Consume el `AnimationDocument` para leer las duraciones individuales en milisegundos (`durationMs`) de cada cuadro y actualiza el `activeFrameIndex` dentro de `AnimationSession`.

### 3.1 Loop de Animación de Precisión
Basado en `requestAnimationFrame` y delta-time acumulado para compensar desviaciones en el hilo principal de JavaScript:

```typescript
// El motor emite señales de tick puras a través del Bus de Eventos
this.accumulator += delta;
const currentFrame = document.frames[session.activeFrameIndex];
const duration = currentFrame ? currentFrame.durationMs : 100;

if (this.accumulator >= duration) {
  this.accumulator -= duration;
  const nextIndex = this.calculateNextIndex(document, session);
  this.eventBus.emit('playback_frame_changed', nextIndex);
}
```

---

## 4. Onion Skin como Pase de Renderizado (Render Pass)

El sistema de Onion Skin (cebolla) se integra de manera nativa como un **Pase de Renderizado (Render Pass)** secundario dentro del **Unified Frame Renderer**, evitando recrear lógica del canvas principal.

```
[ Unified Frame Renderer ]
  ├─► Pass 1 (Opcional): Dibujar Onion Skin Pasado (Fotogramas anteriores con opacidad decreciente y tinte)
  ├─► Pass 2 (Opcional): Dibujar Onion Skin Futuro (Fotogramas posteriores con opacidad decreciente y tinte)
  └─► Pass 3 (Obligatorio): Dibujar Fotograma Activo (Cuadro actual con opacidad 1.0 y herramientas de edición)
```

Al renderizar los fotogramas de cebolla:
1. Se utiliza un **Offscreen Canvas** (Canvas temporal en memoria) para dibujar las capas del cuadro de cebolla correspondiente.
2. Si `EditorSettings.onionSkin.tintMode` es verdadero, se aplica un compuesto `'source-in'` con el color especificado (`colorBefore`/`colorAfter`), tintando la silueta con total fidelidad.
3. El resultado se dibuja sobre el canvas principal aplicando el decaimiento exponencial de opacidad determinado por la distancia temporal.

---

## 5. Command System para la Timeline (Undo/Redo Integrado)

Cualquier operación interactiva que altere el `AnimationDocument` (insertar, mover, borrar, duplicar fotogramas, reordenar tags) se empaqueta como una instancia del patrón **Command**. Esto dota al Timeline de un soporte de Deshacer/Rehacer (Undo/Redo) robusto, consistente e inmutable.

```typescript
export interface Command {
  execute(): void;
  undo(): void;
}
```

---

## 6. Comunicación Desacoplada mediante Event Bus

Para eliminar dependencias circulares entre el reproductor, el Timeline UI, el CanvasArea y el gestor de persistencia, se implementa un **Event Bus** reactivo de alto rendimiento.

### 6.1 Eventos Estándar del Sistema de Animación
*   `DOCUMENT_CHANGED`: Emitido por el Command System tras aplicar una mutación inmutable al `AnimationDocument`. Provoca que el Canvas y el Timeline se redibujen.
*   `SESSION_UPDATED`: Notifica cambios de interfaz de usuario como mutaciones en la selección, zoom o scroll.
*   `PLAYBACK_TICK`: Emitido por el `PlaybackController` para actualizar el cuadro activo de la animación.
*   `PREFERENCES_CHANGED`: Gatilla el redibujado inmediato del lienzo si se cambian preferencias globales como el Onion Skin o la cuadrícula.
