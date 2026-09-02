# Registro Interno de Sprints — OnePixel Studio

Este documento mantiene la trazabilidad de los bloques de trabajo y sprints de estabilización y refactorización de OnePixel Studio.

---

## 🎨 Sprint QA-08 — Rediseño Visual "Estratos Marinos"
- **Objetivo**: Renovación estética y unificación de la identidad visual del editor bajo el concepto "Estratos Marinos".
- **Estado**: ✅ Completado y Certificado.
- **Alcance y Tareas Ejecutadas**:
  1. **Cambio de Paleta**: Transición completa hacia la paleta "Estratos Marinos" (#01283F, #034959, #046773, #7DA495, #F2D598).
  2. **Regla 60/30/10**: Aplicación estricta de la regla de jerarquía de color (60% tono dominante profundo, 30% estructuración secundaria/paneles, 10% acentos cálidos).
  3. **Sustitución de Identidad Anterior**: Remoción de púrpuras, violetas y estilos heterogéneos anteriores.
  4. **Tipografía**: Integración de las fuentes *Quicksand* (interfaz y cuerpo) y *JetBrains Mono* (coordenadas, valores numéricos y consola).
  5. **Auditoría Visual Completa**: Actualización de diálogos de sistema (`WindowSystemDialogs.tsx`), modales (`PatternsModal.tsx`), lienzo (`CanvasArea.tsx`), barra de opciones (`OptionBar.tsx`), paneles (`LayerManager.tsx`, `Timeline.tsx`) y hoja de estilos global (`src/index.css`).

---

## ⚙️ Sprint QA-09 — Corrección Integral de Incidencias del Sistema de Preferencias
- **Objetivo**: Auditoría funcional completa del Sistema de Preferencias y corrección de todas las opciones para garantizar reactividad inmediata y persistencia total.
- **Estado**: ✅ Completado y Certificado.
- **Alcance y Tareas Ejecutadas**:
  1. **Vinculación Reactiva Canvas & Grid**:
     - Conexión de `canvas.showGrid`, `canvas.rulersVisible`, `canvas.showGuides` y `canvas.snappingEnabled` con `PreferencesSystem`.
     - Implementación de controles configurables para tamaño de cuadrícula (`grid.size`: 1px, 2px, 4px, 8px, 16px, 32px, 64px), color (`grid.color`) y opacidad (`grid.opacity`).
  2. **Persistencia Total**:
     - Almacenamiento centralizado en `PreferencesSystem` bajo la clave `onepixel_editor_preferences`.
     - Restauración automática en el arranque, manteniendo la configuración entre sesiones, cambio de proyectos y aperturas desde la nube.
  3. **Sincronización en Tiempo Real**:
     - Suscripciones reactivas en `App.tsx` que actualizan el lienzo (`CanvasArea`), overlay de guías (`GuideOverlay`), reglas (`RulerHorizontal`/`RulerVertical`) y motor de snap (`SnapEngine`) sin desconexiones.
     - Sincronización bidireccional entre el modal de preferencias (`PreferencesModal`), el menú superior (`HeaderMenu`) y atajos de teclado.

---

## 🧅 Sprint QA-10 — Corrección Integral del Sistema Onion Skin
- **Objetivo**: Auditoría técnica completa y resolución de todas las incidencias funcionales del sistema Onion Skin (Papel Cebolla) para elevarlo al estándar profesional de animación (Aseprite).
- **Estado**: ✅ Completado y Certificado.
- **Alcance y Tareas Ejecutadas**:
  1. **Activación Reactiva Bilingüe y Global**:
     - Corrección del botón de activación/desactivación en `Timeline.tsx` y `HeaderMenu.tsx`.
     - Sincronización reactiva bidireccional inmediata en la UI y estado global (`App.tsx`), reflejando instantáneamente la visibilidad del papel cebolla.
  2. **Configuración de Papel Cebolla (Panel & Wrench Icon)**:
     - Sustitución y unificación del icono de configuración por la llave inglesa (`Wrench`) en la línea de tiempo.
     - Reparación de los límites de desbordamiento (`overflow`) en el contenedor de `Timeline.tsx` para evitar que el panel emergente quede recortado u oculto.
     - Implementación de un panel emergente flotante con cierre automático al hacer clic fuera (`click-outside ref`).
     - Integración de todas las opciones en el `PreferencesSystem` para que también sean configurables desde el modal general de preferencias (`PreferencesModal.tsx`).
  3. **Ajuste y Renderizado de Parámetros**:
     - **Fotogramas Anteriores y Posteriores (`framesBefore` / `framesAfter`)**: Rango configurable de 0 a 5 cuadros.
     - **Opacidad Diferenciada (`opacityBefore` / `opacityAfter`)**: Controles independientes de opacidad con atenuación paso a paso lineal (*step falloff*) que garantiza la legibilidad de cuadros contiguos.
     - **Tinte Personalizable de Colores (`colorBefore` / `colorAfter`)**: Selección de color libre mediante selector visual e introductor Hexadecimal (rojo para anteriores, verde para posteriores por defecto).
     - **Modo Tintado Sólido vs Original (`tintMode`)**: Alternancia entre siluetas monocromáticas tintadas en tiempo real (`source-in`) y renderizado de colores originales en semitransparencia.
  4. **Renderizado en Tiempo Real, Rendimiento y Capas**:
     - Cacheado de composiciones por silueta en `LayerCacheManager.ts` con clave compuesta de tinte y estado de capas.
     - Composiciones compuestas multicapa: renderizado correcto considerando la visibilidad y opacidad de todas las capas activas de cuadros anteriores/posteriores.
     - Ejecución fluida a 60 FPS sin parpadeos ni interferencia con la reproducción (*playback*).
  5. **Persistencia Total**:
     - Registro y persistencia centralizada en `PreferencesSystem` bajo la clave `onepixel_editor_preferences`.

---

## 🧊 ADR-SELECTION-001 — Congelación Arquitectónica del Sistema de Selección
- **Objetivo**: Consolidación y congelación de la arquitectura del Sistema de Selección en 6 módulos desacoplados y agnósticos.
- **Estado**: ✅ Completado, Certificado y Congelado.
- **Alcance y Tareas Ejecutadas**:
  1. **Aislamiento Modular**: Definición de `SelectionMask`, `SelectionEngine`, `SelectionOverlayRenderer`, `SelectionCommands`, `SelectionHistoryAdapter` y `SelectionSerializer`.
  2. **Contrato de API Pública Estabilizado**: Congelación de la interfaz `ISelectionEngine` con soporte para operaciones booleanas, consultas $O(1)$, serialización RLE e integración desacoplada de eventos.
  3. **Desacoplamiento de UI**: Desvinculación total de React, HTML Canvas y DOM del motor matemático interno.
  4. **Documento Oficial**: Creación e integración del registro en `/docs/ADR-SELECTION-001_Sistema_de_Seleccion.md`.

---

## 🗺️ Hoja de Ruta de Sprints Futuros (Pruebas y Corrección)
- **Sprint QA-11**: Sistema de Selección y Transformación.
- **Sprint QA-12**: Biblioteca de Recursos.
- **Sprint QA-13**: Herramienta Varita Mágica.
- **Sprint QA-14**: Sistema de Capas.
- **Sprint QA-15**: Timeline y Animación.
- **Sprint QA-16**: Sistema de Guardado.
- **Sprint QA-17**: Zoom y Navegación.
- **Sprint QA-18**: Imagen de Referencia.
- **Sprint QA-19**: Modos de Color y Accesibilidad.
- **Sprint QA-20 (Identidad de Marca Final)**: Nuevo icono oficial para OnePixel Studio y wordmark en pixel art.
