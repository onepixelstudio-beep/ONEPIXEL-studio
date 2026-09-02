# ADR-012: Arquitectura del Motor de Exportación Avanzada (Export Pipeline)

## Estado
**APROBADO** (Diseñado bajo el protocolo EBA)

## Contexto
El editor OnePixel Studio requiere un sistema altamente sofisticado, preciso y extensible para exportar las creaciones de los artistas a múltiples formatos de distribución, incluyendo imágenes estáticas avanzadas, animaciones optimizadas y hojas de sprites con metadatos de integración para motores de videojuegos (Phaser, Unity, PixiJS, Godot, etc.).

Originalmente, los exportadores iniciales estaban dispersos y acoplados parcialmente con el componente visual del lienzo, requiriendo el acceso a estados internos del componente React y repitiendo cálculos geométricos como la composición de capas (`layers`), escalados por aproximación de vecino más cercano (`Nearest-Neighbor`), rellenos de fondo (`bgColor`) y márgenes. 

Para asegurar un crecimiento arquitectónico robusto, sostenible y libre de dependencias circulares o acoplamientos innecesarios, se decide diseñar un **Pipeline de Exportación Desacoplado** guiado por el principio de Responsabilidad Única (SRP) y el principio de Abierto/Cerrado (OCP).

## Decisiones

1. **Creación del Core de Composición Offscreen (`CompositionEngine`)**:
   - Centralizar toda la lógica de composición de fotogramas fuera de los componentes React.
   - Se crea una biblioteca matemática y gráfica pura que recibe una definición abstracta de fotogramas, capas y datos de píxeles, y compone un lienzo virtual plano (offscreen).
   - Ningún exportador de formato individual (PNG, GIF, Sprite Sheet) deberá implementar la mezcla de capas u opacidades; todos llamarán a un único método unificado que garantiza la uniformidad y el pixel-art perfecto.

2. **Abstracción de Contratos Públicos Estables (`ExportContext` e Interfaces)**:
   - Los datos de entrada del editor se transforman a un modelo de datos inmutable intermedio antes de ingresar al pipeline. De este modo, la lógica de exportación es inmune a cambios futuros en la base de datos o en la estructura de persistencia del editor de recursos.
   - La interfaz del plugin (`ExportPlugin`) encapsula los metadatos visuales, la definición dinámica de opciones de configuración de la interfaz de usuario (`optionsTemplate`) y la rutina de ejecución:
   ```typescript
   export interface ExportPlugin {
     id: string;
     name: string;
     desc: string;
     category: 'image' | 'animation' | 'game' | 'palette';
     icon: string;
     extension?: string;
     optionsTemplate: ExportOptionField[];
     execute: (context: ExportContext) => void | Promise<void>;
   }
   ```

3. **Arquitectura Extensible por Registro de Estrategias (OCP)**:
   - El sistema actúa como un despachador centralizado (`PluginRegistry`).
   - Agregar un formato nuevo (por ejemplo, exportación de mapas de teselas, formato nativo de Aseprite, animaciones en WebM, etc.) no requiere modificar los componentes de interfaz de usuario ni el orquestador central. Únicamente se escribe el nuevo plugin inmutable que implemente la interfaz `ExportPlugin` y se registra en la base de datos de plugins a través del método `register()`.

4. **Soporte para Procesos Asíncronos, Progreso y Cancelación (Abortable Streams)**:
   - Formatos complejos como GIF y APNG de larga duración requieren cálculos binarios densos que pueden congelar el hilo principal del navegador.
   - El contrato de ejecución del pipeline se dota de un controlador de progreso (`onProgress`) y soporte de interrupción cooperativa mediante el paso estándar de `AbortSignal`:
   ```typescript
   export interface ExportContext {
     project: PixelProject;
     scale: number;
     options: Record<string, any>;
     showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
     onProgress?: (stepName: string, progressPercentage: number) => void;
     signal?: AbortSignal;
   }
   ```

5. **Aislamiento de la Interfaz de Usuario (UI Separation)**:
   - La vista React (`ExportModal`) es un consumidor agnóstico de los metadatos de los plugins. Genera los menús de configuración y opciones avanzadas dinámicamente según la plantilla declarada por el plugin seleccionado (`optionsTemplate`), evitando acoplamientos rígidos (hardcoding) de menús visuales.

## Invariantes del CoreRenderProcessor

Para asegurar la robustez, predictibilidad e inmutabilidad del motor de renderizado y composición central, se establecen las siguientes invariantes arquitectónicas:

1. **Inmutabilidad Absoluta**: Ningún `RenderPass` modifica los datos originales del proyecto o los estados de entrada. Todas las operaciones de transformación se realizan sobre y devuelven nuevas instancias inmutables de `FrameBuffer`.
2. **Desacoplamiento Total del Entorno**: Ningún `RenderPass` o componente del pipeline puede depender de las APIs del DOM (como `HTMLCanvasElement`, `window` o `document`) o del framework de interfaz React. Las operaciones son matemáticas y matriciales puras.
3. **Determinismo Estricto**: Para una misma entrada (`PixelProject` y `RenderSettings`), el resultado de la composición del pipeline es completamente determinista y reproducible, facilitando pruebas unitarias exactas e invalidación predictiva de la caché.
4. **Independencia de Formatos**: El `CoreRenderProcessor` permanece 100% agnóstico respecto a los codificadores y formatos finales de exportación (PNG, GIF, Sprite Sheet, etc.). Su única responsabilidad es componer el búfer matricial.
5. **Preparación para Web Workers**: Al operar únicamente sobre estructuras de datos planas e inmutables transferibles (arrays de cadenas indexados), la arquitectura del pipeline queda nativamente preparada para ejecutarse en hilos secundarios (Web Workers) sin requerir modificaciones en la interfaz o refactorizaciones complejas.

## Consecuencias

- **Duplicación de Código Cero**: Toda la lógica compleja de mezcla de opacidades de capas, visibilidad, escalados perfectos de píxeles y dibujo offscreen se encapsula en un único componente del motor, reduciendo el tamaño total del bundle y facilitando la depuración.
- **Mantenibilidad Excelente**: Los errores asociados a formatos específicos de exportación quedan completamente aislados en sus archivos de plugin correspondientes.
- **Sólida Arquitectura de Tests**: Al ser un pipeline matemático y binario puro que opera sobre modelos inmutables e independientes del DOM (utilizando representaciones offscreen o inyectando abstracciones de Canvas), es sumamente sencillo escribir pruebas unitarias de integración automatizadas para todos los formatos.
- **Preparación para Web Workers**: El desacoplamiento total de los estados de React y la centralización de datos planos inmutables permite en fases posteriores delegar de forma inmediata el empaquetado y codificación binaria a Web Workers o hilos de fondo sin modificar la interfaz de usuario.
