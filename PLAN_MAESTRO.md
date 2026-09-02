# Plan Maestro: OnePixel Studio (Fases y Hoja de Ruta)

Este documento registra formalmente la planificación estratégica, las fases de desarrollo, y el protocolo de aseguramiento de calidad de **OnePixel Studio**.

A partir de este hito, **la arquitectura base y el Framework QA (v1.0.0-frozen) quedan congelados y declarados como estables**. El foco de desarrollo se desplaza de manera exclusiva a la construcción de las funcionalidades del editor definidas en las fases de este Plan Maestro.

---

## 🛡️ Política de Congelación Arquitectónica

Con el objetivo de salvaguardar la estabilidad estructural del editor ante futuras iteraciones, se decreta formalmente la **congelación absoluta de la infraestructura de soporte**:
1. **Sin Nuevas Capas de QA**: No se añadirán nuevas capas, suites de verificación automática, ni modificadores de estado para el Framework QA.
2. **Sin Nueva Telemetría**: El sistema de tracking actual queda congelado; se prohíbe introducir nuevos disparadores de eventos de telemetría o monitorización.
3. **Sin Nuevos Paneles de Diagnóstico**: El Centro de Diagnóstico Integrado y los paneles visuales de QA no recibirán nuevas ampliaciones de diseño, botones o controles visuales de depuración.
4. **Sin Refactorizaciones Generales**: Se prohíben las refactorizaciones de infraestructura general o cambios en el sistema de transporte de datos salvo ante un error crítico medible o regresión de performance certificable.

La infraestructura actual pasa a considerarse un **sistema estable y en estado exclusivamente de mantenimiento**. Todo el esfuerzo de desarrollo se orientará exclusivamente a cumplir los hitos funcionales y artísticos de OnePixel Studio.

La arquitectura queda congelada, pero no es intocable: si durante el desarrollo de una fase aparece un problema real (de arquitectura, rendimiento, mantenibilidad o estabilidad), se detiene temporalmente esa fase, se corrige únicamente el área afectada, se vuelve a certificar y luego se continúa con el hito correspondiente. No se agregarán jamás mejoras preventivas ni nuevas capas de infraestructura sin evidencia objetiva de que sean estrictamente necesarias.

---

## 🔄 Protocolo de Evolución de Arquitectura y Certificación (Bloque 2.2)

### 1. Arquitectura Basada en Evidencia
A partir de este hito, toda modificación de arquitectura debe seguir este protocolo riguroso:
- **Detectar** un problema real, medible y objetivo.
- **Reproducirlo** y aislarlo de forma consistente.
- **Encontrar** la causa raíz de la falla.
- **Corregir** de forma minimalista únicamente la sección afectada.
- **Ejecutar** localmente el ciclo completo de validaciones: `lint`, `build`, pruebas automáticas, pruebas manuales y pruebas de estrés (cuando apliquen).
- **Certificar** nuevamente la sección modificada y continuar con la fase.
- *Nota: No se admitirán cambios ni parches "por si acaso" (preventivos).*

### 2. Validación Continua de Fases
Al iniciar cada nueva fase del Plan Maestro:
- **Revisar** que todas las fases y flujos anteriores continúen operativos al 100%.
- **Comprobar** activamente que no existan regresiones de rendimiento, experiencia o funcionalidad.
- **Ejecutar** de manera específica las pruebas relacionadas con los módulos impactados.
- **Detener el desarrollo** de inmediato ante cualquier regresión. Las regresiones deben resolverse antes de acumular código nuevo. *Nunca acumular bugs para solucionarlos al final.*

### 3. Certificación Incremental Obligatoria
Cada fase debe avanzar obligatoriamente a través del siguiente flujo secuencial:
```
Implementación ──> Integración ──> Corrección de Errores ──> Pruebas Automáticas ──> Pruebas Manuales ──> Stress Test (si aplica) ──> Certificación QA ──> Congelación de la Fase
```
No se permite iniciar el desarrollo de una nueva fase hasta que la anterior esté formal y rigurosamente certificada.

### 4. Protección Absoluta de la Arquitectura
- Los **Guardrails** del sistema seguirán ejecutándose de forma automática en cada compilación y proceso de linter (`npm run lint` / `npm run build`).
- **Prohibición de Relajación**: Queda estrictamente prohibido modificar o relajar las reglas de los guardrails para permitir la entrada de nuevo código. Si un guardrail falla, el código de la funcionalidad debe ser reestructurado hasta cumplir con la norma de diseño.

### 5. Revisión Inicial Obligatoria (Pre-Fase 3)
Antes de comenzar el desarrollo funcional de la **Fase 3**:
- Se auditarán todas las fases ya implementadas (Fase 1, Fase 2 y Fase Extraordinaria).
- Se comprobará que ninguna funcionalidad haya quedado dañada por las optimizaciones de historial o refactorizaciones recientes.
- Si se detecta cualquier regresión o anomalía en el editor, se corregirá inmediatamente y se re-certificarán los módulos afectados antes de escribir código de la Fase 3.

---


## 🔄 Ciclo de Desarrollo de Fase Obligatorio

Cada fase del editor debe completarse en estricto orden secuencial siguiendo este ciclo iterativo:

```
[Implementación] ──> [Integración] ──> [Corrección de Errores] ──> [Pruebas Automáticas] 
       ▲                                                                   │
       │                                                                   ▼
[Cierre de Fase] <── [Certificación QA] <── [Pruebas de Estrés] <── [Pruebas Manuales]
```

1. **Implementación**: Construcción modular del código respetando el estándar `Tool → Controller → Commands → History → Renderer → UI`.
2. **Integración**: Acoplamiento progresivo en la interfaz única sin introducir dependencias circulares ni bloating en `App.tsx` o `CanvasArea.tsx`.
3. **Corrección de Errores**: Depuración inmediata de excepciones en consola, warnings de React o tipados erróneos de TypeScript.
4. **Pruebas Automáticas**: Ejecución de la suite de pruebas mediante `npm run test` y mantenimiento de cobertura.
5. **Pruebas Manuales**: Validación de flujos de interacción, usabilidad táctil y flujos de usuario habituales.
6. **Pruebas de Estrés (cuando apliquen)**: Comprobación de límites con altas resoluciones (128x128+) o gran número de fotogramas (100+) para prevenir fugas de memoria y caídas de FPS.
7. **Certificación QA**: Verificación estricta mediante el Centro de Diagnóstico Integrado y validación de las invariantes del sistema.
8. **Cierre de la Fase**: Emisión del Acta de Auditoría y congelación de la fase. No se avanza a la siguiente fase sin la certificación completa.

---

## 📅 Estado de las Fases de Desarrollo

### 🟢 Fase 1: Sistemas del Lienzo, Color y Herramientas Básicas
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Implementación del núcleo de dibujo, selección de color básico, zoom, pan, pinceles de un píxel, borrador y reglas de precisión. Sincronización del estado de idioma (ES, EN, PT) como invariante estructural.

---

### 🟢 Fase 2: Estabilización de Selecciones
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Estabilización matemática del motor de selección. Soporte para Selección Rectangular, Lazo de Selección Libre y Varita Mágica (Magic Wand). Sincronización de máscaras de píxeles y transformaciones de movimiento.

---

### 🟢 Fase Extraordinaria: Preparación del Núcleo y Estabilización QA
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Reducción drástica de deuda técnica prioritaria.
    *   **Historial Optimizado**: Reemplazo de la clonación profunda JSON completa por un sistema de **Structural Sharing** (referencias compartidas) en `useUndoRedo.ts` para evitar la recolección de basura destructiva y el stuttering en trazos largos.
    *   **Modularidad Avanzada**: División inicial de monolitos. Extracción de depuración del sistema de guardado (`saveDebug`) y almacenamiento de contexto seguro (`safeLocalStorage`).
    *   **Motores del Lienzo**: Integración de motores desacoplados como el `CursorEngine` para gestionar dinámicamente las clases CSS de puntero.
    *   **Estándar Arquitectónico**: Definición de la canalización de herramientas estándar (`ARCHITECTURAL_STANDARD.md`).
    *   **Congelación de Infraestructura**: El Framework QA y la arquitectura base quedan congelados.

---

### 🟢 Fase 3: Estabilización de la Barra de Opciones
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Implementación de la barra superior/lateral de opciones que se adapta dinámicamente según la herramienta activa (grosor de pincel, presets, asimetría de espejo, dithering, tolerancia de relleno, etc.).
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: El panel de opciones lee la herramienta activa y carga en tiempo real sus controladores de configuración sin rezagos. Las opciones de tolerancia, modos de pincel, y dithering afectan correctamente el motor de dibujo.
    *   **Criterios Técnicos**: Cero re-renderizados innecesarios del lienzo de píxeles al interactuar con deslizadores (sliders) o inputs de la barra de opciones. Almacenamiento seguro del estado de las herramientas en preferencias locales.
    *   **Criterios de Calidad**: Cobertura i18n completa para todas las descripciones, etiquetas de deslizadores, y tooltips de opciones en ES, EN y PT. Código 100% tipado en TypeScript.
    *   **Criterios de UX**: Interfaz de opciones compacta y auto-explicativa. Los deslizadores numéricos admiten ajustes manuales por teclado y targets táctiles cómodos de al menos 44px de alto.

---

### 💾 Fase 4: Sistema de Guardado (Local y Nube)
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Sistema de gestión de archivos integrado, autoguardado inteligente y sincronización con bases de datos.
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: Capacidad de crear, duplicar, renombrar y eliminar proyectos. Sistema de autoguardado en segundo plano que se activa de forma no intrusiva al realizar cambios. Sincronización transparente con base de datos en la nube (Firestore).
    *   **Criterios Técnicos**: Uso de `safeLocalStorage` como fallback robusto cuando las cookies o el almacenamiento directo estén bloqueados en iframes. Inicialización diferida (lazy) del cliente de base de datos. Debounce en el guardado automático para evitar sobrecarga de red y cuotas.
    *   **Criterios de Calidad**: El sistema no bloquea la interacción en el canvas durante los procesos de escritura en segundo plano. Validación estricta del esquema de persistencia.
    *   **Criterios de UX**: Notificación de guardado sutil y silenciosa en la barra de estado (por ejemplo, "Guardado"). Modales limpios y jerárquicos de gestión de archivos locales.

---

### 🎞️ Fase 5: Sistema de Animación Avanzada
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Ampliación del motor del Timeline de animación, soporte para múltiples capas por fotograma, Onion Skinning (papel cebolla) y control avanzado de reproducción.
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: Navegación secuencial de fotogramas fluida, Onion Skinning con opacidades configurables para fotogramas previos y siguientes, y velocidad de reproducción (FPS) en tiempo real.
    *   **Criterios Técnicos**: El renderizado de Onion Skinning se realiza mediante buffer compuesto offscreen para evitar caídas de FPS. Aislamiento del bucle de reproducción interactivo para prevenir re-renderizados continuos de toda la UI de React.
    *   **Criterios de Calidad**: Pruebas de rendimiento superadas al manejar animaciones complejas (más de 100 fotogramas con múltiples capas).
    *   **Criterios de UX**: Timeline ergonómico, controles de reproducción (Play, Pause, Step) reconocibles, centrado automático de fotogramas e indicadores visuales limpios de fotogramas clave (keyframes).

---

### 🎨 Fase 6: Estabilización de Gestión de Color y Paletas
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Panel de color profesional, gestión de muestras de color (swatches), importación/exportación de paletas personalizadas y accesibilidad para daltonismo.
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: Importación de paletas en formatos GPL, HEX, o JSON. Creación, edición y ordenación de paletas del artista. Simulación nativa en el lienzo de filtros de daltonismo (Protanopia, Deuteranopia, Tritanopia).
    *   **Criterios Técnicos**: Sincronización eficiente del color activo. Uso de memorias caché para el color palette panel para evitar renders costosos de la UI al cambiar entre cientos de muestras.
    *   **Criterios de Calidad**: Cobertura completa de traducciones. Verificación de precisión matemática en las transformaciones de color de daltonismo.
    *   **Criterios de UX**: Ergonomía extrema en la selección de color. Ajuste preciso en sliders de matiz, saturación y brillo (HSV/HSL) sin saltos visuales.

---

### 📐 Fase 7: Estabilización y Optimización de la Interfaz
*   **Estado**: **Completado, Certificado y Congelado**.
*   **Descripción**: Maximizar el área útil del canvas, paneles colapsables, optimización de barra superior y timeline adaptable.
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: Interfaz adaptable a múltiples tamaños de pantalla. Paneles flotantes colapsables y con sistema tipo acordeón. El lienzo reclama automáticamente el espacio de trabajo vacante.
    *   **Criterios Técnicos**: Uso de transiciones CSS aceleradas por hardware para los paneles colapsables. `ResizeObserver` integrado de forma robusta para ajustar el canvas al redimensionar paneles sin stuttering.
    *   **Criterios de Calidad**: Cero clipping de textos o solapamientos visuales bajo resoluciones extremas o relaciones de aspecto reducidas.
    *   **Criterios de UX**: Disposición equilibrada de márgenes y espacios negativos. La tipografía Inter y Space Grotesk articulan una jerarquía clara.

---

### 🟢 Fase 8: Estabilización de la Biblioteca de Recursos y Motor de Patrones
*   **Estado**: **Completado, Certificado y Congelado** (Certificado bajo el protocolo EBA).
*   **Descripción**: Módulo de administración de sellos (stamps), patrones dinámicos de relleno y pinceles texturizados creados por el artista. Consolidación del motor matemático puro de repetición mediante un diseño desacoplado de estrategias de mosaico (`PatternRenderer`, `PatternStrategy` y `PatternCache`).
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: Guardar selecciones de píxeles como sellos reutilizables en una biblioteca local. Relleno dinámico de patrones personalizables con offsets, alineación local y absoluta, transformaciones y simetrías.
    *   **Criterios Técnicos**: Arquitectura unificada en `PatternRenderer` que actúa como única fachada pública de acceso al motor de patrones. Caching hermético de mosaicos pre-transformados para evitar recalcular polígonos o píxeles en bucles de dibujo iterativos.
    *   **Criterios de Calidad**: Cobertura completa de pruebas unitarias cubriendo todas las estrategias de repetición (`repeat`, `repeat-x`, `repeat-y`, `mirror`, `none`) y las transformaciones espaciales asociadas.
    *   **Criterios de UX**: Navegación visual fluida tipo rejilla para sellos, feedback interactivo claro con previsualizaciones a escala del elemento seleccionado sobre el cursor.

---

### 🎮 Fase 9: Estabilización del Sistema de Exportación e Implementación para Videojuegos
*   **Estado**: **En Diseño / Planificación** (Protocolo EBA).
*   **Descripción**: Exportación avanzada a formatos GIF animado, APNG, hojas de sprites (Sprite Sheets) estructuradas, atlas de texturas y empaquetado de metadatos JSON.
*   **Definition of Done (DoD)**:
    *   **Criterios Funcionales**: Exportar animaciones a GIF y APNG respetando el frame rate del timeline. Exportador de hojas de sprites parametrizable (columnas, filas, márgenes, sangrado de píxeles) con metadatos JSON integrados.
    *   **Criterios Técnicos**: Renderizado offscreen de fotogramas compuestos para la construcción del sprite sheet sin afectar el canvas visible. Empaquetado en background utilizando workers si la compresión de GIF/APNG toma más de 500ms para no congelar la pestaña del navegador.
    *   **Criterios de Calidad**: Comprobación estricta de las dimensiones exportadas. Los archivos GIF/APNG se reproducen correctamente en navegadores y motores de juegos (Unity, Godot, etc.).
    *   **Criterios de UX**: Modal de exportación avanzado e interactivo que muestra una previsualización real antes de la descarga, estimación de tamaño de archivo, y accesos directos de formato para flujos ágiles.

---

### 💎 Fase 10: Refinamiento Transversal y Pulido de Experiencia de Usuario (UX)
*   **Estado**: **Registrado para Refinamiento Posterior**.
*   **Descripción**: Fase dedicada exclusivamente al pulido visual, ergonomía espacial y consistencia holística de la interfaz, una vez finalizadas todas las bases y bloques de construcción funcional.
*   **Ejes de Acción**:
    *   **Optimización del Espacio de Trabajo**: Reducción de la altura de la barra superior/header para maximizar el área útil vertical dedicada al lienzo y a las líneas de tiempo.
    *   **Eliminación de Espacios Muertos**: Ajuste fino de paddings, márgenes y áreas vacías no productivas en los paneles laterales y timelines.
    *   **Adaptabilidad Móvil Extrema**: Optimización de la disposición del layout principal en pantallas pequeñas y dispositivos de baja resolución para un uso táctil fluido sin solapamientos.
    *   **Opciones Avanzadas del Usuario**: Integración de configuraciones avanzadas del editor (personalización de temas, atajos de teclado del usuario, etc.) de manera opcional y configurable.
    *   **Auditoría de UX Global**: Evaluación integral de la experiencia interactiva de principio a fin, revisando flujos cruzados de herramientas con una visión holística en lugar de por bloques aislados.
