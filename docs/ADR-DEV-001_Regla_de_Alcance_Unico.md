# ADR-DEV-001: Regla de Alcance Único (Single Scope Rule)

**Estado**: Aceptado / Certificado  
**Fecha**: 2026-07-25  
**Subsistema**: Estándar de Desarrollo y Arquitectura (`ADR-DEV-001`)

---

## 1. Objetivo y Principio Fundamental

Cada tarea de mantenimiento, desarrollo o refactorización debe afectar **únicamente al subsistema que corresponde**. Queda estrictamente prohibido que una tarea cuyo objetivo sea modificar un módulo termine realizando cambios en otros módulos no relacionados.

> **Principio Fundamental**: Una incidencia = un único objetivo = un único subsistema.

---

## 2. Las 6 Reglas de Alcance Único

### Regla 1 — Delimitación del alcance
Antes de modificar cualquier archivo, se debe identificar el subsistema responsable (ej. Branding, StudioLayoutEngine, ColorPanel, Timeline, LayerManager, SelectionEngine, TransformEngine, History, Render, Exporters, Preferences, Asset Library). Si durante la implementación se detecta que la solución requiere modificar otro subsistema, se debe detener la implementación e informar primero. No se ampliará el alcance por iniciativa propia.

### Regla 2 — Prohibición de cambios colaterales
Durante una tarea está prohibido modificar archivos que no pertenezcan al subsistema objetivo, salvo autorización explícita. Corregir un elemento de Branding no debe alterar `App.tsx`, `StudioLayoutEngine`, `ColorPanel`, o `Timeline`. Corregir `ColorPanel` no debe alterar `Branding` o `Toolbar`.

### Regla 3 — Auditorías sin modificaciones
Las auditorías técnicas deben ser completamente no invasivas. Queda prohibido insertar componentes visibles, modificar `App.tsx`, alterar el Layout, cambiar paneles o dejar código temporal durante una auditoría. Se realizarán únicamente mediante inspección del DOM, DevTools, consola, logs temporales, pruebas unitarias o análisis estático. Todo código temporal debe ser removido inmediatamente.

### Regla 4 — Confirmación antes de ampliar el alcance
Si durante una tarea aparece un problema perteneciente a otro subsistema, no se solucionará automáticamente. La IA/desarrollador debe detenerse, señalar la incidencia adicional en un subsistema secundario y esperar la confirmación y autorización del usuario.

### Regla 5 — Informe de impacto
Antes de aplicar cualquier modificación importante, se debe presentar un informe de impacto que contemple:
1. Subsistema objetivo.
2. Archivos que serán modificados.
3. Archivos que permanecerán sin cambios.
4. Riesgos potenciales.
5. Justificación técnica.

### Regla 6 — Verificación de alcance
Al finalizar cada tarea, se debe generar un resumen de verificación confirmando:
1. Subsistema modificado.
2. Archivos modificados.
3. Archivos no modificados.
4. Confirmación de ausencia de cambios colaterales.
5. Resultado de compilación y linters.
6. Resultado de guardarraíles arquitectónicos.

---

## 3. Protocolo de Ejecución Operativa (Obligatorio)

Toda tarea futura de mantenimiento o implementación debe seguir estrictamente este flujo de trabajo de 5 fases:

### Fase 1 — Identificación
Antes de modificar código se debe identificar y comunicar:
- Objetivo de la tarea.
- Subsistema responsable.
- Archivos que serán modificados.
- Archivos que permanecerán intactos.
- Riesgo estimado (Bajo / Medio / Alto).

### Fase 2 — Confirmación de alcance
Confirmar explícitamente que:
- El cambio afecta únicamente al subsistema identificado.
- No existen modificaciones colaterales previstas.
- Si se detecta que es necesario modificar otro subsistema, detenerse e informar antes de continuar.

### Fase 3 — Implementación
Realizar únicamente los cambios correspondientes al alcance aprobado. Queda estrictamente prohibido ampliar el alcance durante la implementación.

### Fase 4 — Validación
Al finalizar la implementación, ejecutar obligatoriamente:
- Compilación (`compile_applet`).
- Comprobación de TypeScript / Linter (`lint_applet`).
- Guardarraíles arquitectónicos (`validate-guardrails.js`).
- Pruebas unitarias o de integración del subsistema si aplican.

### Fase 5 — Informe Final Obligatorio
Entregar el informe de cierre estructurado con la plantilla oficial:
```markdown
### Reporte de Verificación de Alcance (ADR-DEV-001)

- **Subsistema modificado**: [Nombre del Subsistema]
- **Archivos modificados**: [Lista de archivos]
- **Archivos no modificados**: [Lista de archivos clave preservados]
- **Cambios realizados**: [Resumen puntual]
- **Riesgos detectados**: [Ninguno / Detalle]
- **Compilación**: PASSED / FAILED
- **Guardarraíles**: PASSED / FAILED
- **Tests**: PASSED / FAILED
- **Confirmación de ausencia de cambios colaterales**: Sí
```

---

## 4. Integración con ADRs Existentes

Este estándar se integra armoniosamente con:
- **ADR-RESILIENCE-001** (Resiliencia y Aislamiento de Errores)
- **ADR-SELECTION-001** (Motor de Selección)
- **ADR-TRANSFORM-001** (Motor de Transformación)
- **ADR-UI-001** (Layout & UI Composition)
