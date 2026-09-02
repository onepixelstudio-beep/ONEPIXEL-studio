# ADR-UI-001: Layout & UI Composition Standard

**Estado**: Aceptado / Certificado  
**Fecha**: 2026-07-24  
**Subsistema**: UI & Layout Composition Framework (`src/components/*`, `src/App.tsx`)

---

## 1. Contexto y Justificación

OnePixel Studio cuenta con una arquitectura interna altamente robusta para los motores de selección (`SelectionEngine`), transformación (`TransformEngine`), exportación y animación. Sin embargo, los paneles de la interfaz de usuario (`Preview`, `Referencia`, `ColorPanel`, `LayerManager`, `Timeline`, `Toolbar`) deben mantener la misma garantía de **estabilidad estructural**.

En iteraciones pasadas se identificó el riesgo de que modificaciones puntuales o refactorizaciones visuales pudieran causar la ocultación colateral, colapso o remoción accidental de componentes esenciales (como el panel de previsualización o el panel de color) debido al acoplamiento de banderas de visibilidad o a la sobrescritura completa de archivos.

Para eliminar definitivamente esta fragilidad, se establece **ADR-UI-001 (Layout & UI Composition)** como estándar obligatorio de composición visual e invariantes de interfaz.

---

## 2. Reglas Invariantes de la Arquitectura UI

### Regla 1: Componentes Principales Independientes
Cada panel principal de la aplicación (`PreviewAndReference` / `LeftPanel`, `ColorPanel`, `LayerManager`, `Timeline`, `Toolbar`, `OptionBar`, `HeaderMenu`) es un componente independiente con contrato público de propiedades (`Props`) claramente definido.

### Regla 2: Prohibición de Ocultamiento Colateral
Ningún componente principal puede renderizar, colapsar u ocultar a otro componente principal no relacionado dentro de su ciclo de vida o árbol JSX. La jerarquía de paneles se organiza de manera plana o mediante slots explícitos.

### Regla 3: Banderas de Visibilidad Explícitas y Dedicadas
Cada panel principal posee su propio estado discreto de visibilidad (`previewAndReferenceVisible`, `colorPanelVisible`, `layersVisible`, `timelineVisible`, `toolsVisible`). Queda estrictamente prohibido compartir o sobrecargar una misma bandera genérica (como `sidebarVisible`) para controlar la visibilidad de componentes no relacionados.

### Regla 4: Desacoplamiento de Layout y Lógica de Negocio
Los contenedores de maquetación (`SidebarBoundary`, sidebars laterales, rejas flex/grid) son responsables exclusivamente de la disposición espacial, bordes y restricciones adaptativas (responsive). No deben incluir lógica de negocio ni manipulación directa de estados de dibujo.

### Regla 5: Registro de Componentes Obligatorios
Los paneles principales están certificados como componentes requeridos en el **Manifiesto de UI Studio**. Antes de eliminar una sección del JSX o descartar un panel, se debe verificar formalmente contra el manifiesto para garantizar que no se omita ninguna herramienta esencial.

### Regla 6: Modificación Incremental y Quirúrgica
Está estrictamente prohibido sobrescribir componentes completos cuando un cambio afecte solo a una sección o sub-función visual. Toda modificación debe ser quirúrgica e incremental, preservando los contratos de propiedades, callbacks y capacidades integradas.

### Regla 7: Carga de Recursos Gráficos Oficiales en Entornos Embebidos
En entornos embebidos y sandboxed (como Google AI Studio / iFrames / Cloud Run), todos los recursos gráficos oficiales del sistema de Branding (`Logo.tsx`, `Icon.tsx`, e imágenes de la marca) deben renderizarse mediante el componente centralizado `BrandImage` o incluir explícitamente la política `referrerPolicy="no-referrer"`. Esto garantiza que los encabezados de referencia no sean bloqueados por restricciones cross-origin ni políticas de sandbox del navegador durante la resolución de activos estáticos PNG en la carpeta `/public`.


---

## 3. Matriz de Registro de Paneles Obligatorios

| Panel | Componente Principal | Estado de Visibilidad Dedicado | Ubicación en Layout |
| :--- | :--- | :--- | :--- |
| **Preview y Referencia** | `LeftPanel.tsx` | `previewAndReferenceVisible` (`sidebarVisible`) | Barra Lateral Derecha (Bloque Superior) |
| **Panel de Color** | `ColorPanel.tsx` | `colorsVisible` | Barra Lateral Derecha (Bloque Inferior) |
| **Gestor de Capas** | `LayerManager.tsx` | `layersVisible` | Canvas Overlays / Panel Flotante |
| **Línea de Tiempo** | `Timeline.tsx` | `timelineVisible` | Barra Inferior |
| **Barra de Herramientas** | `Toolbar.tsx` | `toolsVisible` | Barra Lateral Izquierda |
| **Barra de Opciones** | `OptionBar.tsx` | Integrado con Tool Active State | Barra Superior |

---

## 4. Verificación y Auditoría Continua

El script de guardarraíles (`scripts/validate-guardrails.js`) y la suite de pruebas automatizadas (`npm test`) auditan de forma continua la ausencia de ciclos de dependencia, el cumplimiento de guardarraíles y la integridad de la interfaz de usuario.
