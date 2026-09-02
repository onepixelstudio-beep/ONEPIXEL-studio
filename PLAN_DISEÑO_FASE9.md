# 🎮 PLAN DE DISEÑO Y PLANIFICACIÓN TÉCNICA - FASE 9
## OnePixel Studio - Motor de Exportación Avanzado e Integración para Videojuegos

Este documento técnico establece la planificación arquitectónica, de experiencia de usuario, rendimiento, flujos de empaquetado binario y aseguramiento de la calidad para la **Fase 9: Motor de Exportación Avanzado** en OnePixel Studio, de acuerdo con los estándares y garantías definidos por el Protocolo EBA (Evidence-Based Architecture).

---

## 1. Alcance Funcional (Functional Scope)

El objetivo central de la Fase 9 es consolidar y robustecer un sistema integrado, desacoplado y de alto rendimiento para exportar creaciones pixel-art individuales o animadas de OnePixel Studio. El sistema ofrecerá previsualizaciones reactivas en tiempo real antes de la descarga, estimación del tamaño del archivo, barra de progreso con opción de cancelación, y soporte técnico avanzado tanto para artistas individuales como para desarrolladores profesionales de videojuegos.

### Dentro de Alcance (In-Scope)

1. **Abstracción del Core de Composición (`CompositionEngine`)**:
   * Desacoplar por completo el dibujado en el Canvas del proceso de exportación.
   * Centralizar en un único punto matemático offscreen la composición de múltiples capas, mezcla de opacidades, aplicación de Nearest-Neighbor sin interpolación difuminada, márgenes exteriores, rellenos y asignación de fondos sólidos o transparentes.

2. **Formato de Exportación Estática Avanzada (Artista y Escritorio)**:
   * **PNG**: Con soporte completo de transparencia alfa o relleno de fondo personalizado, y escalas Nearest-Neighbor del arte de 1x hasta 64x.
   * **JPEG/WebP**: Formatos de alta compresión y calidad variable ajustable para bocetos o subidas directas a la web.
   * **Windows BMP / TARGA TGA / TIFF / Windows ICO**: Soporte nativo para formatos retro e impresión sin compresión lineal de color.

3. **Formato de Animación de Loop Fluido (Artista y Redes Sociales)**:
   * **GIF Animado**: Codificación binaria optimizada con control preciso de velocidad por fotograma (FPS), loops continuos y transparencia opcional.
   * **APNG Animado (Animated PNG)**: Alternativa de animación en 24 bits con degradados de transparencia perfectos y excelente compatibilidad con navegadores modernos.

4. **Integración Avanzada para Desarrollo de Videojuegos (Game Developer)**:
   * **Hojas de Sprites (Sprite Sheets)**: Generador secuencial parametrizable en tres tipos de distribuciones espaciales: tira horizontal, tira vertical y cuadrícula (grid) personalizada.
   * **Parámetros de Maquetación**: Configuración interactiva de márgenes exteriores, espaciados/padding internos entre cuadros y color de fondo.
   * **Atlas de Texturas + Metadatos**: Exportador empaquetado (.zip) que genera de forma sincronizada una Hoja de Sprites unificada con su manifiesto descriptivo compatible con motores comerciales:
     * **Atlas JSON**: Formato clave-valor estructurado compatible con Phaser, PixiJS, Unity, Godot y similares.
     * **Atlas XML**: Estructura jerárquica para Starling, Cocos2D y motores tradicionales.
   * **Secuencia de PNGs**: Generador de imágenes independientes ordenadas numéricamente con relleno de ceros personalizables (ej: `001`, `0001`), empaquetadas en un único `.zip` rápido con un manifiesto descriptivo `manifest.json`.

5. **Exportador de Paletas de Colores de la Industria**:
   * Exportar paletas de color activas a formatos externos universales: GPL (GIMP / Aseprite), ACT (Photoshop), ACO y PAL.

6. **Interfaz de Usuario Reactiva y Tolerante a Fallos**:
   * **ExportModal**: Pantalla interactiva que renderiza controles de parámetros personalizados basados dinámicamente en el plugin seleccionado (sin menús rígidos o acoplados).
   * **Previsualizador Reactivo de Solo Lectura**: Espacio visual de alta fidelidad que muestra el tamaño real y el resultado exacto del archivo final antes de descargarlo.
   * **Barra de Progreso y Cancelación Activa**: Indicadores visuales detallados (paso en el que se encuentra y porcentaje) con opción de cancelación inmediata mediante `AbortSignal` en codificaciones binarias complejas.

### Fuera de Alcance (Out-of-Scope)

1. Soporte para codificadores pesados de vídeo contenedor (como MP4, WebM) directamente integrados en el cliente que requieran librerías WASM masivas, manteniéndose únicamente en GIFs, APNGs y secuencias PNG ligeras.
2. Sincronización automática de exportaciones directas hacia nubes de terceros o repositorios Git (se limita a la tradicional descarga del archivo binario del lado del cliente).
3. Modificación del lienzo o del historial de edición en tiempo real mientras el modal de exportación se encuentra activo.

---

## 2. Arquitectura Propuesta (Proposed Architecture)

La arquitectura de la Fase 9 se fundamenta sobre la total independencia de responsabilidades (SRP) y el aislamiento de componentes. Se evita que los exportadores conozcan detalles específicos de las vistas o el DOM y se establece un pipeline estricto de conversión de datos inmutables intermedios.

### Flujo de Datos Unidireccional y Desacoplado:
```
Project (Zustand/Editor)
       ↓
CoreRenderProcessor (Genera los frames compuestos)
       ↓
RenderResult (Contrato Intermedio Agnóstico en Memoria) [Soporta RenderCache]
       ↓
ExportPlugin (Estrategia de Codificación Modular y OCP)
       ↓
EncodedFile (Contenedor de Datos Planos / Binarios)
       ↓
FileSaveService (Único punto de descarga física y fallback)
```

```
       +-----------------------------------------------------------+
       |                  UI - [ExportModal] (React)               |
       |  - Construcción dinámica mediante getOptionsSchema()      |
       |  - Consume progreso rico, capacidades y previsualización   |
       +-----------------------------+-----------------------------+
                                     | (Llama a despachar)
                                     v
       +-----------------------------------------------------------+
       |               ExportPluginRegistry (Singleton)            |
       |  - Registro abierto-cerrado (.register, .get, .list)       |
       |  - Desvincula la interfaz del listado rígido de formatos  |
       +-----------------------------+-----------------------------+
                                     |
                                     v
       +-----------------------------------------------------------+
       |            Core Render Processor (Composite & Render)     |
       |  - Une capas con opacidad y visibilidad activa            |
       |  - Aplica escalado Nearest-Neighbor, recorte, márgenes,   |
       |    pivotes, padding y colores de fondo offscreen          |
       |  - Devuelve exclusivamente el objeto agnóstico:           |
       |    -> [RenderResult] (frames[], width, height, palette)   |
       +-----------------------------+-----------------------------+
                                     | (Almacena o Consulta)
                                     v
       +-----------------------------------------------------------+
       |                RenderCache (In-Memory Cache)              |
       |  - Evita re-renderizar los mismos cuadros en múltiples    |
       |    exportaciones consecutivas (ej: PNG -> GIF -> Sprite)  |
       +-----------------------------+-----------------------------+
                                     | (RenderResult entregado al plugin)
                                     v
  +----------------------------------+----------------------------------+
  |                                                                     |
  v (image plugins)       v (animation plugins)     v (game plugins)    v (palette plugins)
+-------------------+   +---------------------+   +-------------------+   +--------------------+
|  - PngPlugin      |   |  - GifPlugin        |   | - SpriteSheet     |   |  - ActPlugin       |
|  - JpegPlugin     |   |  - ApngPlugin       |   |   (Simple/Atlas)  |   |  - AcoPlugin       |
|  - WebpPlugin     |   |                     |   | - PngSequenceZip  |   |  - GplPlugin       |
|  - RetroPlugins   |   |                     |   |                   |   |  - PalPlugin       |
+-------------------+   +---------------------+   +-------------------+   +--------------------+
                                     | (Entrega EncodedFile)
                                     v
       +-----------------------------------------------------------+
       |                     FileSaveService                       |
       |  - Punto único de persistencia: descargas, blobs, base64  |
       +-----------------------------------------------------------+
```

### Componentes Clave

1. **`ExportPluginRegistry` (Arquitectura OCP Abierta/Cerrada)**:
   * **Responsabilidad**: Registro descentralizado donde los plugins se inscriben de manera independiente. Elimina sentencias `switch(format)` y hace el pipeline preparado para complementarse en el futuro con nuevos exportadores externos (LDtk, Tiled, etc.) sin cambiar el core.

2. **`Core Render Processor` (Composición Offscreen Pura)**:
   * **Ubicación**: `/src/utils/canvas/CoreRenderProcessor.ts`.
   * **Responsabilidad**: Librería puramente matemática y gráfica offscreen. No conoce los formatos binarios ni las extensiones (PNG, GIF, ZIP). Su única función es recibir los datos de píxeles del proyecto y devolver un `RenderResult` limpio de fotogramas planos ya escalados mediante Nearest-Neighbor.

3. **`RenderCache` (Ahorro de Cómputo)**:
   * **Responsabilidad**: Almacena en memoria el `RenderResult` asociado a la firma del proyecto (actualizada mediante `updatedAt`, número de frames, escala y estado de capas). Si el artista exporta secuencialmente en múltiples formatos, evita re-dibujar offscreen las capas de cada frame.

4. **`FileSaveService` (Aislamiento de Persistencia)**:
   * **Responsabilidad**: Único punto de guardado y descarga en disco. Abstrae la generación de URLs de blobs, descargas a través de elementos de anclaje temporales, control de memoria y fallbacks, aislando de esta forma a los codificadores de interactuar con el DOM.

5. **`ExportCapabilities` y `ExportOptionsSchema` (UI Autogenerable)**:
   * **Responsabilidad**: Los plugins declaran de manera estática y tipada qué capacidades soportan (`supportsAnimation`, `supportsTransparency`, etc.) y el esquema de campos interactivos requeridos (`getOptionsSchema()`). El componente React lee esta plantilla y autogenera sliders, dropdowns e inputs dinámicamente.

6. **`ExportProgress` (Progreso Enriquecido)**:
   * **Responsabilidad**: Proporciona descripciones e información granular en cada paso del flujo (`Reading project`, `Rendering frame 12/40`, `Encoding GIF`, `Compressing`, `Completed`), manteniendo al usuario informado a nivel visual.

7. **Cancelación Cooperativa con `AbortSignal`**:
   * **Responsabilidad**: Todos los bucles pesados de codificación y compresión evalúan de forma reactiva y periódica `signal.aborted` para detener la CPU y liberar la memoria inmediatamente si el usuario cancela la exportación.

---

## 3. Objetivos del Definition of Done (DoD)

Para que la Fase 9 se declare oficialmente Certificada y Congelada bajo el protocolo EBA, se deben cumplir los siguientes requisitos:

### Criterios Funcionales
* **Composición Idéntica**: El resultado exportado debe coincidir exactamente píxel a píxel con el arte pintado por el usuario, preservando transparencias en los formatos compatibles.
* **Escalado Perfecto**: Las ampliaciones (desde 1x hasta 64x) no deben sufrir difuminados de color ni efectos antialiasing inducidos por interpolación bilineal o bicúbica en el navegador.
* **Hojas de Sprites Flexibles**: Soporte absoluto para tiras horizontales, tiras verticales y cuadrículas con márgenes exteriores y espaciado interior configurable sin cortes ni deformación matemática de las dimensiones de los sprites.
* **Exportador Integrado de Atlas**: El archivo ZIP descargado en la opción Atlas de Videojuegos debe contener la hoja de sprites perfectamente alineada junto con su manifiesto JSON/XML correspondiente sincronizado con nombres de cuadros legibles.
* **Empaquetado Completo en ZIP**: El empaquetado de secuencia de PNGs debe incluir todos los cuadros del timeline numerados ordenadamente y con un manifiesto json opcional legible.

### Criterios Técnicos
* **Arquitectura Altamente Desacoplada**: El proceso de composición y exportación no debe importar componentes React, ganchos (hooks) visuales, ni clases directas de edición del Canvas. Toda la entrada se recibe mediante contratos de datos estables (`ExportContext` y `PixelProject`).
* **Aislamiento del DOM**: Ningún plugin de formato o codificador realiza operaciones de descarga directa, creación de elementos `<a>`, blobs, o manipulación directa del lienzo visual del editor.
* **Seguridad contra Bloqueos**: Exportaciones pesadas de múltiples fotogramas (por ejemplo, GIFs de más de 60 cuadros) no deben provocar advertencias de "página web no responde". Deben procesarse de forma distribuida en micro-tareas utilizando intervalos asíncronos o chunks temporizados para devolver el control al hilo del navegador.
* **Gestión Eficiente de Memoria**: Liberación inmediata de todos los recursos (buffers de previsualización, canvas offscreen temporales y URLs de descarga) tras finalizar el empaquetado o pulsar el botón de cancelar.
* **Soporte de Abortabilidad**: Detener de forma inmediata todos los bucles de compresión binaria al recibir una señal de cancelación en el `AbortSignal`, retornando al editor a su estado activo de forma segura.

### Criterios de Calidad
* **Cobertura de Pruebas Unitarias**: El motor de composición central y los formateadores de atlas deben estar respaldados por una batería exhaustiva de pruebas automáticas en Vitest que certifiquen el 100% de la precisión del procesado geométrico.
* **Localización (i18n)**: Traducción de todos los nombres, descripciones, etiquetas de parámetros y textos de carga al español, inglés y portugués.
* **Ausencia de dependencias circulares**: El linter y el sistema de guardrails arquitectónicos integrados en OnePixel Studio deben reportar estado verde limpio sin violaciones de fronteras en el subsystem de exportación.

### Criterios de UX
* **Previsualización Instantánea**: Mostrar una miniatura dinámica del archivo final a generar con su respectivo tamaño estimado (en KB/MB) calculado al vuelo.
* **Retroalimentación de Progreso**: Pantalla clara de estado intermedio que evite la incertidumbre del artista mostrando el paso actual (ej: "Renderizando fotogramas...", "Comprimiendo GIF...", "Generando archivo final...") con barra animada fluida.
* **UI Dinámica Autogenerada**: La interfaz de configuración en el modal de exportación se dibuja de forma interactiva mapeando los campos del esquema declarado por el plugin seleccionado, logrando un desacoplamiento del 100%.

---

## 4. Riesgos Técnicos y Plan de Mitigación

| Riesgo Técnico Identificado | Impacto | Estrategia de Mitigación EBA |
| :--- | :---: | :--- |
| **Congelamiento de interfaz durante codificación compleja de GIF/APNG** | Alto | Implementar un esquema de procesamiento distribuido (cooperative multitasking) en los decodificadores y generadores mediante pausas programadas (`await new Promise(resolve => setTimeout(resolve, 0))`) entre lotes de fotogramas, o modular el flujo permitiendo la futura delegación a Web Workers sin alterar las firmas públicas. |
| **Pérdida de nitidez (Bilinear blurring) en el escalado del navegador** | Alto | Desactivar la suavización de imágenes de forma explícita en todos los contextos de renderizado offscreen y en la hoja de estilos CSS de las miniaturas de previsualización (`image-smoothing-enabled: false`, `image-rendering: pixelated`). |
| **Desborde de memoria RAM por acumulación de Canvas Offscreen** | Medio | Utilizar un patrón de inicialización perezosa de canvas, reciclar las instancias de los contextos gráficos intermedios en un pool estático y forzar la re-especificación de ancho y alto a 0 para forzar la liberación de memoria en el recolector de basura del navegador (V8) al cerrar el modal. |
| **Incompatibilidad de nombres de archivos y caracteres especiales** | Bajo | Implementar saneamiento estricto de nombres de archivos antes de la descarga, sustituyendo espacios por guiones bajos (`_`) y eliminando acentos o caracteres especiales conflictivos en sistemas de archivos Unix/Windows. |

---

## 5. Plan de Implementación por Bloques

La Fase 9 de OnePixel Studio se segmentará en 4 bloques funcionales con entregas claras evaluadas bajo el estándar de evidencia arquitectónica.

### 📦 Bloque 9.1: Abstracción de Datos, Core Pipeline y ADR-012 (CONGELADO ✅)
* **Objetivo**: Implementar los modelos de datos intermedios estables de exportación, unificar la configuración mediante `ExportContext` y aislar el registro de plugins `PluginRegistry` para soportar OCP.
* **Entregables**:
  * Formalización de `/docs/adr-012-export-pipeline.md`.
  * Creación y tipado de los modelos intermedios y de configuración (`ExportContext`, `ExportPlugin`, `ExportOptionField`, `ExportProgress`, `ExportCapabilities`, `RenderResult`) en `src/utils/export/ExportTypes.ts`.
  * Creación del Singleton de registro robusto `ExportPluginRegistry` en `src/utils/export/ExportPluginRegistry.ts`.
  * Desarrollo del servicio agnóstico de persistencia local `FileSaveService` en `src/utils/export/FileSaveService.ts`.
  * Implementación del almacenamiento en memoria de fotogramas compuestos `RenderCache` en `src/utils/export/RenderCache.ts`.
  * Cobertura de pruebas unitarias al 100% para las piezas arquitectónicas en `src/utils/export/__tests__/ExportArchitecture.test.ts`.

### 📦 Bloque 9.2: Core Render Processor (Motor de Composición y Transformaciones Centrales) (CONGELADO ✅)
* **Objetivo**: Desarrollar la biblioteca pura de renderizado y composición offscreen `CoreRenderProcessor` responsable de la mezcla de capas, Nearest-Neighbor escalable, márgenes, padding y alineaciones.
* **Entregables**:
  * Creación del archivo puramente matemático `/src/utils/canvas/CoreRenderProcessor.ts`.
  * Método compositor y renderizador de frames `render(project, settings)` que procesa de manera aislada e inmutable capas, opacidades y visibilidad.
  * Pipeline estructurado en RenderPasses independientes: `LayerMergePass`, `BgColorPass`, `CropPass`, `PaddingPass`, `MarginPass` y `ScalingPass` (Nearest-Neighbor).
  * Soporte robusto de validación de datos de entrada (`RenderValidator`), recopilación de advertencias asíncronas (`RenderWarning`), informes estadísticos detallados de CPU/rendimiento (`RenderStatistics`) y ganchos de ciclo de vida (`RenderHooks`).
  * Pruebas de cobertura exhaustivas en `/src/utils/export/__tests__/CoreRenderProcessor.test.ts`.

### 📦 Bloque 9.3: Refactorización y Portabilidad de los Plugins de Formato (OCP)
* **Objetivo**: Refactorizar los codificadores y exportadores de formatos actuales (`PngPlugin`, `GifPlugin`, `ApngPlugin`, `SpriteSheetSimplePlugin`, etc.) para que consuman exclusivamente la biblioteca de composición central, eliminando toda la lógica duplicada.
* **Entregables**:
  * Modularización de los exportadores de formato en archivos de plugins específicos en `/src/utils/export/`.
  * Integración de los flujos de atlas de videojuegos (JSON/XML) utilizando el core unificado.
  * Implementación del plugin de secuencias de imágenes numeradas en archivo ZIP con manifiesto json.
  * Integración de exportadores binarios para paletas de colores (ACT, ACO, GPL, PAL).
  * Soporte activo del controlador de progreso y señalización de abortabilidad cooperativa en cada uno de los plugins portados.

### 📦 Bloque 9.4: Modal de Exportación Avanzado con Previsualización Reactiva y Progreso
* **Objetivo**: Desarrollar la interfaz visual reactiva del modal de exportación que renderiza opciones dinámicamente según la firma del plugin seleccionado, estimando el peso de los archivos y mostrando previsualizaciones antes de la descarga.
* **Entregables**:
  * Maquetación avanzada de `/src/components/ExportModal.tsx` con un área de previsualización interactiva con efecto de tablero de ajedrez pixel-art.
  * Generación dinámica de formularios de configuración a partir de la plantilla de campos `optionsTemplate` declarada por el plugin de exportación activo.
  * Estimador de peso de archivo en kilobytes de solo lectura.
  * Barra de progreso fluida de dos estados (etapa del proceso y porcentaje) que bloquea la interacción general de edición pero permite la cancelación asíncrona segura mediante el botón de interrumpir.

---

## 6. Plan de Validación bajo el Protocolo EBA

Para dar conformidad a cada uno de los entregables y asegurar que no existan regresiones en el sistema a lo largo del proceso de integración, se establece el siguiente esquema de verificación continuo:

1. **Pruebas Unitarias Exhaustivas (Vitest)**:
   * Diseñar un conjunto de pruebas automáticas en `/src/utils/__tests__/CoreRenderProcessor.test.ts` para verificar la composición exacta de capas, el orden, los filtros de transparencia, la aplicación de padding y márgenes de dibujo, y que el escalado a 16x sea idéntico píxel a píxel con el original escalado matemáticamente.
   * Ejecución constante de la suite de pruebas completa utilizando `npm test` para asegurar que las modificaciones del pipeline no alteren los subsistemas de capas, animación o historial del Canvas.

2. **Análisis Estático Riguroso (ESLint & TypeScript)**:
   * Ejecución de `npm run lint` para garantizar que la reestructuración del motor de exportación no induzca errores sintácticos, variables no declaradas o importaciones duplicadas.
   * Validación automática de la ausencia de dependencias circulares mediante el script de inspección de arquitectura integrado de OnePixel Studio (`validate-guardrails`), asegurando que el módulo de exportación sea puramente de consumo y no cree acoplamientos hacia arriba en la jerarquía del editor.

3. **Verificación del Comportamiento en Producción (Vite Build)**:
   * Compilación completa de producción (`npm run build`) para validar que las librerías binarias ligeras de codificación (GIF, APNG, fflate) se empaqueten adecuadamente en el bundle final sin generar advertencias de sobrepeso ni romper el compilador estático de Vite.
