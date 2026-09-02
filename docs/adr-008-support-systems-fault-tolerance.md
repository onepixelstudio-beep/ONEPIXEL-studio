# ADR 008: Tolerancia a Fallos en Sistemas de Soporte y Observabilidad Pasiva

## Contexto y Problema

OnePixel Studio incluye múltiples sistemas de soporte avanzados, como:
- **Centro QA**: Auditorías del plan maestro, análisis de invariantes de estado y simulaciones de estrés.
- **Telemetría y Diagnósticos**: Registro continuo de acciones del usuario y métricas de rendimiento en tiempo real.
- **Flight Recorder**: Registrador de vuelo que captura el estado del editor para diagnósticos posteriores.
- **ErrorBoundary**: Pantalla de recuperación y depuración ante crashes imprevistos.

En iteraciones anteriores, algunos fallos menores o excepciones no controladas dentro de estos módulos auxiliares (como el acceso a propiedades nulas de un proyecto inactivo o desestructuraciones sin validación de `stateInfo`) propagaron errores que bloquearon la renderización completa de la aplicación, provocando una **pantalla en blanco ("double fault")**.

Esto contradice la robustez esperada de una herramienta de producción. Los sistemas diseñados para detectar fallos o asistir en el aseguramiento de la calidad nunca deben ser la causa de un fallo catastrófico en el editor principal.

## Decisión de Diseño

Se establece como norma arquitectónica permanente que **todos los sistemas de soporte, diagnóstico, telemetría y visualización de calidad deben ser observadores pasivos y completamente tolerantes a fallos**.

### Principios Fundamentales:

1. **Observabilidad Pasiva**: 
   - Ningún componente de QA, telemetría o grabación de estado puede influir en el ciclo de vida crítico del editor o sus herramientas de dibujo.
   - Si un módulo auxiliar falla, se detiene o lanza una excepción, el editor debe seguir funcionando sin ninguna interrupción perceptible para el usuario.

2. **Aislamiento Total del Error**:
   - Todo punto de interacción con el estado del proyecto (`project`, `telemetry`, `flightRecorder`, etc.) debe estar fuertemente resguardado por bloques `try/catch` y operadores de encadenamiento opcional (`?.`).
   - Las desestructuraciones de estado de telemetría deben proporcionar siempre valores de respaldo (fallback) lógicos.

3. **Arquitectura del Flight Recorder**:
   - El registrador de vuelo (`FlightRecorder`) debe poder distinguir claramente entre tres estados:
     - **No hay datos** (`status: "Suspended"` / `hasProject: false`) cuando el diagnóstico está desactivado.
     - **Datos iniciales** (`status: "WaitingProject"`) cuando no hay ningún proyecto activo.
     - **Datos reales** (`status: "Ready"` / `hasProject: true`) cuando hay un proyecto inicializado.
   - En lugar de inventar o simular datos ficticios o aproximados bajo estados inactivos, el sistema informará de manera transparente su estado de suspensión o espera para que el consumidor visual degrade la interfaz de manera consciente y elegante.

4. **Robustez del ErrorBoundary**:
   - La pantalla de recuperación y auditoría post-crash debe ser virtualmente indestructible.
   - Debe diseñarse de forma modular e independiente. Si una sección de la telemetría, el historial o el Flight Recorder lanza una excepción durante el renderizado del ErrorBoundary, esa sección específica se degradará de manera aislada (mostrando un aviso local o datos vacíos), pero nunca provocará que falle toda la pantalla de recuperación.

## Consecuencias

- **Positivas**: 
  - Mayor robustez estructural. Es imposible que un error en el motor de diagnóstico interrumpa el flujo de trabajo del artista.
  - Mayor confianza en el manejo de emergencias. El ErrorBoundary siempre se mostrará correctamente y permitirá descargar diagnósticos fidedignos incluso bajo corrupción severa del estado global.
  - Código QA y de diagnóstico más fácil de extender sin riesgo de introducir regresiones críticas en el editor.
- **Ajustes requeridos**: 
  - Obligatoriedad de escribir pruebas defensivas en cada componente visual del panel QA.
  - Uso estricto de tipados que representen de manera explícita la opcionalidad y ausencia de datos reales.
