# DOCUMENTO VIVO DE IDEAS FUTURAS Y EVOLUCIÓN
## OnePixel Studio — Post-Fase 10

Este documento actúa como un registro dinámico e histórico de ideas, propuestas tecnológicas y vectores de evolución identificados durante las fases de auditoría y refinamiento (Fase 10). Estas ideas representan la visión futura del producto para su evolución posterior, manteniéndose separadas del núcleo actual congelado.

---

## 1. Vectores de Inteligencia Artificial (AI Pixel Assistant)
Integraciones inteligentes utilizando Gemini y modelos locales de baja latencia para potenciar el flujo del artista sin interrumpir su control manual:

*   **Generador Asistido de Variaciones de Paletas (Gemini-Powered)**:
    *   *Concepto*: Un asistente que analiza los colores activos en el canvas y propone variaciones armónicas basadas en estilos (ej. *Cyberpunk, Pastel de Otoño, GameBoy Clásica*), optimizando el flujo de color del artista de manera instantánea.
    *   *Propósito*: Reducir la fricción creativa inicial al buscar gamas de color especializadas.
*   **Auto-Completado de Animaciones (Pixel Inbetweening)**:
    *   *Concepto*: Modelos predictivos que sugieren fotogramas intermedios (*in-betweens*) basados en el movimiento detectado entre dos fotogramas clave. El artista tiene control absoluto para aceptar, rechazar o ajustar la sugerencia.
    *   *Propósito*: Multiplicar la productividad en animaciones cíclicas complejas.
*   **Asistente de Texturizado Procedural Basado en Prompting**:
    *   *Concepto*: Capa server-side de Gemini que genere micro-patrones repetitivos o texturas de pixel art a partir de descripciones literales (ej. *"ladrillo de piedra desgastado de 16x16"*).

---

## 2. Colaboración en Tiempo Real (Multi-User Collaboration)
Evolución de OnePixel Studio de una herramienta local de un solo usuario a un entorno colaborativo distribuido:

*   **Salas de Dibujo Colaborativas (WebSockets + CRDTs)**:
    *   *Concepto*: Sincronización en tiempo real de lienzos utilizando tipos de datos replicados libres de conflictos (CRDTs, ej. Yjs) y WebSockets autoritativos, permitiendo que varios artistas colaboren sobre el mismo sprite simultáneamente.
    *   *Propósito*: Soporte para game jams, sesiones de diseño en vivo y retroalimentación interactiva.
*   **Control de Versiones del Lienzo (Pixel Git)**:
    *   *Concepto*: Sistema integrado de ramas (*branches*) e historial de cambios con ramificaciones visuales para experimentar con sombreados o detalles alternativos en capas sin alterar el flujo principal de trabajo.
*   **Comentarios y Notas Flotantes en el Canvas**:
    *   *Concepto*: Capa de anotaciones no renderizables donde diseñadores o directores de arte pueden colocar marcas temporales o comentarios textuales en coordenadas específicas del canvas.

---

## 3. Herramientas Avanzadas y Motores de Render
Mejoras funcionales de alta gama para flujos de trabajo profesionales de videojuegos e ilustración:

*   **Sistema de Nodos Procedurales para Efectos**:
    *   *Concepto*: Un editor visual de nodos (ej. *Bloom, Dithering animado, Ruido de perlin*) que aplica filtros de pixel art no destructivos al exportar o visualizar fotogramas.
    *   *Propósito*: Crear efectos visuales dinámicos que consumen mucho tiempo si se realizan manualmente.
*   **Infinite Workspace (Lienzo Infinito)**:
    *   *Concepto*: Una mesa de trabajo infinita donde se pueden organizar múltiples sprites, referencias y paletas como un tablero infinito (al estilo Figma), vinculando recursos entre sí directamente en la interfaz.
*   **Soporte de Vectores a Pixel Art (Rasterización Dinámica)**:
    *   *Concepto*: Importación de trazados vectoriales (SVG) que se rasterizan en tiempo real sobre la rejilla con control paramétrico del anti-aliasing y grosor del pixel outline.
*   **Integración Directa con Motores (Unity/Godot Sync Plugin)**:
    *   *Concepto*: Un servicio local (*hot-reload*) que exporta automáticamente el sprite animado al directorio de un proyecto en Godot o Unity cada vez que el artista guarda en OnePixel Studio, actualizando el sprite-sheet en el motor sin salir de la interfaz de dibujo.

---

Este documento debe ser expandido a medida que surjan nuevas necesidades del ecosistema o ideas de producto durante la auditoría continua.
