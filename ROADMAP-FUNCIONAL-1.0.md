# ONEPIXEL STUDIO — ROADMAP FUNCIONAL 1.0

**Estado del Sistema**: Fase de Consolidación Arquitectónica Completada  
**Prioridad Actual**: 90% Desarrollo Funcional / 10% Mantenimiento Arquitectónico  
**Contratos Arquitectónicos Congelados**:
- `ADR-RESILIENCE-001` (Arquitectura de Resiliencia)
- `ADR-SELECTION-001` (Sistema Central de Selección)
- `ADR-TRANSFORM-001` (Sistema Central de Transformaciones)

---

## 1. Funcionalidades Completamente Terminadas

### 🎨 Motor de Dibujo y Edición Pixel Art
- **Pincel (Pen) y Borrador (Eraser)**: Trazado pixel-perfect con soporte para múltiples tamaños, patrones de forma, dithering integrado y sensibilidad de presión digital.
- **Herramientas de Formas**: Líneas, Rectángulos, Elipses y Curvas de Bézier con algoritmo Bresenham y previsualización en tiempo real.
- **Relleno de Color (Bucket)**: Algoritmo de inundación (Flood Fill) acelerado por buffer 1D con tolerancia configurable.
- **Cuentagotas (Picker)**: Muestreo de color desde el lienzo compuesto o la capa activa.
- **Herramientas de Espray y Dithering**: Dibujo con dispersión estocástica y patrones de entramado predefinidos.
- **Simetría y Espejo**: Simetría en Eje X, Eje Y y Radial (4/8 vías) en tiempo real con centro de simetría posicionable.
- **Modo Tiling (Lienzo Infinito)**: Repetición continua en X/Y para creación de texturas con costura perfecta.

### 🎯 Subsistema de Selección (`SelectionEngine`)
- **Herramientas de Selección**: Marco Rectangular, Marco Elíptico, Lazo Manual y Varita Mágica (`wand`).
- **Modos de Operación de Selección**: Nueva Selección, Añadir (Unión), Restar (Diferencia) e Intersección.
- **Selección Móvil y Desplazamiento**: Movimiento de píxeles seleccionados mediante `MoveSelectionTool` con renderizado de hormigas marchantes (*marching ants*).
- **Manejo de Máscaras Bitwise**: Operaciones lógicas puras sobre arrays 1D con rendimiento sub-milisegundo.

### 🔄 Subsistema de Transformación (`TransformEngine`)
- **Transformación Libre 2D**: Traslación, Escalado proporcional e independiente, Rotación continua, Flip Horizontal/Vertical y Pivote dinámico.
- **Muestreo Interpolado**: Nearest-Neighbor optimizado con conservación estricta de bordes en matriz de píxeles (`SamplingEngine`).
- **Controles e Interfaz Overlays**: Asideros (*handles*) de esquina, borde y rotación con representación homogénea (`TransformMatrix`).

### 🎬 Sistema de Animación y Capas
- **Gestor de Capas**: Creación, duplicación, reordenamiento, visibilidad, bloqueo, opacidad (0-100%) y modos de fusión (*blend modes*: Normal, Multiply, Screen, Overlay, Darken, Lighten).
- **Línea de Tiempo (Timeline)**: Gestión de fotogramas (Frames), ordenación por drag-and-drop, selección múltiple de fotogramas, tags de color, clips de animación y control de FPS (1-60 FPS).
- **Piel de Cebolla (Onion Skinning)**: Previsualización de fotogramas anteriores/posteriores con tintado de color personalizable (rojo/verde) y opacidad configurable.
- **Controlador de Reproducción**: Modos Loop, Once, Ping-Pong y velocidad variable (0.5x, 1x, 2x).

### 📦 Biblioteca de Recursos y Patrones
- **Gestor de Stamping y Cuadros**: Captura de sellos (*stamps*), patrones de textura reutilizables y pinceles personalizados.
- **Integración Firestore/Nube**: Sincronización remota de paletas y recursos para usuarios autenticados.
- **Sistemas de Importación/Exportación**:
  - Exportación PNG (individual y hojas de sprites horizontal/vertical/grid).
  - Generación de GIF animado y APNG con codificadores binarios dedicados.
  - Exportación Sprite Atlas con metadatos JSON/XML.
  - Importador Aseprite (`aseReader.ts`) y proyectos comprimidos ZIP/JSON.

### 🛡️ Infraestructura de Resiliencia y Preferencias
- **Deshacer/Rehacer (Undo/Redo)**: Historial inmutable basado en comandos con atajos globales (Ctrl+Z / Ctrl+Y).
- **Internacionalización (i18n)**: Soporte completo de UI en Español, Inglés y Portugués.
- **Panel de QA y Diagnósticos**: Generador de reportes de salud arquitectónica, monitor de memoria y simulación de carga.

---

## 2. Funcionalidades Parcialmente Implementadas

1. **Gestión de Imagen de Referencia en Lienzo**:
   - *Estado actual*: Es posible cargar una imagen de referencia, ajustar opacidad, escala, posición X/Y y ángulo.
   - *Falta*: Integrar el bloqueo espacial estricto con el sistema de guías y permitir transformación interactiva directa sobre el canvas mediante `TransformEngine` en lugar de controles numéricos en el menú superior.

2. **Sistema de Guías y Reglas**:
   - *Estado actual*: Muestreo visual de reglas horizontal/vertical e inserción de guías proyectables.
   - *Falta*: Ajuste magnético (*snapping*) refinado de herramientas de dibujo y selecciones hacia las guías activas.

3. **Modo Paleta Indexada Estricta**:
   - *Estado actual*: Paletas de colores predefinidas y personalizadas con selector HEX.
   - *Falta*: Restricción rígida de dibujo que impida usar colores fuera de la paleta activa (*Indexed Color Palette Lock*) y re-mapeo automático de colores al cambiar de paleta.

---

## 3. Funcionalidades Pendientes de Migrar a la Nueva Arquitectura

1. **Previsualización de Estampado de Patrones (`CanvasStamp`)**:
   - *Descripción*: El cálculo de colocación de sellos pre-capturados realiza un formateo de buffer previo.
   - *Migración*: Delegar toda la geometría de orientación del stamp directamente a `TransformMatrix` antes de aplicar al buffer final.

2. **Transformación de Capas Completas desde Menú Principal**:
   - *Descripción*: Las acciones de "Rotar Proyecto 90°/180°" en `App.tsx` utilizan actualmente `MatrixTransform.rotate90/rotate180`.
   - *Migración*: Integrar con `TransformEngine.applyMatrix()` para permitir deshacer/rehacer dentro del mismo flujo de comandos de transformación global.

---

## 4. Funcionalidades Existentes con Bugs Conocidos

1. **Muestreo de Cuentagotas en Capas con Opacidad/Fusión**:
   - *Efecto*: Al tomar un muestra de color con la herramienta Picker sobre capas combinadas con opacidad reducida o modos de fusión activos, en ocasiones se obtiene el valor RGBA bruto de la capa activa en lugar del color resultante compuesto en pantalla.
   - *Prioridad de solución*: Alta.

2. **Gestión de Caché de Capas en Animaciones Extensas**:
   - *Efecto*: En proyectos de animación con más de 100 fotogramas y múltiples capas compuestas, el buffer `LayerCacheManager` puede acumular fotogramas en caché no invalidados al realizar ediciones rápidas durante la reproducción continua.
   - *Prioridad de solución*: Media.

3. **Navegación Táctil en Selección Activa**:
   - *Efecto*: El gesto de zoom/pan con pellizco (*pinch-to-zoom*) en dispositivos móviles o tabletas a veces interfiere con el evento de arrastre de la selección si la selección está activa.
   - *Prioridad de solución*: Media.

---

## 5. Herramientas que Reutilizan `SelectionEngine` y `TransformEngine`

| Herramienta / Módulo | Engine Consumido | Estado de Certificación |
| :--- | :--- | :--- |
| **Marco Rectangular (`rect_select`)** | `SelectionEngine` | 🟢 100% Certificado (ADR-SELECTION-001) |
| **Marco Elíptico (`ellipse_select`)** | `SelectionEngine` | 🟢 100% Certificado (ADR-SELECTION-001) |
| **Lazo Libre (`lasso_select`)** | `SelectionEngine` | 🟢 100% Certificado (ADR-SELECTION-001) |
| **Varita Mágica (`wand`)** | `SelectionEngine` | 🟢 100% Certificado (ADR-SELECTION-001) |
| **Mover Selección (`MoveSelectionTool`)** | `SelectionEngine` + `TransformEngine` | 🟢 100% Certificado (ADR-TRANSFORM-001) |
| **Transformación Libre (`CanvasArea` Overlay)** | `TransformEngine` / `TransformMatrix` | 🟢 100% Certificado (ADR-TRANSFORM-001) |
| **Transformación de Recursos (`AssetTransformationService`)** | `TransformMatrix` / `MatrixTransform` | 🟢 100% Certificado |
| **Transformación de Utilidades (`transformUtils`)** | `TransformMatrix` | 🟢 100% Certificado |

---

## 6. Herramientas con Código Legado Pendiente de Reutilización Directa

| Módulo / Control | Componente Actual | Plan de Integración |
| :--- | :--- | :--- |
| **Ajuste Numérico de Imagen de Referencia** | `HeaderMenu.tsx` / `CanvasArea.tsx` | Migrar a manipuladores visuales en pantalla sobre `TransformEngine` |
| **Tiling Offset en Patrones** | `AssetPatternService.ts` | Reemplazar cálculo manual de desplazamiento por matriz afin `TransformMatrix.createTranslate` |

---

## 7. Priorización Técnica Recomendada (Roadmap de Desarrollo)

### 🚀 Sprint 2.1 — Corrección de Bugs de Usabilidad y Experiencia de Dibujo
1. **Fix Cuentagotas Compuesto**: Corregir la extracción de color en el lienzo compuesto (`Composite Canvas Sample`) para considerar capas con opacidad y modos de fusión.
2. **Snapping Magnético con Guías**: Conectar las guías verticales/horizontales al sistema de snapping del pincel y de las herramientas de selección.
3. **Invalidación de Caché de Capas**: Asegurar la invalidación inmediata de `LayerCacheManager` al modificar píxeles durante la reproducción de animaciones.

### 🎨 Sprint 2.2 — Finalización de Funcionalidades Parciales y Modo Paleta Indexada
1. **Modo Paleta Indexada Estricta**: Implementar restricción opcional de dibujo locked-to-palette y re-mapeo dinámico de colores.
2. **Transformación Interactiva de Imagen de Referencia**: Permitir escalar, mover y rotar la imagen de referencia mediante gizmos directos en el canvas.
3. **Optimización de Gestos Táctiles**: Separar los reconocedores de gestos multitáctiles (Pan/Zoom) de los eventos de modificación de la selección activa.

### 🌟 Sprint 2.3 — Expansión de Herramientas de Edición Pixel Art
1. **Pincel Personalizado Dinámico (Dynamic Custom Brush)**: Permitir convertir cualquier selección activa en un pincel listo para dibujar.
2. **Filtros Pixel Art Avanzados**: Implementar filtros destructivos/no-destructivos de Paletizado, Dithering Bayer/Bayer4x4, Ajuste de Brillo/Contraste y Contorno Automático (Outline Generator) reutilizando los buffers de capas.
3. **Herramienta de Sombreado (Shading/Light Brush)**: Pincel especial para aclarar/oscurecer píxeles según la paleta activa.

---

*Documento oficialmente incorporado al repositorio de OnePixel Studio.*
