# Directrices de Diseño y Decisiones Arquitectónicas — OnePixel Studio
**Manual Maestro de Ingeniería de Software, Persistencia Estructurada y Políticas de UX/Accesibilidad (v1.0)**

Este documento es la referencia técnica obligatoria para el desarrollo, refactorización y estabilización del núcleo de **OnePixel Studio**. Establece las reglas inquebrantables de la arquitectura, la clasificación de estados, la gestión de operaciones destructivas y las directrices ergonómicas necesarias para construir un editor de píxeles robusto y de nivel profesional.

---

## 💾 1. Clasificación del Estado del Editor

Para optimizar la huella de memoria en almacenamiento físico (LocalStorage/IndexedDB/Cloud Firestore) y garantizar la reactividad síncrona de la interfaz, el estado de OnePixel Studio se divide estrictamente entre **Estados Persistentes** y **Estados Volátiles (Nunca Persistidos)**.

### 1.1 Estados Persistentes
*Estos estados representan el trabajo del artista y la configuración estructural de su espacio creativo. Deben guardarse en el almacenamiento local e interactuar con la sincronización en el Cloud.*

| Atributo / Estado | Tipo | Descripción | Ámbito de Persistencia |
| :--- | :--- | :--- | :--- |
| `project.id` | `string` | Identificador único del proyecto (UUID/UUIDv4). | Proyecto / Cloud / LocalStorage |
| `project.name` | `string` | Nombre descriptivo del lienzo o animación. | Proyecto / Cloud / LocalStorage |
| `project.width` | `number` | Ancho del lienzo en píxeles. | Proyecto / Cloud / LocalStorage |
| `project.height` | `number` | Alto del lienzo en píxeles. | Proyecto / Cloud / LocalStorage |
| `project.layers` | `LayerMetadata[]` | Metadatos de capas (id, nombre, opacidad, visibilidad, candado, modo de mezcla). | Proyecto / Cloud / LocalStorage |
| `project.frames` | `FrameMetadata[]` | Metadatos de fotogramas (id, duración en ms, orden visible). | Proyecto / Cloud / LocalStorage |
| `project.pixels` | `Record<string, number[]>` | Base de datos de píxeles: mapa de claves `frameId_layerId` a un array de enteros que representan los índices de color. | Proyecto / Cloud / LocalStorage |
| `project.animationTags`| `AnimationTag[]` | Rangos etiquetados en el timeline de animación (id, nombre, color, rango frame de inicio y fin). | Proyecto / Cloud / LocalStorage |
| `customPalette` | `string[]` | Paleta de colores personalizada modificada por el artista. | Sesión Global / LocalStorage |
| `symmetry` | `SymmetrySettings` | Configuración de ejes de simetría (tipo, ejes x/y, centro). | Proyecto / LocalStorage |
| `tiling` | `TilingSettings` | Configuración de previsualización en patrón o mosaico (activo, desfase). | Proyecto / LocalStorage |

### 1.2 Estados Volátiles (Nunca Persistidos)
*Estos estados son puramente efímeros o recreados bajo demanda. Se prohíbe explícitamente su serialización o escritura en bases de datos persistentes.*

| Atributo / Estado | Tipo | Justificación de Volatilidad |
| :--- | :--- | :--- |
| `undoStack` / `redoStack` | `HistoryEntry[]` | Contienen buffers pesados de instantáneas de píxeles. Serializarlos consume la cuota del navegador (5MB) en segundos, provocando excepciones catastróficas de cuota y falsos positivos de auto-guardado exitoso. El historial de Ctrl+Z es efímero de sesión de dibujo activo. |
| `activeSelection` | `SelectionState` | La selección actual (máscara booleana) es dinámica y depende estrictamente del lienzo interactivo. No forma parte de la estructura fija del archivo del proyecto. |
| `selectionCommand` | `SelectionCommand` | Mensajes asíncronos para comunicar operaciones con la máscara de selección. |
| `currentFrameId` | `string` | Puntero al fotograma activo seleccionado visualmente en el timeline. Recreado al abrir un proyecto. |
| `currentLayerId` | `string` | Puntero a la capa activa seleccionada visualmente en el gestor de capas. Recreado al abrir un proyecto. |
| `previewPixels` / `moveState` | `any` | Datos temporales calculados en caliente durante el arrastre del ratón (trazos previsualizados, píxeles en transformación de movimiento). |
| `zoom` / `panOffset` | `number` / `Point` | Posicionamiento de cámara y zoom interactivo del lienzo central del editor. |
| `modals` / `activeTabId` | `any` | Estados interactivos del entorno de interfaz, paneles colapsados, y configuraciones de diálogo de la UI de React. |

---

## 🛠️ 2. Gestión de Operaciones y Orquestación

La integridad del motor de píxeles exige un tratamiento riguroso de cada comando emitido por el usuario. Clasificamos las acciones en cuatro categorías operativas con el fin de unificar el comportamiento de la interfaz de usuario en todo el editor.

### 2.1 Grupo A — Confirmación Obligatoria (Fricción Alta)
*Operaciones destructivas de almacenamiento o configuración permanente que no se pueden recuperar mediante un simple comando Ctrl+Z en la sesión activa. Requieren un diálogo modal interactivo interno (HTML modal, no `window.confirm`).*

*   **Eliminar Proyecto**: Borrado de un archivo de la galería local o de la base de datos remota del Cloud.
*   **Limpiar Biblioteca / Eliminar Asset Permanente**: Remoción de estampados (stamps), pinceles texturizados o paletas de colores guardadas de forma preestablecida en la biblioteca de recursos.
*   **Cerrar Proyecto con Cambios Pendientes**: Cerrar la pestaña del lienzo activo sin haber persistido los cambios en el Cloud o almacenamiento local estable si el guardado automático está inactivo.

### 2.2 Grupo B — Protegidas únicamente por Undo (Fricción Cero / Flujo Rápido)
*Operaciones destructivas sobre la estructura o el contenido del lienzo que alteran el dibujo. Para no interrumpir el flujo artístico de clicks rápidos del artista, se aplican de inmediato y se protegen insertando un comando descriptivo en la pila unificada de Deshacer (`undoStack`).*

*   **Eliminar Capa**: Eliminación de la capa activa (consolida píxeles de todos los cuadros para esa capa).
*   **Eliminar Fotograma (Frame)**: Remoción de un fotograma en el timeline (afecta a los píxeles de todas las capas en dicho instante).
*   **Mover / Reordenar Capas**: Alteración de la jerarquía de mezcla visual de composición.
*   **Borrar Selección (Clear Canvas / Selection)**: Limpieza rápida de la máscara activa de dibujo (borrado de píxeles).
*   **Dibujar Trazos (Stroke Execution)**: Trazo de pintura con pincel, borrador, cubo de pintura, simetría, degradados o herramientas geométricas.

### 2.3 Grupo C — Toast No Invasivo con Botón "Deshacer" (Fricción Baja)
*Operaciones que modifican metadatos de organización o configuraciones cosméticas secundarias que no entran de forma natural en la pila unificada de deshacer de píxeles del lienzo. Muestran un Toast interactivo temporal en la esquina inferior con un botón de acción rápida para revertir el estado anterior.*

*   **Eliminar Etiqueta de Animación (Animation Tag)**: Borrado de una sección de reproducción del timeline.
*   **Eliminar Color de Paleta Personalizada**: Eliminar un swatch de color de la paleta activa mediante el botón contextual o el bote de basura.
*   **Vaciado de Paleta de Colores**: Reinicio o vaciado de la paleta personalizada actual a un estado vacío.

### 2.4 Grupo D — Totalmente Reversibles (Sin Confirmación ni Notificación)
*Acciones que alteran la interfaz, selección de herramientas o navegación visual sin destruir datos o píxeles de ningún tipo. No generan fricción ni toasters.*

*   **Cambio de Herramienta**: Conmutar entre lápiz, borrador, cubo de pintura, selección o gotero.
*   **Cambio de Color Activo**: Cambiar el color principal o secundario de pintura.
*   **Conmutar Visibilidad / Bloqueo**: Ocultar o bloquear capas desde el panel lateral, u ocultar guías de rejilla.
*   **Navegación en el Timeline**: Cambiar el fotograma seleccionado o reproducir la animación interactiva.
*   **Zoom / Pan**: Navegación espacial por el área del lienzo mediante scroll o atajos de teclado de zoom.

---

## 🛡️ 3. Políticas de Ingeniería y Estándares del Sistema

### 3.1 Política de Memoria (Memory Policy)
1.  **Exclusión de Historial en Backups**: Los backups automáticos (`pixel_art_autosave_backup`) y las restauraciones de sesión activa (`pixel_art_active_session`) **deben omitir síncronamente** las pilas `undoStack` y `redoStack` al serializar el JSON del proyecto. El historial de deshacer es estrictamente volátil.
2.  **Liberación de ObjectURL**: Cada creación de previsualización temporal (`URL.createObjectURL(blob)`) utilizada para exportaciones de GIFs, Spritesheets o APNGs en modales debe ser liberada síncronamente mediante `URL.revokeObjectURL` tan pronto como el componente se desmonte o la previsualización se actualice para evitar fugas masivas de memoria RAM.
3.  **Cachés Débiles (Weak References)**: Los caches de renderizado en `LayerCacheManager.ts` o caches de miniaturas de la biblioteca de assets deben utilizar mapas débiles (`WeakMap` o `WeakSet`) indexados por objetos de estado del proyecto para permitir que el recolector de basura (Garbage Collector) libere la memoria RAM de capas de proyectos cerrados o fotogramas destruidos de inmediato.

### 3.2 Política de Rendimiento (Performance Policy)
1.  **Prevención de Cascada React (React Cascade Rendition)**:
    *   Se prohíbe re-renderizar los componentes estructurales pesados (`HeaderMenu`, `LeftPanel`, `TimelineUI`) de forma reactiva en cada paso de movimiento de pintura del mouse (`onMouseMove`).
    *   La pintura rápida interactiva en el lienzo debe manejarse dibujando sobre lienzos dinámicos temporales (offscreen buffers) y actualizando únicamente las variables de estado reactivas globales de React al soltar el ratón (`onMouseUp`).
2.  **Bucle de Trazado Libre de Instanciaciones**:
    *   Durante el arrastre y trazado de pincel (herramienta de lápiz continuo, línea o cubo), se prohíbe la instanciación innecesaria de objetos en caliente (ej: mapear arrays para crear objetos `{x, y}` temporales en cada fotograma del evento de mouse).
    *   Se deben priorizar buffers y arrays planos tipados (`Int32Array`) para el cálculo de trazos e inundaciones (Flood Fill BFS).

### 3.3 Política de UX y Ergonomía (UX Policy)
1.  **Visibilidad de Atajos Rápidos**: Todos los botones de herramientas principales de la barra de herramientas (`Toolbar`) deben mostrar en su correspondiente tooltip interactivo el atajo de teclado asignado de forma unificada en el idioma activo (ej: "Lápiz (B)" o "Goma (E)").
2.  **Indicador de Estado de Sincronización**: La interfaz debe proveer un indicador visual discreto y objetivo en el margen de menú que describa con precisión el estado de la persistencia: "Guardado", "Guardando cambios...", u "Error de conexión (Guardado en Local)". Se prohíben logs de depuración o terminales simulados en la UI de producción.

### 3.4 Política de Accesibilidad WCAG AA (Accessibility Policy)
1.  **Enfoque Secuencial en Controles de Color y Capas**:
    *   Las celdas de selección de la paleta de colores personalizada deben tener `tabIndex={0}`, rol ARIA descriptivo (`role="button"`) y etiquetas legibles por lectores de pantalla indicando el color hexadecimal correspondiente.
    *   El listado de capas debe ser navegable mediante tabulación de teclado, permitiendo conmutar la visibilidad (tecla `V`), bloqueo (tecla `L`) y selección de la capa actual (tecla `Enter` o `Space`).
2.  **Oyentes de Teclado Consistentes**: Todos los componentes interactivos con soporte secuencial deben implementar manejadores de teclado `onKeyDown` para asegurar que las acciones de activación por pulsación de tecla Enter o Espacio ejecuten la función homóloga del clic de ratón.

### 3.5 Política de Componentes y Modularidad (Component & Modularity Policy)
1.  **Fronteras Arquitectónicas (Architectural Guardrails)**:
    *   Los servicios puros de dominio (ej: `FrameService.ts`, `TagService.ts`, `MatrixTransform.ts`) deben mantenerse estrictamente libres de estado reactivo y aislados de importaciones visuales de React o de manipulación directa del DOM.
    *   Toda modificación en la estructura lógica de capas, fotogramas o etiquetas debe procesarse mediante funciones de servicios puros. El store React actúa únicamente como el orquestador síncronizador.
2.  **Prevención de Archivos Monolíticos**:
    *   Se prohíbe añadir código de lógica estructural compleja o componentes secundarios completos dentro del archivo principal `App.tsx`.
    *   Cualquier modal nuevo, diálogo, o lógica matemática modular debe ser extraído a su correspondiente archivo de componente en `/src/components/` o helper en `/src/utils/` para mantener un recuento de líneas moderado y evitar la pérdida de información por cuotas o límites de tokens durante la generación de código.
3.  **Seguridad contra dependencias circulares**:
    *   Los imports cruzados entre subsistemas deben evitarse rigurosamente. Ningún módulo de exportación puede depender del lienzo interactivo y viceversa de forma cíclica. Toda verificación debe pasar de forma exitosa el analizador estático de guardarraíles integrado en el script de validación arquitectónica.

### 3.6 Política de Persistencia (Persistence Policy)
Toda la información manejada por el editor se clasifica rigurosamente en cuatro grupos claramente definidos, gobernando su almacenamiento, ciclo de vida, almacenamiento físico y volatilidad:

1.  **Persistente**:
    *   *Elementos*: Proyecto completo (estructura, dimensiones del lienzo, ID único, metadatos de capas y fotogramas), base de datos de píxeles (`Record<string, number[]>` que mapea `frameId_layerId`), rangos etiquetados de animación (tags), recursos locales del usuario guardados en biblioteca y configuración propia de cada lienzo (simetría, mosaico/tiling, guías personalizadas).
    *   *Ciclo de Vida*: Persiste de forma indefinida en almacenamiento físico estable del cliente (`LocalStorage`/`IndexedDB`) y base de datos remota (`Cloud Firestore`). Se graba únicamente en acciones explícitas de guardado ("Guardar", "Guardar como") o mediante el ciclo periódico y seguro de auto-guardado en segundo plano.

2.  **Persistente de Usuario**:
    *   *Elementos*: Preferencias globales de la aplicación, idioma seleccionado (español/inglés), tema visual (claro/oscuro), distribución/layout de paneles laterales colapsables, atajos de teclado asignados y ajustes ergonómicos globales.
    *   *Ciclo de Vida*: Almacenado de forma global en `LocalStorage`. Es completamente independiente de los proyectos específicos cargados en el lienzo y se conserva entre diferentes pestañas y sesiones completas del editor.

3.  **Temporal**:
    *   *Elementos*: Historial de deshacer y rehacer (`undoStack` y `redoStack`), máscara booleana de selección activa (`activeSelection`), herramienta interactiva en uso (lápiz, borrador, cubo de pintura, etc.), nivel de zoom y desplazamiento espacial del lienzo (`panOffset`), coordenadas del puntero, pinceles virtuales activos y estados efímeros de modales/diálogos abiertos en la UI.
    *   *Ciclo de Vida*: Reside única y exclusivamente en la memoria RAM de ejecución de la aplicación (estado reactivo local/React Context). Se destruye de inmediato al refrescar el navegador, cerrar la pestaña o cargar un lienzo diferente. Nunca debe guardarse de forma asíncrona ni guardarse en almacenamiento persistente de disco.

4.  **Caché**:
    *   *Elementos*: Miniaturas visuales (thumbnails), Object URLs dinámicos (`blob:`), texturas cacheadas para previsualización o renderizado acelerado en GPU, buffers intermedios de capas renderizadas (`LayerCacheManager.ts` basado en `WeakMap`) y frames compilados provisionalmente para exportación (GIF/APNG).
    *   *Ciclo de Vida*: Volátil, efímero y regenerable bajo demanda a partir de los datos *Persistentes*. Se aloja temporalmente en memoria para optimizar FPS y puede ser purgado o liberado libremente por el navegador o la aplicación sin suponer pérdida de datos para el usuario final.

---
*Fin del Manual Maestro de Decisiones Arquitectónicas — OnePixel Studio Technical Board.*
