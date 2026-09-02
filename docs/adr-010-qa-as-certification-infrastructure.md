# ADR 010: QA as Certification Infrastructure

## Contexto y Problema

El Framework de Estabilización y el Centro de Aseguramiento de Calidad (QA) de OnePixel Studio han alcanzado un nivel de madurez sobresaliente. Cuenta con herramientas avanzadas para la validación de invariants de estado, recolección de métricas de rendimiento, simulación de estrés, registro de grabaciones de vuelo, y ahora, la certificación empírica interactiva sobre el editor real.

Sin embargo, seguir expandiendo esta infraestructura indefinidamente presenta riesgos significativos:
1. **Desviación del Foco**: El objetivo principal de OnePixel Studio es ser un editor de Pixel Art de alta gama, ágil y profesional para artistas, no convertirse en un producto de automatización de pruebas en sí mismo.
2. **Carga de Mantenimiento**: Cada línea adicional de código en el módulo QA representa una carga para futuras refactorizaciones del núcleo y una complejidad innecesaria en la base de código.
3. **Sobreingeniería**: Añadir paneles, modos de prueba especulativos o sistemas de telemetría "por si acaso" viola el principio fundamental YAGNI (You Aren't Gonna Need It).

## Decisión de Diseño

Se decreta la **Congelación Oficial del Framework de QA (Framework QA v1.0)** y su transición de un área de desarrollo activo a una **Infraestructura de Certificación Pasiva**. 

Se adoptan los siguientes principios rectores:

1. **Alineación con el Foco de OnePixel**: El Framework de QA existe exclusivamente para validar, certificar y blindar el editor real. Su alcance funcional queda formalmente congelado en este punto.
2. **YAGNI Estricto y Simplicidad de Mantenimiento**: No se añadirán nuevas vistas, paneles, modos de prueba, ni telemetría adicional de manera especulativa. Cualquier cambio posterior al módulo de QA deberá limitarse exclusivamente a:
   - Corregir bugs reales del motor de diagnóstico.
   - Mitigar incidencias de rendimiento o consumo de memoria.
   - Adaptar las pruebas de certificación a evoluciones de la API pública del editor.
3. **Flujo de Certificación como Puerta de Enlace**: El desarrollo de OnePixel Studio regresa al Plan Maestro bajo un estricto flujo de estabilización secuencial. Cada nueva fase de desarrollo del editor debe seguir el ciclo:
   `Desarrollo` → `Pruebas Automáticas` → `Pruebas Manuales` → `Stress Test` → `Corrección de Bugs` → `Certificación` → `Congelación de la Fase`.
4. **Criterio de Aceptación para Cambio de Fase**: No se permite avanzar a una nueva fase del Plan Maestro de OnePixel Studio sin haber obtenido la certificación de:
   - 🟢 Compilación limpia y Linter sin advertencias.
   - 🟢 Cero errores en tiempo de ejecución (React y TypeScript).
   - 🟢 Ausencia de fugas de memoria y listeners/timers huérfanos.
   - 🟢 Pasa exitosamente la batería empírica de pruebas reales sobre el editor.

## Consecuencias

- **Concentración de Esfuerzos**: El esfuerzo de desarrollo vuelve a enfocarse al 100% en las características del editor (barra de opciones, herramientas, exportadores, paletas avanzadas y experiencia del artista).
- **Estabilidad de la Infraestructura**: El Framework QA v1.0 se convierte en una base de código estable de referencia, libre del flujo continuo de modificaciones que puedan introducir nuevos fallos.
- **Calidad Sostenida**: El proceso de desarrollo se ralentiza de forma constructiva para asegurar que cada avance funcional del editor está perfectamente blindado por la infraestructura de certificación real existente.
