# Architecture Decision Record (ADR)
## ADR-005: Invariantes y Salvaguardas Arquitectónicas del Sistema de Animación

Este documento complementa el **ADR-004** y establece el conjunto de **invariantes de sistema, restricciones estáticas de código y reglas de validación semántica** que deben respetarse y auditarse rigurosamente a lo largo de toda la vida útil de **OnePixel Studio**. Su propósito es evitar la degradación de la arquitectura a medida que se incorporan nuevas características o colaboradores.

---

## 1. Clasificación de Invariantes del Sistema

Dividimos las salvaguardas arquitectónicas en cuatro categorías operativas:

### 1.1 Invariantes del Estado y Datos (Data & State Invariants)
1. **Separación de Niveles de Estado:**
   * Ninguna propiedad de `AnimationSession` (ej. `activeFrameIndex`, `selectedFrameIndices`) o `EditorSettings` (ej. `onionSkin.enabled`) puede ser persistida en el `AnimationDocument` o almacenada en la base de datos de Firebase del proyecto.
   * La estructura persistida del `AnimationDocument` debe ser 100% autocompletada y determinista.
2. **Coherencia e Inmutabilidad:**
   * Todos los cambios en cualquiera de los tres estados deben aplicarse mediante transformaciones puras, inmutables (`clonación estructural` o `spread syntax`), sin modificar referencias existentes de objetos o arrays directos.
3. **Consistencia de Índices Visibles (Timeline-Centric):**
   * El Timeline opera exclusivamente mediante índices visibles continuos de base 0 ($0, 1, 2, \dots, N-1$), donde $N$ es el número de fotogramas del `AnimationDocument`.
   * Los ID de cuadro internos (`FrameMetadata.id`) son inmutables y sirven exclusivamente para correlacionar los metadatos de animación con la base de datos de píxeles (`state.pixels` o similar).
   * La inserción, movimiento o eliminación de cuadros debe garantizar la continuidad lineal de los índices visibles ($0 \dots N-1$) sin dejar huecos ni índices duplicados.

### 1.2 Invariantes de los Servicios (Service Invariants)
1. **Desacoplamiento Estricto:**
   * Los servicios (`FrameService`, `TagService`, `ClipboardService`, `SelectionService`) son clases o módulos de funciones puras. No deben poseer ni mantener estado mutable propio en su interior (state-free).
   * Los servicios no pueden invocar llamadas directas a componentes UI ni realizar operaciones que muten el DOM directamente.
2. **Ajuste Automático de Rangos de Etiquetas (Tag Sync):**
   * Cualquier mutación estructural sobre los fotogramas (inserción, reordenamiento, borrado) debe recalcular de forma perezosa o mediante triggers los límites de `AnimationTag` (`startFrameIndex` y `endFrameIndex`) para asegurar que:
     * $0 \le \text{startFrameIndex} \le \text{endFrameIndex} < N$
     * Si una eliminación o reajuste colapsa por completo el rango de una etiqueta (su longitud es menor a 1), dicha etiqueta debe eliminarse de manera limpia del documento.

### 1.3 Invariantes de Reproducción y Tiempo (Playback Invariants)
1. **Autonomía del Reloj:**
   * El `PlaybackController` es un componente desacoplado del estado del lienzo. Su único canal para informar del avance del tiempo es el **Event Bus**.
   * El reloj interno calcula el delta de tiempo real transcurrido mediante marcas temporales de alta resolución (`performance.now()`). No debe confiar en retardos teóricos de `setTimeout` o `setInterval`.
2. **Duración en Millisegundos:**
   * La duración del fotograma está representada exclusivamente por `FrameMetadata.durationMs`. Se prohíbe calcular duraciones en base a una tasa de FPS de forma destructiva o aproximada dentro del modelo. El valor de FPS es un parámetro secundario derivado de la UI.

### 1.4 Invariantes de Renderizado (Render Pass Invariants)
1. **Consistencia de Tinta y Composición:**
   * El renderizado de cebolla (Onion Skin) debe ejecutarse utilizando operaciones de composición nativas de Canvas en un contexto temporal en memoria (Offscreen Canvas) antes de transferir los píxeles al canvas de edición principal.
   * Se prohíbe duplicar la lógica de renderizado del lienzo o acceder a la base de datos de píxeles fuera de las rutinas unificadas definidas en `frameRenderer.ts`.

---

## 2. Matriz de Dependencias Prohibidas

Para mantener un bajo acoplamiento, establecemos de forma explícita las relaciones direccionales permitidas y las importaciones estrictamente prohibidas:

| Módulo Origen | Módulos Permitidos (Depende de...) | Importaciones Prohibidas (❌ NO puede importar...) |
| :--- | :--- | :--- |
| **AnimationDocument** | Ninguno (Tipos Puros) | `AnimationSession`, `EditorSettings`, `PlaybackController` |
| **FrameService** / **TagService** | `AnimationDocument` | `PlaybackController`, React Components, Zustand Stores, DOM UI |
| **PlaybackController** | `AnimationDocument`, `EventBus` | Zustand Stores, `CanvasArea`, `TimelineUI`, DOM direct selectors |
| **Onion Skin Pass** | `EditorSettings`, `Unified Frame Renderer` | `PlaybackController`, `TimelineUI`, React Hooks directos |
| **Event Bus** | Ninguno (Pub/Sub Genérico) | Cualquier lógica del proyecto, hooks, stores o controladores |

---

## 3. Salvaguardas en la Integración con el Store

El store de Zustand o Contexto de React actúa únicamente como el **orquestador de los estados**. Debe adherirse a las siguientes directrices:
* **Delegación:** Al recibir una acción de UI (ej: "Duplicar fotograma index 2"), el Store **debe clonar el estado inmutable**, delegar la operación en el correspondiente servicio puro (`FrameService.duplicateAt(...)`) y guardar el resultado.
* **Undo/Redo:** Las acciones estructurales deben instanciar y despachar objetos `Command` que encapsulen de forma exacta tanto la operación de avance (`execute()`) como la de reversión (`undo()`).
* **Notificación:** Toda actualización de estado exitosa debe ser publicada en el `EventBus` para que los componentes periféricos (ej. el CanvasArea o el reproductor en tiempo de ejecución) ajusten sus cachés u operaciones de forma transparente.
