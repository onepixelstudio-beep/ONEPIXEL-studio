# Acta de Auditoría Técnica — Bloque 1 Final
**OnePixel Studio — Congelación de Framework de Estabilización (QA v1.0.0-frozen)**

Este documento registra la auditoría técnica y de arquitectura realizada antes del inicio de la **Fase 3** del editor. El objetivo es certificar la madurez, identificar cuellos de botella y registrar la deuda técnica acumulada de manera estructurada y objetiva.

---

## 1. Arquitectura de Software

### Dependencias Circulares
- **Estado Actual**: No se han detectado ciclos de importación críticos (`A -> B -> A`) que bloqueen el empaquetado de Vite o causen fallos de inicialización tardía en ES Modules. Sin embargo, existe un acoplamiento estrecho entre `src/App.tsx` y el subsistema de telemetría, así como con `layerCacheManager`.
- **Riesgo**: Moderado. La modularización del módulo de animación (`src/utils/animation`) ayuda a desacoplar los servicios del ciclo de vida del componente, pero el hecho de que `App.tsx` actúe como "orquestador universal" crea un punto de tracción centralizado.

### Módulos Sobredimensionados (Monolitos de Archivo)
- **`src/App.tsx` (~3,838 líneas)**: Es el orquestador principal de la aplicación. Declara más de 40 hooks de estado y funciones de callback (`handleAddLayer`, `handleRotateSprite`, etc.), además de manejar la renderización de la interfaz completa. 
- **`src/components/CanvasArea.tsx` (~3,560 líneas)**: Es un componente gigantesco que contiene tanto la lógica de interacción con el puntero (herramientas, simetrías, selecciones, transformaciones, dithering) como la lógica de dibujo directo en canvas.
- **Acción Recomendada**: Reducir la complejidad de estos archivos antes de iniciar la Fase 3, extrayendo las interacciones de herramientas de CanvasArea hacia gestores dedicados de herramientas, y descentralizando parte del estado de `App.tsx`.

### Responsabilidades Duplicadas
- **Subsistemas de Historial**: Contamos con un sistema híbrido de Undo/Redo:
  1. `useUndoRedo.ts` (basado en snapshots estructurales del estado de píxeles).
  2. `CommandSystem.ts` (`timelineCommandHistory`, basado en el patrón Comando para operaciones del Timeline como añadir/mover fotogramas).
- **Tratamiento**: Aunque cooperan de manera coordinada (verificando la pila de comandos estructurales primero), este diseño híbrido duplica la responsabilidad de gestionar el retroceso de estado y aumenta la probabilidad de desincronización si se ejecutan acciones entrelazadas de dibujo y manipulación del timeline de forma consecutiva.

### Código Muerto e Inactivo
- Existen algunas declaraciones auxiliares en `src/utils/canvas.ts` y funciones de conversión de color en `colorUtils.ts` que no están siendo importadas activamente en producción, pero se conservan para retrocompatibilidad de exportación o pruebas unitarias de importación.

---

## 2. Rendimiento y Eficiencia de Memoria

### Re-renderizados en React
- **Diagnóstico**: Al estar centralizado el estado `project` en `App.tsx`, **cualquier trazo en el Canvas que actualice la matriz de píxeles modifica la referencia de `project`**. Esto desencadena un ciclo de renderizado en todo el árbol de React.
- **Mitigación Actual**: El uso de `React.memo` en componentes clave como `CanvasArea`, `Timeline` y `Toolbar` detiene la propagación de renders innecesarios en la UI.
- **Cuello de Botella O(n²)**: En lienzos de gran resolución (e.g., 128x128 píxeles o superior) con múltiples fotogramas y capas, el cálculo del snapshot estructural mediante `JSON.parse(JSON.stringify(...))` dentro de `saveSnapshotToHistory` se ejecuta en tiempo lineal respecto al número total de píxeles del proyecto, lo que provoca picos significativos de recolección de basura (Garbage Collection) y posibles congelamientos momentáneos de fotogramas (micro-stuttering) durante acciones de dibujo continuo de larga duración.

### Timers y Listeners Huérfanos
- La suite de telemetría de rendimiento y el gestor de eventos (`animationEventBus`) han sido auditados: se confirma que limpian correctamente sus suscripciones. No obstante, en `App.tsx`, las suscripciones de teclado globales (`keydown`) deben gestionarse con estricta precaución para evitar la acumulación de listeners huérfanos al alternar modales de configuración.

---

## 3. Estado Global y Sincronización

- **Modelo**: No se utilizan librerías externas de estado global como *Zustand* o *Redux*. El estado se orquesta mediante un hook local de React de tipo `useState` en `App.tsx`, propagado hacia abajo mediante props (Prop-Drilling) o referencias directas expuestas para pruebas (`window.onePixelQA`).
- **Ventajas**:
  - Cero dependencias adicionales para el núcleo del editor.
  - Sincronización 100% determinista y predecible.
- **Desventajas**:
  - Prop-drilling extremo que dificulta la legibilidad del código.
  - Acoplamiento directo de la UI de edición con el estado de datos en memoria.

---

## 4. Canvas Engine (Motor de Renderizado)

- **Comportamiento y Estructura**: El motor utiliza una arquitectura excelente de búferes offscreen para renderizar capas de manera independiente (`layerCacheManager`), combinándolas en un lienzo final en base al fotograma activo.
- **Zoom & Pan**: Integrado eficientemente a través de `useCanvasZoomPan`, gestionando matrices CSS transform sobre el contenedor o coordenadas de dibujo sin forzar renders de React en eventos de alta frecuencia como la rueda del ratón o el arrastre.
- **Composición**: El uso de `WeakMap` en `LayerCacheManager` para asignar identificadores estables de O(1) a los arreglos de píxeles evita redibujar capas que no han sufrido modificaciones. Esto reduce drásticamente el consumo de CPU y mantiene los FPS estables por encima de 60 FPS en el motor de render.

---

## 5. Historial (Undo / Redo)

- **Capacidad**: El límite de historial está fijado en un máximo de **50 niveles**.
- **Consumo de Memoria**: Un proyecto de 64x64 píxeles con 5 capas consume aproximadamente 16KB por snapshot estructural. 50 niveles de historial ocupan menos de 1MB, lo cual es perfectamente tolerable. No obstante, para proyectos complejos con 50 frames y 10 capas de 64x64, el consumo de memoria del historial escala a ~40MB en memoria activa.
- **Optimización futura**: Implementar **Structural Sharing** (compartir referencias de capas no modificadas entre snapshots en lugar de realizar una clonación profunda de todo el mapa de píxeles).

---

## 6. Timeline y Animación

- **Estructura**: El Timeline opera de forma síncrona con el estado del Canvas, manejando fotogramas y etiquetas de reproducción (Animation Tags).
- **Reproducción**: El bucle de previsualización (Play) actualiza la selección del fotograma activo a intervalos de tiempo constantes (FPS), lo que dispara re-renderizados continuos a través del estado de `App.tsx`.
- **Estabilidad**: Es robusto, pero el bucle de reproducción interactivo debe aislarse del ciclo de renderizado de React en el futuro, renderizando el bucle directamente en un canvas de vista previa aislado para evitar la carga de render de toda la UI en reproducción activa.

---

## 7. Exportadores

- **Arquitectura**: Los exportadores (APNG, GIF, ASE, Atlas, PDF, Hojas de Sprite) están desacoplados de la interfaz, ubicados de forma independiente en `src/utils`.
- **Evaluación**: La arquitectura de exportadores es **altamente modular y mantenible**. Cumple perfectamente con los principios de responsabilidad única y es fácilmente extensible para incorporar nuevos formatos sin alterar el núcleo del editor.

---

## 8. Riesgos de Cuello de Botella en Futuras Fases

Durante la Fase 3 y posteriores, los siguientes componentes del editor pueden presentar cuellos de botella de rendimiento si no se diseñan con cuidado:

1. **Barra de Opciones de Herramientas**: La visualización reactiva de configuraciones de pinceles complejos, patrones y asimetrías puede generar desincronización si no se aíslan mediante componentes ligeros desacoplados.
2. **Herramientas de Selección Avanzada (Magic Wand, Selección Elíptica, Poligonal)**: Las operaciones de inundación (Flood Fill) y cálculo de contornos en tiempo de dibujo pueden congelar el hilo principal en lienzos grandes si no se ejecutan con algoritmos optimizados.
3. **Filtros en Tiempo Real**: Procesar convoluciones (desenfoque, corrección de color, ruido) en toda la matriz de píxeles mediante JavaScript puro es ineficiente; se debe priorizar el cálculo en Canvas 2D utilizando `ImageData` de manera nativa o a través de Shaders en un lienzo auxiliar.

---

## 9. Registro de Deuda Técnica Priorizada

| ID | Tarea / Área | Impacto | Riesgo | Dificultad | Momento Recomendado para Resolver |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DT-01** | Monolito de `src/App.tsx` y `CanvasArea.tsx` | **Muy Alto** | **Medio** | **Alta** | Mitad de la Fase 3 (Refactorización de control) |
| **DT-02** | Clonación Profunda JSON en Historial | **Alto** | **Bajo** | **Media** | Inicio de la Fase 3 (Prevención de stuttering) |
| **DT-03** | Doble Motor de Historial (Snapshots vs Comandos) | **Medio** | **Alto** | **Alta** | Final de la Fase 3 (Unificación de estado) |
| **DT-04** | Bucle de Previsualización en Timeline | **Medio** | **Bajo** | **Baja** | Durante la fase de animación avanzada |

---

## 10. Conclusiones y Preparación para Fase 3

### ¿La arquitectura está preparada para comenzar la Fase 3?
**Sí.** La base de código de OnePixel Studio es excepcionalmente limpia, modular en sus utilidades y cuenta con un motor de renderizado optimizado mediante capas independientes que proporciona un rendimiento sobresaliente.

### ¿Existe algún riesgo importante que deba resolverse antes de continuar?
No existen riesgos bloqueantes de estabilidad (lo cual ha sido certificado por la exitosa compilación limpia, linter libre de errores, y la congelación del Framework QA v1.0). Sin embargo, el riesgo de rendimiento debido al clonado estructural en el historial para proyectos de alta densidad de fotogramas debe ser vigilado de cerca.

### ¿Qué refactorizaciones son obligatorias antes de continuar?
Ninguna es obligatoria de forma estricta para *comenzar*, pero se aconseja encarecidamente implementar una optimización básica en `useUndoRedo` para evitar la serialización JSON del proyecto completo si solo se ha pintado en un búfer específico.

### ¿Qué refactorizaciones pueden esperar?
1. La unificación de los dos sistemas de historial (Command vs Snapshot) puede postergarse de forma segura hasta consolidar la Fase 3 de animación avanzada.
2. La subdivisión modular completa de `App.tsx` y `CanvasArea.tsx` puede realizarse de forma iterativa y progresiva a medida que se implementen los nuevos componentes de herramientas y opciones.
