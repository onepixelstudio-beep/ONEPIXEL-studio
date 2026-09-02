# ADR-DEV-003: Protocolo de Intervención Controlada (Controlled Intervention Protocol)

**Estado**: Aceptado / Certificado  
**Fecha**: 2026-07-25  
**Subsistema**: Estándar de Desarrollo y Arquitectura (`ADR-DEV-003`)

---

## 1. Objetivo y Principio Fundamental

Establecer un protocolo metodológico obligatorio que impida realizar cualquier modificación de código fuente en **OnePixel Studio** sin antes haber demostrado técnicamente la causa raíz exacta del problema y presentado un plan de intervención validado.

> **Regla Fundamental**: Queda estrictamente prohibido comenzar una implementación únicamente porque un componente parezca ser el responsable. Primero deberá demostrarse mediante auditoría y diagnóstico que dicho componente es la causa real del problema. No se corregirán síntomas; únicamente causas raíz.

---

## 2. Flujo Obligatorio de Intervención de 7 Fases

Antes y durante cualquier tarea de mantenimiento, desarrollo o corrección técnica, se debe ejecutar secuencialmente el siguiente flujo de trabajo:

### Fase 1 — Auditoría
Antes de escribir una sola línea de código, se inspecciona el estado actual del proyecto sin modificar la interfaz ni el código ejecutable. La auditoría debe responder con precisión:
1. ¿Qué está ocurriendo exactamente?
2. ¿Dónde ocurre?
3. ¿Desde cuándo o bajo qué condiciones ocurre?
4. ¿Qué componentes participan?
5. ¿Qué componentes NO participan?

*Nota: Durante esta fase queda terminantemente prohibido proponer o aplicar soluciones.*

### Fase 2 — Diagnóstico
Con la evidencia obtenida en la auditoría, se identifica la causa raíz técnica del problema.
- No se consideran síntomas ni consecuencias secundarias como causa raíz.
- Si existen múltiples hipótesis, deben enumerarse y priorizarse según su grado de probabilidad técnica demostrable.

### Fase 3 — Plan de Intervención
Antes de modificar cualquier archivo, se debe estructurar y presentar un plan técnico de intervención delimitado que especifique:
- Subsistema responsable.
- Archivos que se modificarán.
- Archivos garantizados como intactos.
- Nivel de riesgo estimado (Bajo / Medio / Alto).
- Justificación técnica demostrando por qué la solución propuesta resolverá la causa raíz.

### Fase 4 — Confirmación del Alcance
Si durante la auditoría, diagnóstico o desarrollo del plan se descubre que resolver la incidencia requiere modificar un subsistema distinto al autorizado inicialmente:
- La implementación debe detenerse inmediatamente.
- Se debe reportar el nuevo hallazgo y solicitar autorización explícita para ampliar el alcance antes de continuar.
- Queda estrictamente prohibido ampliar el alcance de forma automática.

### Fase 5 — Implementación
Únicamente tras haber completado y validado las Fases 1 a 4 se podrá proceder con la edición de código.
- La ejecución debe cumplir rigurosamente con las directrices de **ADR-DEV-001** (Regla de Alcance Único) y **ADR-DEV-002** (Protección del Estado del Proyecto).

### Fase 6 — Validación
Toda modificación deberá superar satisfactoriamente y en secuencia:
1. Compilación de aplicación (`compile_applet`).
2. Análisis estático y de tipos (`lint_applet`).
3. Verificación de guardarraíles arquitectónicos (`validate-guardrails.js`).
4. Pruebas unitarias/integración aplicables al subsistema.

*Si cualquiera de las verificaciones falla, la tarea no se considerará completada.*

### Fase 7 — Informe Final Obligatorio
Toda intervención debe concluir entregando el reporte de cierre estructurado según la plantilla oficial:

```markdown
### Reporte de Intervención Controlada (ADR-DEV-003)

- **Problema original**: [Descripción breve]
- **Causa raíz encontrada**: [Demostración técnica]
- **Solución aplicada**: [Descripción de la solución]
- **Subsistema modificado**: [Nombre del Subsistema]
- **Archivos modificados**: [Lista de archivos]
- **Archivos intactos**: [Lista de archivos clave no tocados]
- **Riesgos encontrados**: [Ninguno / Detalle]
- **Compilación**: PASSED / FAILED
- **Guardarraíles**: PASSED / FAILED
- **Tests**: PASSED / FAILED
- **Confirmación de ausencia de cambios colaterales**: Sí
```

---

## 3. Integración con el Marco Normativo Existente

El presente protocolo complementa y refuerza:
- **ADR-UI-001**: Arquitectura de la Interfaz y Composición de Layout.
- **ADR-DEV-001**: Regla de Alcance Único (Single Scope Rule).
- **ADR-DEV-002**: Protección del Estado del Proyecto (Project State Protection Protocol).
