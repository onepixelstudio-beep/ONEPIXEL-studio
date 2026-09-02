# ADR 009: Dirección de Dependencias en Sistemas Auxiliares y Soporte

## Contexto y Problema

OnePixel Studio incluye módulos auxiliares avanzados (Centro QA, Diagnósticos, Flight Recorder, Telemetría, y el propio Framework de Estabilización). A medida que estos sistemas de soporte crecen y se vuelven más sofisticados, existe el riesgo de que introduzcan dependencias de acoplamiento fuerte hacia el núcleo funcional del editor (como el Canvas de dibujo, el Timeline de animación, el gestor de capas o las herramientas del Toolbar).

Si un sistema de soporte referencia directamente la implementación de un componente o servicio del editor, se generan dependencias cíclicas, el código se vuelve difícil de refactorizar, se complica la mantenibilidad a largo plazo y cualquier error menor en la infraestructura de QA puede propagarse y bloquear las funcionalidades de dibujo críticas para el artista.

## Decisión de Diseño

Se establece el principio arquitectónico de **Dirección Unidireccional de Dependencias**:

1. **Inversión de Dependencias Estricta**:
   - Ningún sistema auxiliar o de soporte puede importar componentes de interfaz, clases concretas o archivos de lógica de negocio del núcleo del editor (`Canvas`, `Layers`, `Timeline`, `Toolbar`, etc.).
   - Toda comunicación desde el editor hacia los sistemas auxiliares se debe realizar exclusivamente mediante interfaces abstractas, tipos primitivos serializables, o a través de adaptadores de datos pasivos.

2. **Dirección de Dependencias**:
   - Las dependencias deben apuntar siempre **desde la periferia (UI / Soporte) hacia las abstracciones de datos del núcleo**, y nunca al revés.
   - El Framework de Estabilización debe actuar como un motor aislado de evaluación de contratos. No conoce la interfaz de usuario de OnePixel Studio ni los detalles internos de las herramientas de dibujo. Solo evalúa estructuras de datos abstractas que representan métricas y listas dinámicas de criterios "Definition of Done".

3. **Garantía de Aislamiento en UI**:
   - Los paneles visuales de QA y soporte (`QAMainPanel`, etc.) actúan como consumidores de la API pública del Framework.
   - Si el Framework o la telemetría se desactivan o se eliminan del codebase, la aplicación del editor y el lienzo de dibujo deben compilar y funcionar al 100% de su capacidad.

## Consecuencias

- **Mantenibilidad Excelente**: Los desarrolladores pueden expandir o rediseñar por completo el lienzo de dibujo o el timeline sin temor a romper el motor de métricas de QA.
- **Portabilidad**: El Framework de Estabilización de OnePixel Studio queda tan limpio y desacoplado que podría ser reutilizado en cualquier otro proyecto de desarrollo sin cambios en su código base.
- **Cero Efectos Secundarios**: Se garantiza que la recolección de telemetría y el análisis de calidad no consumen recursos del bucle de renderizado ni alteran el estado funcional del lienzo del artista.
