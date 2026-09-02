# ADR-DEV-002: Protección del Estado del Proyecto (Project State Protection Protocol)

**Estado**: Aceptado / Certificado  
**Fecha**: 2026-07-25  
**Subsistema**: Estándar de Desarrollo y Arquitectura (`ADR-DEV-002`)

---

## 1. Objetivo y Principio Fundamental

Establecer un marco de protección riguroso para la integridad del código fuente, el estado visual, la composición del layout y la funcionalidad global de **OnePixel Studio**.

El protocolo **Project State Protection Protocol** previene regresiones funcionales, sustitución accidental de componentes, alteraciones indeseadas de la interfaz y modificaciones fuera del alcance autorizado.

---

## 2. Las 10 Reglas de Protección del Estado del Proyecto

### Regla 1 — No sobrescribir componentes grandes
Queda estrictamente prohibido reemplazar completamente el contenido de un archivo cuando la modificación afecta únicamente a una sección o fragmento del mismo. En componentes que superen las ~300 líneas de código, cualquier cambio debe realizarse de forma quirúrgica e incremental mediante modificaciones localizadas (`edit_file` / `multi_edit_file`), preservando las funciones y estructuras no relacionadas.

### Regla 2 — Protección por Snapshots
Antes de modificar un componente crítico o de gran complejidad, se debe garantizar la recuperabilidad del archivo mediante un snapshot de estado o la preservación explícita del contenido original. Si la compilación, comprobación de TypeScript (`lint_applet`), guardarraíles o pruebas fallan durante o después de los cambios, el archivo debe ser restaurado de inmediato a su estado previo seguro antes de reevaluar.

### Regla 3 — Prohibición de modificaciones colaterales
Está estrictamente prohibido modificar archivos fuera del alcance aprobado para la tarea actual. Si durante la resolución de un problema se detecta que la solución óptima requiere modificar un subsistema secundario, el flujo de trabajo debe detenerse inmediatamente para solicitar autorización explícita del usuario antes de proceder.

### Regla 4 — Restauración Automática
Si tras una intervención se produce cualquier comportamiento inesperado (desaparición de paneles, distorsión de layout, errores en consola, pérdida de componentes o regresión funcional), el estado previo del componente o archivo afectado debe ser restaurado automáticamente antes de proponer o ejecutar cualquier otra estrategia de solución.

### Regla 5 — Conservación de Diseño
Al intervenir sobre componentes existentes, la prioridad absoluta es actuar como un restaurador:
1. Recuperar la interfaz visual original.
2. Reutilizar la lógica y estado existentes.
3. Evitar rediseños completos o sustituciones de estilo no solicitadas.

Queda prohibido reinventar o alterar la identidad visual de paneles existentes salvo autorización explícita.

### Regla 6 — Evidencia de Impacto
Toda tarea finalizada debe entregar obligatoriamente un informe de impacto y alcance utilizando la siguiente estructura normalizada:

```markdown
### Reporte de Verificación de Alcance e Impacto (ADR-DEV-002)

- **Subsistema modificado**: [Nombre del Subsistema]
- **Archivos modificados**: [Lista de archivos modificados]
- **Archivos garantizados como intactos**: [Lista de archivos clave no tocados]
- **Cambios realizados**: [Descripción puntual]
- **Riesgos encontrados**: [Ninguno / Detalle]
- **Compilación**: PASSED / FAILED
- **Guardarraíles**: PASSED / FAILED
- **Tests**: PASSED / FAILED
- **Confirmación de ausencia de cambios colaterales**: Sí
```

### Regla 7 — Principio de Mínima Intervención
Cuando existan múltiples alternativas técnicas para resolver un problema, se deberá elegir invariablemente aquella que implique modificar la menor cantidad de archivos y líneas de código posible, reduciendo al mínimo la superficie de riesgo.

### Regla 8 — Inmutabilidad del Núcleo
Los siguientes subsistemas se clasifican como **Núcleo Protegido del Sistema** y se consideran inmutables. Ninguna tarea que no esté explícitamente destinada a ellos podrá alterar sus archivos:

1. `SelectionEngine`
2. `TransformEngine`
3. `History`
4. `Render`
5. `Exporters`
6. `Branding`
7. `StudioLayoutEngine`
8. `StudioPanelRegistry`
9. `StudioUIManifest`
10. `VisibilityManager`

### Regla 9 — Auditoría Previa
Antes de escribir o modificar código, se debe realizar un análisis técnico previo no invasivo que documente:
- **Qué ocurre** (Síntoma exacto).
- **Por qué ocurre** (Causa raíz).
- **Dónde ocurre** (Ubicación en código).
- **Qué archivos están involucrados** (Alcance delimitado).
- **Cuál será exactamente la solución** (Estrategia quirúrgica).

Queda prohibido aplicar modificaciones de código sin haber completado este análisis.

### Regla 10 — Validación Obligatoria
Ninguna tarea o intervención se dará por concluida sin verificar explícitamente y de manera secuencial los tres niveles de certificación del proyecto:
1. Compilación exitosa (`compile_applet`).
2. Ausencia de errores TypeScript / Linter (`lint_applet`).
3. Validación verde de guardarraíles arquitectónicos (`validate-guardrails.js`).

---

## 3. Integración con el Marco Normativo de OnePixel Studio

El presente documento complementa y refuerza:
- **ADR-DEV-001**: Regla de Alcance Único (Single Scope Rule).
- **ADR-UI-001**: Layout & UI Composition.
- **ADR-RESILIENCE-001**: Resiliencia y Aislamiento de Errores.
- **ADR-SELECTION-001**: Motor de Selección.
- **ADR-TRANSFORM-001**: Motor de Transformación.
