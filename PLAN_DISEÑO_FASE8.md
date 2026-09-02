# 📦 PLAN DE DISEÑO Y PLANIFICACIÓN TÉCNICA - FASE 8
## OnePixel Studio - Estabilización de la Biblioteca de Recursos: Sellos, Patrones y Pinceles

Este documento técnico establece la planificación arquitectónica, de experiencia de usuario, rendimiento, gestión de almacenamiento y aseguramiento de la calidad para la **Fase 8: Estabilización de la Biblioteca de Recursos** en OnePixel Studio, de acuerdo con los estándares definidos por el Protocolo EBA (Evidence-Based Architecture).

---

## 1. Alcance Funcional (Functional Scope)

El objetivo central de la Fase 8 es dotar a OnePixel Studio de un módulo robusto, eficiente y ergonómico para la creación, persistencia y aplicación de recursos personalizados por el artista. El sistema permitirá capturar selecciones del lienzo como "sellos" (stamps) reutilizables, rellenar áreas dinámicamente con patrones texturizados y organizar estos recursos sin penalizar los tiempos de carga inicial de la aplicación.

### Dentro de Alcance (In-Scope)
1. **Captura de Selección de Píxeles como Sellos Personalizados**:
   * Permitir al usuario capturar el área activa de una selección (rectangular, elíptica o lasso) de forma directa desde la barra de opciones de selección.
   * Serializar los píxeles capturados (incluyendo su canal alfa/transparencias) asignándoles un nombre, etiquetas y marca de tiempo.
   * Integración de los nuevos sellos en la biblioteca local del usuario.

2. **Biblioteca Visual de Recursos (Stamps Tab en LibraryModal)**:
   * Rediseño y expansión del `LibraryModal` para albergar una pestaña dedicada a "Sellos" (Stamps), estructurada en una rejilla visual fluida con previsualizaciones pixel-art de alta fidelidad.
   * Herramientas de gestión de la biblioteca: renombrado, etiquetado dinámico (tagging), eliminación, duplicado y exportación de sellos específicos en formato JSON.
   * Importación de bibliotecas de sellos personalizadas en formato `.json` o `.pixelstamps`.

3. **Mecanismo de Aplicación Ergónomica y Transformación**:
   * Visualización del sello seleccionado sobre el cursor de forma semitransparente (overlay fantasma) a escala real para previsualizar de forma exacta dónde se estampará.
   * Soporte para transformaciones rápidas del sello activo desde el panel flotante interactivo (CanvasArea):
     * Escalado preciso sin desenfoque (Nearest-Neighbor) desde 1x hasta 8x.
     * Rotación en incrementos de 90°.
     * Volteo horizontal y vertical (Mirroring).
   * Integración del estampado con las herramientas de dibujo activo, respetando capas, modos de mezcla, simetrías de lienzo y selecciones de protección.

4. **Patrones Dinámicos de Relleno Personalizados**:
   * Capacidad de convertir cualquier sello de la biblioteca en un patrón repetitivo activo.
   * Integración en el sistema de bote de pintura (`bucket` tool) o mediante un comando especial de rellenar selección activa, creando un patrón de mosaico (tiling) continuo y alineado matemáticamente a la cuadrícula.

5. **Serialización Inteligente y Carga Perezosa (Lazy Loading)**:
   * Evitar la carga síncrona de datos pesados de píxeles (las matrices de color de decenas de sellos) durante el arranque crítico de la aplicación.
   * Implementación de un índice de recursos ligero (metadatos mínimos como ID, nombre, etiquetas) en `localStorage` para el renderizado inicial rápido, cargando de forma perezosa (lazy-load) la matriz de píxeles real únicamente cuando el usuario abre la biblioteca o activa un recurso específico.

---

## 2. Arquitectura Propuesta (Proposed Architecture)

El sistema de recursos de la biblioteca se desacopla del flujo crítico de dibujo mediante un gestor de caché local y la serialización optimizada de datos de píxeles.

```
+-------------------------------------------------------------------------+
|                              UI Layer                                   |
|   [LibraryModal]  <───> [Stamp Library Component] <───> [Preferences]   |
+--------+----------------------------+-----------------------------------+
         |                            |
         | (Acción de capturar)       | (Carga perezosa de datos)
         v                            v
+--------+----------------------------+-----------------------------------+
|  [SelectionState]                   |  [LocalStorage / Firebase]        |
|    - Captura píxeles en coordenadas |    - "onepixel_stamps_meta" (Fast)|
|    - Crea JSON de recurso           |    - "onepixel_stamps_data" (Lazy)|
+--------+----------------------------+-----------------------------------+
         |                                             ^
         v (Establece sello activo)                    | (Guarda / Lee)
+--------+----------------------------------------------+------------------+
|  [App.tsx] ───> activeStamp ───> [CanvasArea.tsx]                       |
|    - Escala, rota y voltea el buffer                                    |
|    - Dibuja el cursor fantasma pixelado en PointerMove                  |
|    - Estampa los píxeles de forma definitiva en el buffer del lienzo    |
+-------------------------------------------------------------------------+
```

### Componentes y Responsabilidades

1. **`ResourceLibraryManager` (`/src/utils/storage.ts` u homólogo)**:
   * **Responsabilidad**: Abstracción del almacenamiento. Maneja dos capas:
     * **Capa Ligera (Index)**: Mantiene en caché y `localStorage` los nombres, tags y miniaturas compactas de baja resolución de los sellos.
     * **Capa Pesada (Data)**: Carga en memoria la matriz completa de píxeles `string[]` bajo demanda (Lazy Loading) cuando se selecciona o edita un sello.
   * **Compresión**: Implementación opcional de compresión RLE (Run-Length Encoding) para reducir el consumo de la cuota máxima de LocalStorage (5MB), descartando píxeles transparentes continuos.

2. **Módulo de Transformación de Sellos (`/src/utils/transformUtils.ts` o similar)**:
   * **Responsabilidad**: Cálculo de transformaciones sin pérdida para píxeles:
     * `rotatePixels90(pixels, width, height): { pixels, width, height }`
     * `flipPixels(pixels, width, height, horizontal, vertical): string[]`
     * `scalePixels(pixels, width, height, scale): { pixels, width, height }`

3. **Interacciones en `CanvasArea.tsx`**:
   * **PointerMove**: Lee las coordenadas del cursor del ratón e invoca el dibujado de un lienzo temporal offscreen que representa el "stamp preview" semitransparente con opacidad al 50%.
   * **PointerDown**: Aplica la matriz transformada del sello sobre la capa activa a través del `CommandSystem` de OnePixel Studio para asegurar la compatibilidad con el sistema de Undo/Redo e Historial de acciones.

---

## 3. Objetivos del Definition of Done (DoD)

Para que la Fase 8 pueda darse por concluida y certificada bajo el protocolo EBA, debe satisfacer los siguientes criterios técnicos y de experiencia de usuario:

### Criterios Funcionales
* **Captura Perfecta**: El usuario puede guardar cualquier área seleccionada como sello. El sello capturado debe preservar exactamente los colores y transparencias de la zona seleccionada en la capa activa.
* **Organización Limpia**: Capacidad para crear carpetas, filtrar recursos por etiquetas, renombrar elementos y borrar sellos obsoletos.
* **Transformación Interactiva**: Los controles flotantes de escala, rotación de 90° en 90° y volteo de sellos deben modificar inmediatamente el comportamiento del cursor de estampado y el resultado final del dibujo.
* **Relleno de Patrones**: Al seleccionar un sello y elegir "Aplicar como patrón", la herramienta del bote de pintura debe pintar una cuadrícula perfecta repetida de dicho recurso.

### Criterios Técnicos
* **Carga Inicial Optimizada**: El tamaño del índice cargado al inicio de la aplicación para la biblioteca de recursos no debe superar los 20KB, independientemente del volumen total de sellos guardados. El contenido pesado se leerá solo cuando el modal o recurso se active.
* **Compresión / Evitación de Desbordamientos**: Prevenir errores de `QuotaExceededError` en `localStorage` al optimizar la representación de los píxeles (ej: codificación en cadena compacta en lugar de arrays de objetos verbosos).
* **Gestión de Memoria Libre**: No deben quedar rastros en memoria de buffers de canvas offscreen creados dinámicamente para las previsualizaciones de sellos tras cerrar los modales o deseleccionar el recurso.
* **Consistencia del Historial**: Cada acción de estampado en el lienzo debe registrarse como un único paso reversible en el historial de comandos deshacer/rehacer (`Undo/Redo`).

### Criterios de Calidad
* **Precisión Matemática**: Las rotaciones de 90°, 180° y 270° de rectángulos asimétricos deben recalcular correctamente el nuevo ancho y alto del buffer sin recortar píxeles ni provocar desplazamientos de coordenadas.
* **i18n Completa**: Traducciones de textos de menús, botones, notificaciones y ayuda contextual para las mecánicas de sellos y patrones en ES, EN y PT.
* **Cero Colisiones Visuales**: La barra de herramientas flotante de controles del sello activo debe posicionarse elegantemente en los márgenes inferiores del canvas sin obstruir los controles de la regla vertical o del timeline.

### Criterios de UX
* **Cursor Fantasma Fluido**: La previsualización transparente del sello debe deslizarse a 60 FPS bajo el cursor del artista sin latencia.
* **Previsualización en Rejilla**: Las tarjetas de la biblioteca deben mostrar el pixel-art original centrado con un fondo de tablero de ajedrez sutil que denote las zonas transparentes.

---

## 4. Riesgos Técnicos y Plan de Mitigación

| Riesgo Técnico Identificado | Impacto | Estrategia de Mitigación EBA |
| :--- | :---: | :--- |
| **Exceso de cuota en `localStorage` (Límite 5MB)** | Alto | Implementar codificación RLE (Run-Length Encoding) en la serialización de píxeles del sello. Para proyectos o sellos masivos, ofrecer la descarga directa del archivo `.json` de respaldo del usuario o sincronización silenciosa con la base de datos cloud Firebase Firestore si el usuario está autenticado. |
| **Micro-stuttering en el renderizado del cursor** | Alto | El cursor semitransparente se renderizará mediante una textura precargada en una memoria caché de imagen offscreen (`HTMLCanvasElement`). No se recalcula la rotación ni el escalado píxel a píxel en cada movimiento de ratón (`PointerMove`); la transformación ocurre solo al cambiar los controles de escala/rotación y se almacena en el caché de previsualización. |
| **Crecimiento de memoria por fugas de imágenes temporales** | Medio | Utilizar un único canvas offscreen estático reutilizable para las operaciones de visualización fantasma y destrucción/liberación explícita de referencias de variables temporales al deseleccionar el sello. |

---

## 5. Plan de Implementación por Bloques

El desarrollo de la Fase 8 se segmentará en 4 bloques de trabajo secuenciales:

### 📦 Bloque 8.1: Mecánica de Captura y Capturación de Selecciones como Sellos
* **Objetivo**: Desarrollar la lógica de captura del área delimitada por la selección del lienzo, serialización compacta y creación de la entidad de tipo `LibraryResource` con metadatos.
* **Entregables**:
  * Adición de botón "Guardar como Sello" en la barra de herramientas de selección de `OptionBar.tsx`.
  * Método extractor de píxeles del lienzo limitado a la bounding box de la selección activa.
  * Funciones de serialización y guardado automático en el gestor local.

### 📦 Bloque 8.2: Interfaz de la Biblioteca de Recursos (Stamps Tab) y Carga Perezosa
* **Objetivo**: Ampliar y perfeccionar el `LibraryModal` para añadir la visualización interactiva de la biblioteca de sellos guardados del usuario con optimización Lazy Loading.
* **Entregables**:
  * Maquetación de la pestaña "Sellos" en `LibraryModal.tsx` utilizando un grid de tarjetas elegante y minimalista.
  * Lógica de carga perezosa (`lazy loading`) para no deserializar los datos pesados de píxeles hasta que el usuario decida seleccionar un sello.
  * Funciones de renombrar, etiquetar, exportar a `.pixelstamps` (JSON estructurado) e importar bibliotecas completas.

### 📦 Bloque 8.3: Motores de Transformación Dinámica y Relleno de Patrones
* **Objetivo**: Desarrollar el panel flotante de control de sellos, aplicar escala, rotación matemática y volteos sin pérdida, e integrar el motor de patrones del bote de pintura.
* **Entregables**:
  * Funciones utilitarias robustas de transformación de matrices de píxeles en `/src/utils/transformUtils.ts`.
  * Panel interactivo flotante en `CanvasArea.tsx` con sliders e iconos de control para manipular la escala (1x-8x), rotación (0°-270°) y volteos (H/V) del sello seleccionado.
  * Lógica del cursor fantasma con aceleración de GPU en el renderizado del lienzo offscreen.
  * Modo mosaico (mecanismo de rellenado de patrones alineados a la rejilla usando el bote de pintura).

### 📦 Bloque 8.4: Estabilización de Memoria, Optimizaciones y Cierre de la Fase 8
* **Objetivo**: Auditar el consumo de memoria, implementar compresión RLE si es precisa, y estabilizar la suite completa de pruebas unitarias y de regresión del sistema.
* **Entregables**:
  * Pruebas unitarias para las utilidades de transformación de sellos y de empaquetado/lazy loading de almacenamiento.
  * Limpieza del linter y verificación de que la build de producción no sufra degradación de peso o dependencias duplicadas.
  * Certificación EBA mediante un reporte integrado de métricas de rendimiento estables.

---

## 6. Estrategia de Pruebas y Certificación

1. **Pruebas de Transformación Geométrica**:
   * Validar mediante tests automatizados que un sello con dimensiones no cuadradas (ej: 12x24) mantiene todas sus proporciones y píxeles al ser rotado 90° o invertido horizontalmente.
2. **Pruebas de Carga Inicial y Almacenamiento**:
   * Simular la inserción de 50 sellos de alta densidad en el `localStorage` y verificar que el tiempo de arranque de la aplicación (tiempo hasta interactividad) se mantiene por debajo de los 150ms debido a la carga perezosa.
3. **Pruebas de Regresión**:
   * Asegurar que el sistema de capas, marcos de animación, simetría del lienzo y selección sigan funcionando perfectamente sin verse alterados al estampar recursos.
4. **Validación de Compilación y Calidad**:
   * Compilar de producción de manera impecable (`npm run build`), pasar análisis estático (`npm run lint`), y validar el comportamiento reactivo en todas las resoluciones de pantalla soportadas.
