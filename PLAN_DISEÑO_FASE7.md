# 📐 PLAN DE DISEÑO Y PLANIFICACIÓN TÉCNICA - FASE 7
## OnePixel Studio - Estabilización y Optimización de la Interfaz de Usuario

Este documento técnico establece la planificación arquitectónica, de experiencia de usuario, rendimiento, rendimiento gráfico y control de calidad para la **Fase 7: Estabilización y Optimización de la Interfaz** en OnePixel Studio, bajo los estrictos estándares del Protocolo de Evolución Basada en Evidencia (EBA).

---

## 1. Alcance Funcional (Functional Scope)

El objetivo central de la Fase 7 es transformar el espacio de trabajo de OnePixel Studio en un entorno altamente ergonómico, flexible y centrado en el lienzo. Al maximizar el área de trabajo y permitir el colapsado modular de los paneles circundantes, se proporciona al artista una experiencia inmersiva similar a la de las suites de diseño profesionales (Aseprite, Photoshop), manteniendo una tasa de cuadros por segundo de 60 FPS y previniendo colisiones de diseño o desbordamientos visuales.

### Dentro de Alcance (In-Scope)
1. **Lienzo Auto-Adaptable y Maximinizado (Workspace Maximization)**:
   * El lienzo reclamará de forma inmediata y automática cualquier espacio libre vacante por el colapsado o redimensionamiento de los paneles periféricos.
   * Integración robusta del motor del canvas con cambios dinámicos de tamaño mediante detectores de tamaño reactivos.
2. **Paneles Modulares Colapsables (Collapsible Panels & Sidebars)**:
   * **Barra de Herramientas Lateral (Izquierda)**: Opción de colapsado completo o visualización compacta a una sola columna de iconos.
   * **Panel de Control Multifunción (Derecha - Capas, Paleta, Historial)**: Colapsado suave hacia el lateral con un único clic. Soportará pestañas de tipo acordeón para evitar la sobrecarga de scroll.
   * **Timeline de Animación (Inferior)**: Sistema de colapsado/minimizado vertical para dejar libre la zona de dibujo cuando se trabaja en fotogramas fijos o estáticos.
3. **Persistencia del Estado de Layout (Layout Persistence)**:
   * El estado de visibilidad (abierto/cerrado) y el tamaño configurado de todos los paneles flotantes y colapsables se persistirán de manera segura en las preferencias locales (`localStorage`).
   * Al recargar el editor o abrir un nuevo proyecto, el entorno recuperará la disposición exacta definida por el usuario.
4. **Modo Libre de Distracciones (Atajo Tab - Zen Mode)**:
   * Implementación de la tecla de atajo rápida `Tab` para ocultar o mostrar de manera instantánea todos los paneles visuales de la interfaz de forma simultánea, dejando únicamente el lienzo limpio en pantalla.
5. **Barra Superior Compacta y Responsive**:
   * Reducción de la altura vertical de la barra de menús principal y de la barra de opciones de herramientas para aumentar el espacio útil en pantalla en pantallas compactas de ordenadores portátiles o tablets.
   * Menús desplegables auto-adaptables con flujos simplificados para pantallas de menor resolución sin clipping ni desbordamientos horizontales.

### Fuera de Alcance (Out-of-Scope)
* **Paneles flotantes desanclables (Detached Windows)**: Todos los paneles permanecen anclados a la cuadrícula (grid) principal del editor o colapsan contra sus bordes. No se implementará el arrastre libre de ventanas flotantes fuera de la ventana del navegador.
* **Redimensionamiento manual arbitrario (Resize Drag Handles)**: El redimensionamiento se controlará mediante botones de alternancia (toggle switches) de colapsado rápido o anchos predeterminados optimizados, simplificando la gestión de estados y evitando micro-stuttering por redimensionamiento arbitrario continuo del lienzo por parte del usuario.

---

## 2. Arquitectura Propuesta (Proposed Architecture)

El sistema de interfaz colapsable se estructura sobre la arquitectura del editor central de forma desacoplada, asegurando que los cambios de visibilidad no afecten al estado lógico del lienzo de píxeles ni al motor de animación.

```
+------------------------------------------------------------+
|                       UI Layer                             |
|  [App.tsx] ──> [Layout State Context] ──> [LocalStorage]   |
+----+-----------------------+---------------------+---------+
     |                       |                     |
     | (Control de           | (Control de         | (Notifica cambio
     |  visibilidad/Tab)     |  colapsado/ancho)   |  de dimensiones)
     v                       v                     v
+----+-----------------+  +--+------------------+  +--+--------------+
| Toolbar (Izquierda)  |  |  Timeline (Inferior)|  | Panel Derecho   |
| [Abierto | Compacto] |  | [Abierto | Cerrado] |  | [Abierto|Cerrado|
+----------------------+  +---------------------+  +-----------------+
     |                       |                     |
     +-----------------------+---------------------+
                             |
                             v  (Redimensionamiento del contenedor)
                      +------+--------------+
                      | [CanvasContainer]   |
                      |   - ResizeObserver  |
                      +------+--------------+
                             |
                             v  (Ajusta buffer interno y redibuja)
                      +------+--------------+
                      |  [CanvasArea.tsx]   |
                      |  - CanvasElement    |
                      +---------------------+
```

### Componentes y Responsabilidades

1. **`LayoutState` en `App.tsx`**:
   * **Responsabilidad**: Gestión de estados reactivos de la interfaz:
     * `toolbarState`: `'expanded' | 'compact' | 'collapsed'`
     * `rightPanelCollapsed`: `boolean`
     * `timelineCollapsed`: `boolean`
     * `zenModeActive`: `boolean` (cuando se pulsa `Tab`)
   * **Persistencia**: Se integra con el sistema de preferencias y se guarda en `localStorage` de manera transparente bajo la clave `onepixel-layout-prefs`.

2. **`ResizeObserver` en el Canvas**:
   * **Responsabilidad**: Escucha los cambios reales de tamaño del contenedor de lienzo (`CanvasContainer`) causados por las transiciones y redimensionamientos de la interfaz. Evita el cálculo estático basado en `window.innerWidth` / `window.innerHeight`.
   * **Sincronización de Dibujo**: Al detectar un cambio en el contenedor, se recalculan los límites lógicos, el factor de escala de píxeles, la posición de las reglas y la cuadrícula, y se realiza un repintado automático del canvas de renderizado a través de los buffers offscreen estables.

3. **Paneles Colapsables en Tailwind**:
   * **Responsabilidad**: Aplicación de animaciones suaves utilizando transiciones CSS nativas optimizadas para que el desplazamiento no degrade el rendimiento de la aplicación.
   * Uso de propiedades CSS de baja huella de procesamiento para evitar ciclos masivos de repintado (Layout Paint) en el navegador.

---

## 3. Objetivos del Definition of Done (DoD)

Para que el Bloque 7 pueda darse por concluido y certificado, debe satisfacer estrictamente los siguientes criterios medibles:

### Criterios Funcionales
* **Colapsado de Paneles**: Todas las secciones laterales y el timeline inferior deben poder colapsarse y expandirse con controles limpios.
* **Persistencia**: Las preferencias del usuario respecto al layout deben restaurarse fielmente tras recargar la página.
* **Atajo Zen (`Tab`)**: Al pulsar la tecla `Tab` se deben ocultar de manera coordinada todos los paneles circundantes. Al volver a pulsar `Tab`, la interfaz debe restaurar exactamente el estado individual previo de cada panel.
* **Ajuste Automático del Canvas**: El espacio de trabajo del lienzo debe redimensionarse y centrar el proyecto de forma automática de acuerdo con el nuevo espacio disponible, sin distorsionar la imagen de píxeles ni perder las guías, reglas o selección activa.

### Criterios Técnicos
* **Cero Stuttering de Transición**: La tasa de cuadros por segundo del lienzo debe mantenerse en **60 FPS** durante el colapsado/expandido de paneles, optimizando el ciclo de ejecución de renderizado.
* **Uso de ResizeObserver**: No se utilizarán escuchas masivas del evento `resize` de la ventana global `window` para el lienzo interno, empleando en su lugar la API estándar de `ResizeObserver` sobre el contenedor físico del lienzo.
* **Aceleración por Hardware**: Las transiciones se controlarán mediante propiedades CSS fluidas y se aplicará `will-change: width, transform` de forma inteligente sobre los contenedores de paneles para indicar al motor del navegador que delegue el procesamiento gráfico en la GPU.

### Criterios de Calidad
* **Cero Clipping Visual**: Ningún componente de la barra de opciones de herramientas, diálogos modales o paneles laterales debe colisionar, encabalgarse o quedar inaccesible bajo resoluciones reducidas (mínimo de 1024x768).
* **i18n Completa**: Todas las etiquetas de botones de colapsar, tooltips e indicadores de estado de la interfaz deben contar con su traducción correspondiente en ES, EN y PT.
* **Pruebas de Regresión**: Ninguna de las funcionalidades de fases previas (Timeline, Historial, Capas, Paletas de Color, Selección) debe presentar fallas o desajustes a causa de los cambios de layout.

### Criterios de UX
* **Espaciado y Jerarquía**: La interfaz compactada debe lucir limpia, moderna y profesional. Se implementarán transiciones elegantes de entrada/salida y hovers claros que inviten a la interacción sin recargar visualmente el espacio de trabajo.
* **Feedback de Teclado**: Las operaciones globales de visibilidad (`Tab`) deben mostrar una retroalimentación instantánea y una transición coordinada.

---

## 4. Riesgos Técnicos y Plan de Mitigación

| Riesgo Técnico Identificado | Impacto | Estrategia de Mitigación EBA |
| :--- | :---: | :--- |
| **Degradación de FPS durante redimensionamientos** | Alto | El canvas no se redibujará píxel a píxel de forma síncrona en cada micro-paso de la transición CSS. Se utilizará un enfoque reactivo o de redibujado de lienzo al final de la transición, o se mantendrá una escala estática del Canvas Element mientras se deforma por CSS la capa externa, redibujando el buffer exacto al finalizar. |
| **Pérdida de alineación de coordenadas de cursor** | Medio | Los controladores de eventos de puntero (`pointermove`, `pointerdown`) deben calcular de manera dinámica el `rect` del canvas de forma ágil, almacenando localmente en un caché temporal las dimensiones físicas del canvas que se actualice estrictamente tras la finalización de las transiciones de interfaz. |
| **Bucle infinito de ResizeObserver (Infinite Loop Warning)** | Medio | Ocurre si el manejador de `ResizeObserver` modifica las dimensiones de un elemento que a su vez altera el tamaño del contenedor que se está observando. Se mitigará separando físicamente el contenedor observado de las dimensiones explícitas asignadas al elemento Canvas, asegurando un flujo de datos unidireccional y estable. |

---

## 5. Plan de Implementación por Bloques

El desarrollo de la Fase 7 se segmenta en 4 bloques de trabajo autónomos y secuenciales bajo el estándar de OnePixel Studio:

### 📦 Bloque 7.1: Estructura Colapsable y Sistema de Visibilidad Global (Atajo Tab)
* **Estado**: **Completado y Certificado**.
* **Objetivo**: Implementar el contexto de estado de interfaz, los botones de interacción de colapsado (Toolbar compacta, timeline cerrado, sidebar cerrada) y la gestión lógica del Atajo de Teclado de modo libre de distracciones (`Tab`).
* **Entregables**:
  * Actualización de `preferences` de interfaz en el modelo global y persistencia en `localStorage`.
  * Registro del atajo `Tab` en los manejadores de eventos del editor global en `App.tsx` para coordinar el Modo Zen.
  * Creación de botones/manejadores flotantes con diseño minimalista para ocultar/mostrar paneles individuales y un acordeón interactivo para Preview & Referencia.

### 📦 Bloque 7.2: Integración de ResizeObserver de Alto Rendimiento
* **Estado**: **Completado y Certificado**.
* **Objetivo**: Reemplazar cualquier cálculo estático de dimensiones por un sistema reactivo basado en `ResizeObserver` sobre el contenedor físico del canvas, asegurando que el lienzo se estire, encoja o centre perfectamente sin distorsión.
* **Entregables**:
  * Integración completa y fluida del `ResizeObserver` en `useCanvasZoomPan.ts` como la única fuente de verdad para el redimensionamiento.
  * Uso de `requestAnimationFrame` (rAF) para agrupar múltiples eventos de redimensionamiento consecutivos por ciclo de refresco de pantalla, evitando sobrecargas de React y renderizados inútiles.
  * Cálculo dinámico de diferencias de tamaño (`dW`/`dH`) del contenedor para reajustar los desfases de arrastre (`panX`/`panY`), logrando que la visualización y el centro exacto del lienzo queden perfectamente alineados al contraer o desplegar paneles laterales.
  * Preservación intacta del nivel de zoom personalizado por el usuario durante las fases de redimensión del lienzo.
  * Sincronización reactiva del sistema de coordenadas de cursor, guías, reglas de dibujo y overlays de selección de forma instantánea.

### 📦 Bloque 7.3: Ergonomía Visual y Layout Adaptable (Bento Grid / Acordeón)
* **Estado**: **Completado**.
* **Objetivo**: Integrar las secciones del panel derecho en un diseño inteligente de pestañas unificadas y acordeones interactivos de alto rendimiento, evitando la fragmentación y optimizando la altura visual.
* **Entregables**:
  * Rediseño estructural de los paneles secundarios derechos en `App.tsx` y en el sub-panel de color.
  * Extracción y persistencia local de los estados del acordeón para el selector, la paleta y el historial de color.
  * Eliminación de anidamientos redundantes, dobles fondos y bordes en `LeftPanel.tsx` para optimizar el espacio útil de la barra lateral derecha.
  * Scrollbars minimalistas, fluidas y con un alto de visualización adaptativo.

### 📦 Bloque 7.4: Optimización de Transiciones y Estabilización UI
* **Estado**: **Completado**.
* **Objetivo**: Pulir la fluidez visual mediante CSS, aplicar aceleración gráfica, depurar posibles parpadeos de color y asegurar que la suite de pruebas del sistema esté completamente funcional al 100%.
* **Entregables**:
  * Integración de `transform-gpu` y optimizaciones de hardware `will-change` (`will-change-[width,margin-right]`, `will-change-[width,margin-left]`, `will-change-[height,max-height,margin-top]`, y `will-change-[max-height,opacity]`) para garantizar transiciones de 60 FPS sin parpadeos ni stuttering en barras laterales, timeline y paneles de color tipo acordeón.
  * Verificación exhaustiva de rendimiento, superando la suite completa de 129 pruebas integradas al 100%, linter limpio sin advertencias y compilación de producción exitosa.

---

## 6. Estrategia de Pruebas y Certificación

Para certificar formalmente la Fase 7 se implementará la siguiente suite de controles:

1. **Pruebas de Layout (Visual & Funcional)**:
   * Validar que la pulsación del botón de colapsar oculta físicamente el panel del árbol del DOM o reduce su ancho a cero mediante transiciones visualmente correctas.
   * Comprobar que el atajo `Tab` desactiva todos los paneles de forma simultánea y los restaura correctamente en su configuración anterior.
2. **Pruebas de Redimensionamiento (Lienzo)**:
   * Verificar que al cambiar de tamaño la pantalla o colapsar paneles laterales, las coordenadas del cursor del ratón sobre los píxeles del lienzo siguen siendo 100% precisas y no se desplazan ni un solo píxel de su posición real de dibujado.
3. **Pruebas de Estrés y FPS (Rendimiento)**:
   * Evaluar mediante herramientas de depuración la estabilidad del renderizado del canvas durante la animación del colapsado de paneles, asegurando que no desciendan los FPS por debajo de 55 FPS en hardware estándar.
4. **Verificación de Invariantes del Editor**:
   * Asegurar que el linter (`npm run lint`), la compilación (`npm run build`), y la suite completa de tests de regresión (`npm run test`) se ejecutan con resultado exitoso antes de congelar formalmente la fase.
