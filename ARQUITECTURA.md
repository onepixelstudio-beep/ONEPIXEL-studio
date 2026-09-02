# Arquitectura Oficial y Manifiesto de Diseño de OnePixel Studio (v1.0)

Este documento constituye la **Guía Arquitectónica y Filosofía de Diseño Permanente** de **OnePixel Studio**. Cualquier desarrollo futuro, refactorización o incorporación de características debe adherirse estrictamente a las reglas, principios y métricas de calidad aquí definidos.

### 📢 Estado de Estabilidad del Proyecto y Certificación de Fase
*   **Fase 1.1 (Internacionalización y Estabilidad)**: **OFICIALMENTE FINALIZADA, CERTIFICADA Y CONGELADA**. 
    *   **Verificación de Estabilidad**:
        *   `npm run lint`: **Pasad con éxito** (0 errores, 0 advertencias, tipado y calidad de código perfectos).
        *   `npm run test`: **Pasad con éxito** (82 de 82 tests pasados, 100% de cobertura funcional).
        *   `npm run build`: **Pasad con éxito** (compilación de producción completa sin advertencias).
    *   **Estado i18n**: El sistema i18n queda oficialmente cerrado y congelado como una invariante inmutable del proyecto. Cualquier nueva funcionalidad o texto visible futuro deberá implementarse a través de la función `translate` usando el diccionario definido en `src/i18n/types.ts`.
*   **Base Oficial de OnePixel Studio**: La arquitectura actual (React DOM, Canvas 2D de alto rendimiento, superposiciones SVG, máquina de estados inmutable y bus de eventos) queda ratificada como la **base oficial y estable** del proyecto. Cualquier desarrollo futuro deberá respetar estrictamente el manifiesto arquitectónico, la filosofía de pantalla única y la búsqueda del máximo rendimiento sin "tech-larping".

---

## 1. Filosofía Fundacional de OnePixel Studio

OnePixel Studio no es solo un editor de gráficos; es un instrumento de precisión para artistas de pixel art. Su diseño se rige por un principio de **"interfaz invisible"**, donde el lienzo es el protagonista absoluto y el software actúa como un facilitador silencioso.

### Principios Fundamentales:
1. **Profesional y Minimalista**: Se elimina cualquier elemento visual decorativo o redundante. No se permite el "tech-larping" (por ejemplo, consolas de comandos simuladas, logs decorativos o lecturas de telemetría interna innecesarias en los bordes de la pantalla).
2. **Rápido y Silencioso**: El editor debe responder instantáneamente a cada entrada táctil o de puntero. Las operaciones continuas (dibujo, paneo, zoom, transformaciones) deben ejecutarse a un objetivo estable de **60 FPS** o más.
3. **Intuitivo pero Potente**: Los flujos deben ser autodescubribles para un principiante (por ejemplo, arrastrar guías desde las reglas como en Photoshop), pero ofrecer un control de precisión determinista y matemático para el profesional.
4. **Arquitectura Modular y Desacoplada**: El sistema se estructura en capas de responsabilidad única (SRP). Ninguna funcionalidad debe tener dependencias cruzadas rígidas que impidan su eliminación o reemplazo modular.

---

## 2. Arquitectura de Alto Rendimiento por Capas

Para garantizar que el renderizado de la interfaz y el del lienzo de píxeles permanezcan completamente independientes, el editor se divide en tres niveles operativos:

```
┌────────────────────────────────────────────────────────┐
│                   Capa 3: Overlays SVG                 │
│  (Renders de Guías, Ajustes, Líneas de Snap, Pivotes)  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│            Capa 2: Canvas 2D Pixel-Perfect             │
│   (Renderizado del Lienzo, Píxeles de Capas y Frames)  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             Capa 1: Interfaz de Usuario DOM            │
│ (Paneles, Timeline, Configuración, Diálogos de Ajuste) │
└────────────────────────────────────────────────────────┘
```

*   **Capa 1: Interfaz de Usuario (React DOM)**: Se encarga de la botonera, los paneles flotantes laterales y los modales. Utiliza CSS Tailwind con variantes responsivas y temas semánticos rígidos.
*   **Capa 2: Lienzo Activo (Canvas 2D)**: El lienzo donde se dibuja el pixel art se renderiza exclusivamente mediante un contexto Canvas 2D optimizado. Su refresco se gestiona a través de buffers independientes para evitar re-renderizados del DOM.
*   **Capa 3: Capa de Superposición SVG (Overlays)**: Las líneas de snapping, guías infinitas, caja delimitadora de transformación libre y cursores de previsualización se renderizan mediante componentes SVG vectoriales de alta velocidad. Estos overlays flotan matemáticamente sobre el lienzo y se sincronizan mediante transformaciones CSS de hardware (`transform: translate3d`).

---

## 3. Sistema de Internacionalización (i18n) Profesional y Escalable

La internacionalización no es una capa superficial en OnePixel Studio; es una invariante estructural de la aplicación. **Está estrictamente prohibido introducir texto codificado directamente (hardcoded strings) en cualquier componente React.**

### Estructura de Traducción Modular:
El sistema organiza los locales de manera jerárquica para permitir el soporte de cientos de claves sin comprometer el autocompletado y el análisis estático de tipos.

*   `src/i18n/types.ts`: Define el esquema maestro (`TranslationSchema`) tipado de forma estricta.
*   `src/i18n/es.ts` (Principal): Idioma por defecto.
*   `src/i18n/en.ts` / `src/i18n/pt.ts`: Traducciones oficiales que deben completarse al unísono con cada nueva funcionalidad.
*   `src/i18n/index.ts`: Exporta el motor de traducción dinámico `translate(key, lang)` con fallback automático y determinista a español ante claves faltantes.

### Sección de Claves de Traducción Obligatorias:
Las claves se agrupan en las siguientes categorías semánticas:
1.  `common.*`: Acciones globales comunes (guardar, cancelar, éxito).
2.  `editor.*`: Controladores principales del área de trabajo.
3.  `canvas.*`: Dimensiones del lienzo, escalas e indicadores de coordenadas.
4.  `layers.*`: Gestión de capas, opacidad, visibilidad y nombres por defecto.
5.  `timeline.*`: Controles de reproducción, FPS, añadir/duplicar frames.
6.  `preferences.*`: Ajustes del sistema (gestos, tamaño de UI, idioma, auto-save).
7.  `menu.*`: Barra de menú superior (Archivo, Edición, Capa, Ver, Ayuda).
8.  `tools.*`: Nombres y tooltips de las herramientas (Pencil, Eraser, Shapes, Fill, etc.).
9.  `selection.*`: Estado de selección activa, lazo, rectángulo y máscaras.
10. `transform.*`: Rotación, escalado, giros H/V y transformaciones libres.
11. `guides.*`: Gestión de guías infinitas, bloqueo, visibilidad y snapping.
12. `history.*`: Acciones de deshacer/rehacer y nombres de comandos en la pila.
13. `export.*` / `import.*`: Formatos de exportación (GIF, APNG, Sprite Sheet) y lectura de archivos.
14. `dialogs.*`: Diálogos modales y alertas del sistema.
15. `notifications.*`: Toasts de éxito, advertencias y avisos de error.

### Reglas de Diseño de i18n para Interfaces Flexibles:
*   **Adaptabilidad de Longitud**: El diseño visual de botones, pestañas y menús debe contemplar una tolerancia del **+40% de longitud de texto** para evitar desbordamientos visuales o recortes de palabras cuando se cambia entre Español, Inglés y Portugués.
*   **Uso del Hook/Función**: Se debe usar `translate(key, lang)` inyectando dinámicamente el idioma actual guardado en las preferencias del usuario (`preferences.language`).

---

## 4. Guía de Interacción UX y el Design System Silencioso

El espacio de trabajo visual debe proyectar serenidad para que el artista se concentre en el color y la forma.

### Paleta de Colores Semántica (Design System):
*   **Fondo del Área de Trabajo (Canvas Viewport)**: Color neutro profundo (`#070814`) que maximiza el contraste con cualquier pixel art.
*   **Paneles y Tarjetas**: Tonos gris pizarra oscuro con bordes sutiles semi-transparentes (`border-[#2e304f]/40`) para una delimitación limpia sin ruido.
*   **Acentos y Enfoque**: Pinceladas selectivas de color (Violeta `#7c3aed` para foco primario, Celeste `#38bdf8` para guías/snapping).
*   **Modo de Alto Contraste**: Cuando está activo, se sustituyen los degradados y bordes difusos por bordes de un píxel sólido (`#ffffff` o `#000000`) para separar los límites del panel con nitidez.

### Comportamiento del Cursor y Snapping Estables:
*   **Sin Vibración ni Saltos**: El motor de snapping (`SnapEngine`) debe resolver las coordenadas de manera matemática y determinista. Si hay dos puntos candidatos a snapping en el mismo umbral de tolerancia, el cursor no debe vibrar entre ellos; debe respetar la prioridad lógica preestablecida o aplicar un amortiguamiento dinámico.
*   **Efecto Imán Natural (Hysteresis)**: El cursor físico del mouse se mueve libremente por la pantalla, mientras que el "cursor de dibujo" se ajusta magnéticamente a los puntos de snapping de forma suave, mostrando un indicador visual sutil (una línea guía celeste fina) que desaparece de inmediato al dejar de arrastrar.

---

## 5. Rúbricas de Auditoría Multidimensional Obligatorias

A partir de este hito, cada revisión, auditoría o reporte técnico de OnePixel Studio debe incluir obligatoriamente las siguientes evaluaciones cuantitativas y cualitativas en español:

### 1. Simplicidad e Integridad de Pantalla Única (Single-screen Constraint)
*   **Regla**: Para herramientas y utilidades simples, la interfaz debe operar en una única vista unificada sin menús laterales invasivos, pestañas secundarias redundantes o ruidos visuales que dividan la atención.
*   **Pregunta de Control**: ¿Se puede realizar la tarea completa con elegancia visual en una sola pantalla sin romper el flujo del artista?

### 2. Cumplimiento de la Filosofía OnePixel Studio
*   **Regla**: Cero adornos ficticios o telemetría falsa. Cada píxel en pantalla debe ganarse su derecho a existir sirviendo a un propósito de dibujo activo.

### 3. Coherencia con el Design System
*   **Regla**: Los colores, tipografías (Inter para la UI, Space Grotesk para títulos, JetBrains Mono para datos y coordenadas) y transiciones deben pertenecer al lenguaje visual unificado de OnePixel Studio.

### 4. Accesibilidad (a11y)
*   **Regla**:
    *   Soporte nativo para filtros de daltonismo (Protanopia, Deuteranopia, Tritanopia) que ajustan dinámicamente el Canvas y las muestras de color.
    *   Modo de Alto Contraste configurable.
    *   Tamaños de interfaz adaptables (`sm`, `md`, `lg`, `xl`).
    *   Objetivos de contacto táctil (touch targets) de al menos **44px** en botones principales de herramientas y controles cuando el modo "Botones Grandes" está activo.

### 5. Rendimiento Percibido y Consumo de Recursos
*   **Regla**:
    *   Separación absoluta de renderizados (los movimientos de guías e indicadores de snapping no deben forzar re-dibujados en el lienzo de píxeles).
    *   Zero-allocation durante movimientos repetitivos: se prohíbe la creación excesiva de objetos de corta duración en el bucle de eventos del mouse para mitigar la presión sobre el Garbage Collector.

### 6. Escalabilidad de la Experiencia de Usuario (UX)
*   **Regla**:
    *   *Flujo de Principiantes*: Descubrimiento intuitivo y natural sin manuales de uso (por ejemplo, cursores dinámicos que cambian a flechas direccionales al pasar sobre reglas o guías para indicar arrastre).
    *   *Flujo de Profesionales*: Comandos rápidos de teclado de nivel industrial, bloqueo rápido de guías y retroalimentación táctil de alta precisión.

### 7. Robustez de la Internacionalización (i18n)
*   **Regla**: Evaluación exhaustiva de desbordamientos visuales, consistencia sintáctica de las etiquetas en los tres idiomas soportados (ES, EN, PT) y capacidad de extender el diccionario sin tocar el código fuente de los componentes.

---

## 6. Proceso de Aceptación Secuencial de Nuevas Funcionalidades

Para evitar la deuda técnica y asegurar que el código permanezca pulido, desacoplado y libre de regresiones, se establece el siguiente protocolo secuencial para proponer o implementar cualquier cambio:

1.  **Fase de Auditoría Inicial**: Realizar un análisis exhaustivo del requerimiento frente a las reglas de este manifiesto de arquitectura.
2.  **Presentación del Inventario**: Listar los archivos y componentes que se verán afectados por el cambio.
3.  **Clasificación de Archivos**: Clasificar claramente qué archivos se modificarán (`edit_file`) y cuáles se crearán nuevos (`create_file`).
4.  **Análisis de Ventajas y Riesgos**: Explicar los beneficios técnicos y visuales de la solución propuesta y los posibles riesgos en el rendimiento o regresiones de experiencia de usuario.
5.  **Aprobación Formal del Usuario**: **Detener la ejecución y esperar la confirmación explícita del usuario** antes de modificar una sola línea de código en los archivos existentes del proyecto.

Este flujo disciplinado garantiza que OnePixel Studio mantenga su nivel de calidad excepcional y conserve su naturaleza ágil, robusta y elegante a medida que se escala hacia la versión 1.0.
