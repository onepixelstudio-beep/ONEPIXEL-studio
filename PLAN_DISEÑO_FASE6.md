# 🎨 PLAN DE DISEÑO Y PLANIFICACIÓN TÉCNICA (AMPLIADO) - FASE 6
## OnePixel Studio - Sistema de Gestión de Color y Paletas Profesional

Este documento técnico establece la planificación arquitectónica, de experiencia de usuario, rendimiento, gestión de memoria, accesibilidad y control de calidad para la **Fase 6: Estabilización de Gestión de Color y Paletas** en OnePixel Studio, bajo los estrictos estándares del Protocolo de Evolución Basada en Evidencia (EBA).

---

## 1. Alcance Funcional (Functional Scope)

La Fase 6 tiene como objetivo dotar a OnePixel Studio de un sistema de color de grado profesional que satisfaga las necesidades de artistas digitales de pixel art, garantizando robustez matemática, flexibilidad de formatos de archivo y accesibilidad visual de alto rendimiento.

### Dentro de Alcance (In-Scope)
1. **Panel de Color Avanzado**:
   * Soporte numérico interactivo para formatos **HEX**, **RGB**, **HSV**, **HSL** y **Alpha** (Opacidad).
   * Sistema de sincronización bidireccional inmediata entre selectores visuales (Selector SV, Barra Hue) e inputs numéricos.
   * Atajos rápidos de teclado:
     * `X`: Intercambiar colores de Primer Plano (Foreground) y Segundo Plano (Background).
     * `D`: Resetear colores a por defecto (Negro #000000 de Primer Plano / Blanco #ffffff de Segundo Plano).
2. **Gestión de Paletas (Muestras / Swatches)**:
   * Cargar paletas predefinidas de la industria: *Fantasy PICO-8*, *GameBoy Retro*, *Cyberpunk 2077*, *Vaporwave*, *DB16*, *Material Design 3*.
   * Crear, editar y eliminar paletas personalizadas del usuario, persistidas de manera automática en el `localStorage` del navegador y sincronizadas con el perfil en la nube de Firebase si el usuario está autenticado.
   * Guardar el historial de colores recientes como una nueva paleta personalizada.
3. **Importación y Exportación de Paletas de Alta Compatibilidad**:
   * Integración nativa con `paletteParser.ts` para leer y procesar arrastre de archivos (Drag-and-Drop) o selección manual en formatos:
     * **GPL** (GIMP Palette)
     * **HEX** (Archivo plano de texto con códigos hexadecimales por línea)
     * **JSON** (Estructura de arrays de colores)
     * **ACT** / **ACO** / **ASE** (Formatos binarios propietarios de Adobe)
     * **PAL** (Formatos RIFF/JASC)
   * Exportación de paletas personalizadas a archivos descargables en formato `.gpl` (GIMP) y `.hex` (Plain text).
4. **Simulación Nativa de Daltonismo (Color Blindness)**:
   * Habilitar filtros de simulación visual en tiempo real en la vista de lienzo para los tipos principales de daltonismo:
     * **Protanopia** (Insensibilidad al color rojo)
     * **Deuteranopia** (Insensibilidad al color verde)
     * **Tritanopia** (Insensibilidad al color azul)
   * Integración fluida en las preferencias de accesibilidad globales y panel de color.

### Fuera de Alcance (Out-of-Scope)
* **Generación de paletas basada en Inteligencia Artificial**: No se utilizará la API de Gemini para autogenerar combinaciones, manteniendo la lógica determinista y local del artista (respetando los límites funcionales y el principio de no sobrediseñar).
* **Edición colaborativa de paletas en tiempo real**: Los cambios se guardan localmente o en la sesión del usuario individual.
* **Sincronización con APIs de terceros de paletas de color (por ejemplo, Lospec)**: La importación se realiza estrictamente por archivos locales.

---

## 2. Arquitectura Propuesta (Proposed Architecture)

El sistema de color se estructura sobre la arquitectura existente, acoplándose limpiamente sin violar ningún Guardrail de subsistemas.

```
+------------------------------------------------------------+
|                       UI Layer                             |
|  [CanvasArea.tsx]     [ColorPanel.tsx]     [Preferences]   |
+-------+---------------------+--------------------+---------+
        |                     |                    |
        | (Aplica filtro      | (Lectura/Escritura | (Activa filtro
        |  visual SVG)        |  de colores)       |  accesibilidad)
        v                     v                    v
+------------------+  +------------------+  +----------------+
|  Canvas Wrapper  |  |   Color State    |  |  i18n System   |
|   (CSS Filter)   |  |   & History      |  | (Traducciones) |
+------------------+  +--------+---------+  +----------------+
                               |
                               | (Carga/Guarda)
                               v
                      +------------------+
                      |  paletteParser   |
                      |   (GPL/ACT/ACO)  |
                      +--------+---------+
                               |
                               | (Persistencia)
                               v
                      +------------------+
                      |   localStorage   |
                      |  / Cloud Storage |
                      +------------------+
```

### Componentes y Responsabilidades

1. **`ColorPanel.tsx` (Panel de Control de Color)**:
   * **Responsabilidad**: Visualización e interacción directa. Expone el selector de gradiente S-V, el deslizador de tono (Hue) y el de opacidad. Permite alternar entre pestañas numéricas (HEX/RGB/HSL/HSV).
   * **Puntos de Integración**: Se alimenta del estado de color primario/secundario en `App.tsx` y notifica cambios a través de los callbacks correspondientes.
2. **`paletteParser.ts` (Procesador de Formatos)**:
   * **Responsabilidad**: Parsea flujos de texto o binarios de archivos importados. Módulo puramente funcional, sin efectos secundarios, 100% testeable en aislamiento.
   * **Puntos de Integración**: Invocado al cargar un archivo mediante el input de importación o el área de Drag-and-Drop de paletas.
3. **`CanvasArea.tsx` (Lienzo de Dibujo)**:
   * **Responsabilidad**: Aplica el filtro de accesibilidad visual de daltonismo. En lugar de procesar por CPU la matriz de píxeles cada vez que se diseña/renderiza, aplica filtros visuales CSS SVG de aceleración de hardware directamente sobre la presentación del canvas.
4. **`App.tsx` (Gestor de Estado Central)**:
   * **Responsabilidad**: Mantiene el color primario (`currentColor`), el color secundario, la opacidad del pincel, la lista de paletas importadas, la paleta activa y el filtro de daltonismo configurado en las preferencias del usuario.

### 📐 2.1 Modelo de Datos Canónico de las Paletas
Para garantizar la compatibilidad futura y una integración desacoplada de formatos externos, OnePixel Studio define un modelo de datos interno canónico. Todos los parsers externos deben normalizar la entrada a este tipo estricto:

```typescript
export interface CanonicalPalette {
  id: string;             // Identificador único (UUID o string generado de forma segura)
  name: string;           // Nombre amigable para el artista de la paleta
  colors: string[];       // Array de colores en formato HEX de 7 caracteres en minúsculas (ej: ["#000000", "#ffffff"])
  version: number;        // Versión del esquema del modelo de datos para control de migración (Inicial: 1)
  isCustom: boolean;      // Indica si es una paleta creada/modificada por el usuario o de sistema
  description?: string;   // Metadatos adicionales descriptivos opcionales
}
```

#### Reglas de Compatibilidad Futura:
* Si se añaden campos en futuras versiones (por ejemplo, `tags`, `creator`), se resolverán con valores por defecto razonables durante el proceso de parseado.
* Todos los colores deben convertirse a formato hexadecimal estándar de 7 caracteres (`#RRGGBB`) en minúsculas antes de ser inyectados al editor para simplificar las comparaciones por igualdad simple en el motor.

### 🛡️ 2.2 Separación entre Color de Trabajo y Color de Visualización (Contrato Arquitectónico)
Para evitar que las simulaciones visuales corrompan los datos reales del pixel art, establecemos el siguiente contrato arquitectónico permanente:
1. **Color de Trabajo**: `currentColor`, `secondaryColor` y la matriz de píxeles reales (`ProjectPixels`) contienen de forma inalterada los colores originales del lienzo seleccionados y pintados por el artista.
2. **Color de Visualización**: Los filtros de daltonismo (Protanopia, Deuteranopia, Tritanopia) actúan **exclusivamente** mediante transformaciones CSS SVG sobre la capa visual de visualización (la etiqueta `<canvas>` o su wrapper de renderizado en `CanvasArea.tsx`).
3. **Exportación Inalterada**: El motor de exportación (GIF, PNG, Spritesheet) utiliza directamente la matriz de píxeles original, garantizando que el archivo exportado preserve los colores reales exactos del proyecto de manera idéntica, independientemente de qué simulación de daltonismo tenga activa el artista en pantalla.

### 🔌 2.3 Compatibilidad con Futuras Herramientas (Gradients, Indexación, Cuantización)
El modelo de datos y la gestión del color están preparados de forma desacoplada para admitir extensiones directas de herramientas avanzadas de color sin refactorizar el núcleo:
* **Indexación y Cuantización**: Las paletas canónicas exponen un array secuencial indexado. Se pueden asociar los píxeles a índices enteros de la paleta activa (por ejemplo, para limitación estricta de color) mapeando directamente mediante sus posiciones en `colors`.
* **Reemplazo de Color Global**: Al usar strings HEX normalizados en minúsculas en toda la aplicación, reemplazar un color por otro en todo el lienzo se reduce a un barrido lineal exacto sobre el estado del pixel art, eliminando costes adicionales de conversión.
* **Gradientes**: Las funciones puras de interpolación (RGB, HSL, LCh) operarán directamente sobre el modelo de datos canónico.

---

## 3. Experiencia de Usuario (UX)

La productividad del artista es la máxima prioridad en el diseño del flujo de trabajo de color.

### Interfaz y Distribución de Elementos (Wireframe Conceptual)
* **Zona Superior (Selectores Rápidos)**:
  * Selectores compactos para intercambiar de forma transparente entre Color Primario (Pincel) y Secundario (Borrador/Alternativo).
  * Menú desplegable para alternar de forma inmediata entre paletas predefinidas, importadas o personalizadas.
* **Zona Central (Selector Visual)**:
  * Cuadro de Saturation-Value (S-V) de 144px con un indicador flotante de alta visibilidad.
  * Barra vertical de Hue de amplio grosor (fácil de cliquear y arrastrar).
* **Zona Numérica (Formatos Dinámicos)**:
  * Un control de pestañas elegante para seleccionar el formato de entrada activa (HEX, RGB, HSL, HSV, Opacity). Esto evita abrumar con decenas de cajas de texto simultáneas y se enfoca en el formato con el que el artista prefiere trabajar en ese momento.
* **Zona Inferior (Swatches Grid & Historial)**:
  * Una cuadrícula compacta pero de blancos táctiles generosos para las muestras de la paleta seleccionada.
  * Fila de historial de colores recientes con capacidad de auto-guardado rápido.

### Comportamiento en Escritorio (Desktop UX)
* **Atajos de teclado instantáneos**: `X` y `D` funcionan globalmente cuando no hay un input de texto enfocado.
* **Arrastrar y Soltar**: El Panel de Color reacciona visualmente cuando un archivo de paleta compatible se arrastra sobre él, mostrando un borde punteado de color violeta.
* **Eyedropper Integrado**: Integración nativa con la herramienta de gotero del lienzo y la API nativa `EyeDropper` del navegador donde esté disponible.

### Comportamiento en Dispositivos Táctiles (Mobile/Touch UX)
* **Tamaño mínimo de toque**: Los swatches y botones de acción rápida se escalan a un mínimo de 44px de área de impacto visual en configuraciones táctiles o pantallas pequeñas (respetando las preferencias de accesibilidad introducidas en la Fase Extraordinaria).
* **Deslizamiento libre**: Los inputs táctiles sobre el selector S-V y la barra de tono desactivan temporalmente la acción de scroll de la página para evitar tirones en móviles.

### ♿ 3.1 Accesibilidad Web (Estándares WCAG 2.1)
* **Navegación completa por teclado**: Se puede tabular secuencialmente a través de los swatches de la paleta, los selectores de color primario/secundario y los deslizadores numéricos.
* **Indicadores visuales de foco**: Todos los elementos interactivos del panel de color muestran un borde de contraste alto (`focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none`) al recibir foco del teclado.
* **Lectores de pantalla**: Cada muestra de color y botón de acción rápida cuenta con etiquetas descriptivas mediante `aria-label` (por ejemplo, `aria-label="Color Rojo Hexagonal #ff0000"`, `aria-label="Intercambiar colores principal y secundario (Atajo X)"`).
* **Contraste de color**: Todos los textos descriptivos, inputs numéricos y bordes interactivos cumplen con un contraste mínimo de **4.5:1** contra el fondo slate oscuro `#141525` de OnePixel Studio.

---

## 4. Rendimiento y Gestión de Memoria (Performance & Memory)

### Cuellos de Botella Potenciales y Estrategias de Mitigación

1. **Re-renderizado Masivo de Swatches (Cuadrícula de Colores)**:
   * *Riesgo*: Al arrastrar el ratón en el selector visual S-V para cambiar el color actual, se actualiza el estado de `currentColor` de forma continua (60 veces por segundo). Si la cuadrícula completa de 256 swatches de color de una paleta se re-renderiza con cada movimiento del ratón, se generará jank y caídas de frames en el renderizado principal.
   * *Estrategia*:
     * Envolver el componente de swatch individual o la cuadrícula en un componente memoizado (`React.memo`) que solo re-renderice si la paleta de colores activa cambia o si la referencia del color actual seleccionado coincide con la muestra para iluminar el contorno activo.
     * Separar el renderizado visual de la paleta de la actualización de sliders mediante un estado de transición optimizado.

2. **Simulación de Daltonismo en Tiempo Real**:
   * *Riesgo*: Realizar transformaciones RGB en CPU por cada píxel del lienzo cada vez que se actualiza el canvas generaría un cuello de botella letal de renderizado.
   * *Estrategia*: Usar filtros SVG matriciales nativos vía CSS en la capa del viewport del lienzo.
     * Ejemplo de matriz SVG Protanopia:
       ```xml
       <svg style="display:none">
         <filter id="protanopia">
           <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
         </filter>
       </svg>
       ```
     * Aplicar `filter: url(#protanopia)` mediante CSS en el wrapper del Canvas. Esto procesa el color en la GPU, reduciendo el coste computacional a exactamente **0% de uso de CPU** durante el dibujo activo y la reproducción de animaciones.

### 🧹 4.1 Gestión Rigurosa de Recursos de Memoria (No GC-dependent)
Para prevenir fugas de memoria en sesiones de dibujo prolongadas, implementamos las siguientes estrategias de liberación explícita de recursos:
1. **ObjectURLs**: El exportador de paletas `.gpl` o `.hex` liberará inmediatamente el Object URL generado mediante `URL.revokeObjectURL` tras iniciar el proceso de descarga del usuario.
2. **FileReaders**: Al importar paletas, las instancias de `FileReader` tendrán sus referencias internas de callback (`onload`, `onerror`, `onloadend`) explícitamente establecidas a `null` una vez finalizado el parsing para evitar que las clausuras de React retengan contextos del DOM en memoria.
3. **Escuchas de Eventos (Event Listeners)**: Todos los atajos de teclado globales y manejadores de eventos Drag-and-Drop en el contenedor del panel se desvincularán de forma limpia utilizando hooks de limpieza de React (`useEffect` return callbacks).
4. **Caché del Panel**: Si el componente `ColorPanel` es desmontado, se limpiarán los buffers temporales locales de previsualización del color actual.

---

## 5. Internacionalización (i18n)

Se garantiza que todo nuevo texto, etiqueta o descripción técnica se extraiga al sistema de traducción de OnePixel Studio. No se permite texto hardcodeado en la interfaz.

### Nuevas Claves de Traducción Requeridas (Estructura JSON)

```typescript
// En es.ts
colors: {
  title: 'Paletas de Color',
  paletteCustom: 'Paleta Personalizada',
  paletteEarthNeutrals: 'Neutros Terrosos',
  paletteChicNeutrals: 'Neutros Chique',
  paletteOrganicNeutrals: 'Neutros Orgánicos',
  paletteElegantNeutral: 'Neutra Elegante',
  paletteNeutralGalaxy: 'Galaxia Neutros',
  paletteAutumnNeutral: 'Neutra Otoñal',
  paletteMaterial3: 'Material Design 3',
  paletteCheerfulSun: 'Alegre Sol',
  paletteCheerfulCircus: 'Circo Alegre',
  paletteJoyfulSpace: 'Espacio Alegría',
  paletteResprite: 'Resprite Classic',
  palettePico8: 'Fantasy PICO-8',
  paletteGameboy: 'GameBoy Retro',
  paletteCyberpunk: 'Cyberpunk 2077',
  newPalette: 'Nueva paleta',
  newPaletteTooltip: 'Crea una paleta vacía para agregar tus colores',
  save: 'Guardar',
  saveTooltip: 'Guarda esta paleta en el almacenamiento local',
  import: 'Importar',
  importTooltip: 'Carga archivos de paletas .gpl, .hex, .pal o binarios',
  colorSquare: 'Selector de Color',
  brightnessLabel: 'Brillo',
  brushOpacityLabel: 'Opacidad del Pincel',
  colorOptions: 'Opciones de Formato',
  historyTitle: 'Colores Recientes',
  clearHistory: 'Limpiar Historial',
  saveHistoryAsPalette: 'Guardar recientes como paleta',
  removeFromPalette: 'Eliminar de la paleta',
  addToPalette: 'Añadir a la paleta'
}
```

---

## 6. Definition of Done (DoD) Ampliado - Fase 6

Para certificar y congelar formalmente la Fase 6, se deben superar los siguientes criterios objetivos comprobables con evidencia:

1. **Compilación y Linteo**:
   * `npm run lint` finaliza con código de salida `0` y sin advertencias.
   * `npm run build` compila con éxito produciendo los bundles estáticos en `dist/`.
2. **Pruebas Automatizadas (Unit Tests)**:
   * Al menos un conjunto de pruebas unitarias robusto para verificar la importación y parsing de archivos, asegurando estabilidad y asilamiento ante:
     * **Archivos válidos**: Archivos `.gpl` e `.hex` formateados correctamente.
     * **Archivos corruptos**: Archivos con valores de color incorrectos o cadenas malformadas. El parser debe capturar el error sin abortar la ejecución del editor.
     * **Archivos vacíos**: Retorna un error semántico controlado o una paleta vacía, nunca excepciones de puntero nulo.
     * **Archivos extremadamente grandes**: Un archivo de más de 5MB con miles de líneas de colores. El parser debe abortar limpiamente por límite de seguridad sin congelar el hilo principal del editor.
     * **Formatos parcialmente compatibles**: Formatos que contienen metadatos incorrectos pero colores descifrables. Se deben extraer los colores recuperables.
   * `npx vitest run` se completa con el 100% de las pruebas aprobadas.
3. **Validación Funcional (Evidencia Manual)**:
   * Confirmación del correcto funcionamiento de atajos de teclado (`X`, `D`) sin fugas de foco.
   * Carga fluida de paletas predefinidas.
   * Persistencia verificada: al refrescar el editor, las paletas cargadas y modificadas por el usuario se mantienen intactas (`localStorage`).
   * Aplicación correcta de los filtros de daltonismo Protanopia, Deuteranopia y Tritanopia sobre el canvas sin afectar las herramientas de dibujo.
4. **Control de Regresiones**:
   * El sistema de historial (Undo/Redo) no se ve afectado al interactuar con el panel de color.
   * El exportador de frames (GIF, Spritesheet) funciona correctamente ignorando los filtros visuales de daltonismo (el daltonismo es solo una simulación de edición, la imagen exportada debe conservar sus colores originales).

---

## 7. Riesgos Técnicos y Mitigación

| Riesgo Técnico | Probabilidad | Impacto | Estrategia de Mitigación |
| :--- | :---: | :---: | :--- |
| **Pérdida de rendimiento en canvas con simulación de daltonismo activa** | Baja | Alto | Uso estricto de filtros CSS SVG con aceleración por hardware (GPU). No realizar operaciones de mapeo de píxeles en CPU. |
| **Archivos de paleta `.gpl` o `.hex` malformados que tiren el sistema** | Media | Alto | Envolver toda lógica de parsing en bloques `try/catch`, aplicar expresiones regulares estrictas y validar rangos RGB (0-255) antes de inyectar colores en el estado. |
| **Límite de cuota o espacio en localStorage para paletas del usuario** | Baja | Medio | Las paletas se guardan de forma muy compacta (arrays de strings de 7 caracteres). Se establecerá una validación de tamaño máximo (ej. límite de 20 paletas personalizadas) antes de guardar para evitar excepciones de cupo de almacenamiento. |
| **Conflictos de atajos de teclado con inputs activos** | Media | Medio | Validar en los event listeners globales que `document.activeElement` no sea un elemento `input`, `textarea` o `select` antes de procesar `X` o `D`. |

---

## 8. Plan de Implementación (Bloques Certificables)

La Fase 6 se subdivide en 4 bloques de desarrollo incrementales con validación intermedia. Cada bloque debe completar estrictamente el ciclo completo de validación antes de continuar:

**Ciclo de Bloque: Implementación → Integración → Pruebas Unitarias → Pruebas Funcionales → Auditoría Técnica → Certificación → Congelación.**

### Bloque 6.1: Core de Parsing, Tipos y Pruebas Unitarias Robustas
* **Tareas**:
  * Definición e implementación de la interfaz `CanonicalPalette`.
  * Desarrollar el parser robusto en `paletteParser.ts` con control de errores para archivos válidos, corruptos, vacíos, gigantes o parcialmente compatibles.
  * Añadir pruebas unitarias específicas en `paletteParser.test.ts` con cobertura del 100% para todos estos casos límite.
* **Hito de Validación**: Ejecución de tests exitosa (`npx vitest run`).

### Bloque 6.2: Interfaz del Panel de Color Avanzado e i18n
* **Tareas**:
  * Implementar el panel de color avanzado dinámico en `ColorPanel.tsx` con soporte para selectores RGB/HSL/HSV/Alpha dinámicos.
  * Añadir las claves de traducción en `es.ts`, `en.ts` y `pt.ts`.
  * Vincular atajos de teclado globales en `App.tsx` respetando las exclusiones en inputs activos.
* **Hito de Validación**: Linteo exitoso y pruebas funcionales de teclado validadas.

### Bloque 6.3: Gestión de Muestras (Swatches), Importación y Persistencia con Control de Versiones
* **Tareas**:
  * Habilitar listado de paletas personalizadas en el selector.
  * Implementar almacenamiento en `localStorage` con respaldo transparente y esquema de versionado de datos (`version: 1`).
  * Diseñar la interfaz Drag-and-Drop o selector de archivos de paletas en el Panel con limpieza explícita de `ObjectURLs` y `FileReader`.
* **Hito de Validación**: Importar una paleta `.gpl` personalizada, refrescar el navegador y verificar que la paleta sigue seleccionada y disponible en el panel.

### Bloque 6.4: Filtros de Simulación de Daltonismo de Alto Rendimiento
* **Tareas**:
  * Inyectar los filtros SVG de Protanopia, Deuteranopia y Tritanopia en el DOM.
  * Vincular la preferencia del usuario en el panel de color o el menú de configuración de accesibilidad.
  * Aplicar la regla de filtrado CSS condicional exclusivamente en el contenedor de visualización de `CanvasArea`.
* **Hito de Validación**: Alternar entre filtros en tiempo real y verificar que el color de exportación del GIF final no resulte alterado por la simulación activa.

---

## 9. Lecciones Aprendidas Aplicadas

Analizando las experiencias y éxitos de las fases 1 a 5, incorporamos las siguientes directrices operativas para la Fase 6:

1. **Evitar Cálculos Redundantes en React**: Al igual que en la optimización del Timeline de animación y los cachés de capas, evitaremos re-renderizados innecesarios del lienzo al arrastrar el ratón en el selector S-V. La separación limpia de responsabilidades del canvas y el panel impedirá caídas de rendimiento catastróficas.
2. **Isolación Total de Lógica Matemática**: Mantener los parsers de formatos y convertidores de color (`hexToRgb`, `rgbToHex`, etc.) como funciones puras y desacopladas de React permite una cobertura de pruebas unitarias cercana al 100% y un mantenimiento sin riesgos de regresión.
3. **Consistencia de la Suite de Pruebas**: No se comprometerá la estabilidad de las 122 pruebas existentes. Cada nueva prueba añadida complementará la suite garantizando la compatibilidad hacia atrás en los componentes core de OnePixel Studio.
4. **La Accesibilidad no es un Parche**: La incorporación de simuladores de daltonismo y selectores táctiles con dimensiones de hit-target adecuadas (44px) hereda y refuerza el estándar de diseño profesional y humano de OnePixel Studio.

---
*Fin del documento de planificación. OnePixel Studio se encuentra preparado arquitectónicamente para la evolución segura del sistema de color de la Fase 6.*
