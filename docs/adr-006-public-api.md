# Architecture Decision Record (ADR)
## ADR-006: Especificación de la API Pública y Contratos del Sistema de Animación

Este documento especifica los contratos públicos, firmas de métodos e interfaces que definen la API del **Sistema de Animación Profesional** en **OnePixel Studio**. Establece un estándar riguroso para la interoperabilidad entre el núcleo de animación (servicios puros, sistema de comandos y controlador de tiempo) y la capa de presentación (React UI).

---

## 1. Estructura de Datos e Interfaces de Contrato

Las interfaces de datos puros que describen la animación están declaradas en `src/types.ts`. Estos contratos definen el estado de persistencia (`AnimationDocument`/`PixelProject`), sesión (`AnimationSession`) y preferencias (`EditorSettings`).

### 1.1 Contratos de Datos Persistentes (Document)
```typescript
export interface Frame {
  id: string;          // Identificador único e inmutable (UUIDv4 o timestamp)
  name: string;        // Nombre legible del fotograma (ej. "Cuadro 1")
  durationMs?: number; // Duración específica del fotograma en milisegundos (default: 100)
}

export interface AnimationClip {
  id: string;
  name: string;
  startFrameIndex: number; // Índice base-0 del fotograma de inicio
  endFrameIndex: number;   // Índice base-0 del fotograma de fin
  repeatMode: 'loop' | 'once' | 'pingpong';
}

export interface AnimationTag {
  id: string;
  name: string;
  color: string;           // Código de color hexadecimal para renderizado en la Timeline UI
  startFrameIndex: number; // Índice base-0 del fotograma de inicio (inclusive)
  endFrameIndex: number;   // Índice base-0 del fotograma de fin (inclusive)
}
```

---

## 2. API de Comandos e Historial (`CommandSystem`)

El sistema de comandos implementa el patrón **Command** para permitir mutaciones seguras, atómicas e inmutables, con soporte nativo de Deshacer/Rehacer (Undo/Redo).

### 2.1 Interfaz `Command`
Cualquier comando que altere el documento de animación debe implementar este contrato:
```typescript
export interface Command {
  id: string;      // ID único de la instancia del comando
  name: string;    // Nombre descriptivo (ej. "Insertar Fotograma")
  execute(): void; // Aplica el cambio de manera inmutable
  undo(): void;    // Revierte el cambio de manera exacta restaurando el estado previo
}
```

### 2.2 Administrador de Historial `CommandHistory`
Mantiene las pilas de Undo/Redo y expone los métodos para transicionar de estado. El sistema expone una instancia global compartida: `timelineCommandHistory`.

```typescript
export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  /**
   * Registra y ejecuta un nuevo comando. Vacía la pila de rehacer (Redo).
   * Emite el evento DOCUMENT_CHANGED a través del EventBus.
   */
  pushAndExecute(command: Command): void;

  /**
   * Revierte el último comando de la pila de deshacer (Undo).
   * Mueve el comando a la pila de rehacer (Redo).
   */
  undo(): void;

  /**
   * Vuelve a ejecutar el último comando revertido.
   * Mueve el comando a la pila de deshacer (Undo).
   */
  redo(): void;

  /**
   * Comprueba si es posible realizar la operación Deshacer.
   */
  canUndo(): boolean;

  /**
   * Comprueba si es posible realizar la operación Rehacer.
   */
  canRedo(): boolean;

  /**
   * Restablece por completo ambas pilas de historial.
   */
  clear(): void;
}
```

### 2.3 Catálogo de Comandos Implementados
*   `InsertFrameCommand`: Inserta un fotograma vacío en un índice determinado.
*   `DeleteFrameCommand`: Elimina el fotograma en un índice específico y resguarda sus píxeles para el rollback.
*   `DuplicateFrameCommand`: Copia un fotograma con todos sus píxeles de capas e inserta la copia a continuación de este.
*   `MoveFrameCommand`: Cambia la posición (reordena) un fotograma desde un índice de origen hasta un índice de destino.
*   `UpdateFrameDurationCommand`: Modifica el valor `durationMs` de un fotograma en un índice determinado.
*   `AddTagCommand`: Añade una etiqueta de animación con un rango determinado de fotogramas.
*   `DeleteTagCommand`: Elimina una etiqueta del documento.

---

## 3. Bus de Eventos Reactivo (`EventBus`)

Permite la comunicación asíncrona y desacoplada entre servicios y la UI, evitando dependencias circulares. La instancia global es `animationEventBus`.

### 3.1 Contrato de `EventBus`
```typescript
type EventCallback = (data: any) => void;

export class EventBus {
  /**
   * Suscribe un callback a un tipo de evento específico.
   * Retorna una función para cancelar la suscripción de forma limpia (unsub).
   */
  subscribe(event: string, callback: EventCallback): () => void;

  /**
   * Despacha un evento con un cuerpo de datos opcional a todos los suscriptores.
   */
  emit(event: string, data?: any): void;

  /**
   * Elimina todas las suscripciones de todos los eventos.
   */
  clear(): void;
}
```

### 3.2 Canal de Eventos Estructurados
| Evento | Descripción de Carga (Data) | Propósito |
| :--- | :--- | :--- |
| `DOCUMENT_CHANGED` | `{ commandName: string }` | El documento ha mutado inmutablemente mediante un comando. Requiere redibujado. |
| `PLAYBACK_TICK` | `{ index: number }` | Emitido por el controlador de reproducción para indicar el avance del cuadro visible. |
| `PLAYBACK_STATE_CHANGED`| `{ isPlaying: boolean }` | El reproductor ha cambiado entre play/pause o detenido. |
| `SESSION_UPDATED` | `{ selection: number[], ... }` | Sincroniza cambios de estado volátiles (selecciones, zoom, scroll). |

---

## 4. Controlador de Reproducción Decoupled (`PlaybackController`)

Se encarga de la simulación temporal autónoma. No conoce el DOM ni lógicas de capas de dibujo. Consume duraciones en milisegundos (`durationMs`) y emite eventos de frame.

### 4.1 Firma del `PlaybackController`
```typescript
export class PlaybackController {
  /**
   * Configura las propiedades de ejecución de la simulación.
   */
  setConfig(
    frames: Frame[],
    activeIndex: number,
    mode: 'forward' | 'reverse' | 'pingpong',
    loop: boolean,
    speed: number,
    activeTag: AnimationTag | null
  ): void;

  /**
   * Inicia o reanuda la reproducción basada en requestAnimationFrame.
   */
  start(): void;

  /**
   * Pausa la reproducción conservando el fotograma activo.
   */
  pause(): void;

  /**
   * Detiene la reproducción y regresa la simulación al inicio o al primer fotograma.
   */
  stop(): void;

  /**
   * Destruye recursos internos y detiene el loop activo para prevenir fugas de memoria.
   */
  destroy(): void;
}
```

---

## 5. API de Servicios Puros (Business Logic Layers)

Los servicios son funciones o módulos puros sin estado mutable interno (Stateless).

### 5.1 `FrameService`
Gestiona la estructura lineal del proyecto pixel.
```typescript
export class FrameService {
  /**
   * Retorna un proyecto con un nuevo fotograma insertado.
   */
  static insertAt(project: PixelProject, index: number, frameId: string, name: string, durationMs?: number): PixelProject;

  /**
   * Retorna un proyecto con el fotograma del índice especificado removido.
   * Se ajustan automáticamente los rangos de etiquetas colindantes.
   */
  static removeAt(project: PixelProject, index: number): PixelProject;

  /**
   * Copia los píxeles de capas de un fotograma de origen y los duplica en un nuevo fotograma insertado.
   */
  static duplicateAt(project: PixelProject, index: number, newFrameId: string, name: string): PixelProject;

  /**
   * Mueve un fotograma reordenándolo de un índice de origen a uno de destino.
   */
  static reorder(project: PixelProject, fromIndex: number, toIndex: number): PixelProject;
}
```

### 5.2 `TagService`
Sincroniza y recalcula rangos de etiquetas ante operaciones estructurales en fotogramas.
```typescript
export class TagService {
  /**
   * Ajusta los índices startFrameIndex y endFrameIndex de todas las etiquetas de un proyecto
   * después de haber insertado un fotograma en 'insertedIndex'.
   */
  static adjustOnInsert(tags: AnimationTag[], insertedIndex: number): AnimationTag[];

  /**
   * Ajusta las etiquetas después de haber borrado un fotograma en 'removedIndex'.
   * Elimina cualquier etiqueta cuyo rango colapse a menos de 1 fotograma de duración.
   */
  static adjustOnDelete(tags: AnimationTag[], removedIndex: number): AnimationTag[];

  /**
   * Ajusta las etiquetas después de haber movido un fotograma de 'fromIndex' a 'toIndex'.
   */
  static adjustOnMove(tags: AnimationTag[], fromIndex: number, toIndex: number): AnimationTag[];
}
```

---

## 6. Integración UI y Directrices de Uso

1.  **Modificaciones del Documento:** Ningún componente React puede reordenar `project.frames` o alterar `project.pixels` directamente. Se debe instanciar un `Command` y despacharlo a través de `timelineCommandHistory.pushAndExecute()`.
2.  **Suscripciones de Renderizado:** El `CanvasArea` se suscribe a `DOCUMENT_CHANGED` y `PLAYBACK_TICK` mediante `animationEventBus` para redibujar el fotograma activo sobre el lienzo utilizando `drawFrameOnCanvas()` en cada cambio de escena.
3.  **Seguridad y Desmontaje:** Todos los efectos de React (`useEffect`) que se suscriban al `EventBus` deben retornar la función de cancelación para evitar fugas de memoria y callbacks duplicados.
