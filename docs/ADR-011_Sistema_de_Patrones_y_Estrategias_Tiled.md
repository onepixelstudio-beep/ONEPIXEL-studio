# ADR-011: Consolidación Arquitectónica del Motor de Patrones y Estrategias Tiled

## Estado
**APROBADO** (Certificado bajo el protocolo EBA)

## Contexto
El editor OnePixel Studio implementa la habilidad de dibujar texturas y rellenar áreas utilizando patrones (tiling patterns) derivados de activos/recursos (sellos o stamps) guardados en la biblioteca del usuario.

Originalmente, la lógica matemática de cálculo de patrones y transformaciones residía parcialmente acoplada y dispersa en el motor de renderizado y el Canvas. Al añadir múltiples parámetros como rotación, escalado, desplazamientos locales/absolutos y modos de repetición (`repeat`, `repeat-x`, `repeat-y`, `mirror`, `none`), el sistema de dibujo corría el riesgo de sobrecargarse de parámetros y de violar el principio de responsabilidad única (SRP). 

Para garantizar la máxima reutilización, alta mantenibilidad y facilitar la incorporación de futuros patrones generativos o procedurales (como ruido de Perlin, patrones hexagonales, o radiales) sin modificar las herramientas de dibujo, se implementó una consolidación arquitectónica formal siguiendo el protocolo EBA (Evidence-Based Architecture).

## Decisiones

1. **Unificación mediante `PatternContext`**:
   Se encapsula toda la configuración de dibujo de un patrón en una estructura canónica inmutable llamada `PatternContext` (definida en `AssetPatternService.ts`):
   ```typescript
   export interface PatternContext {
     enabled: boolean;
     repeatMode: PatternRepeatMode;
     alignment: PatternAlignmentMode;
     offsetX: number;
     offsetY: number;
     rotation: 0 | 90 | 180 | 270;
     flipH: boolean;
     flipV: boolean;
     scale: number;
   }
   ```
   Esto reduce las interfaces de las herramientas (`Pen`, `Bucket Fill`, `Shape Tools`) a recibir un único contexto unificado en lugar de múltiples variables sueltas.

2. **Creación del Fachada Pública `PatternRenderer`**:
   Se introduce `/src/utils/resources/PatternRenderer.ts`, un motor de renderizado de patrones completamente desacoplado y puro. El Canvas, pinceles y herramientas de relleno consumen exclusivamente este componente bajo una firma simple:
   ```typescript
   public static getPixel(
     x: number,
     y: number,
     context: PatternContext,
     source: PatternSource,
     anchorX: number = 0,
     anchorY: number = 0
   ): string | null
   ```

3. **Encapsulamiento de la Caché (`PatternCache`)**:
   El almacenamiento y mantenimiento de la textura pre-transformada de trabajo (`PatternCache`) se privatiza dentro de `PatternRenderer`. Ningún componente React ni controlador del Canvas interactúa directamente con la caché. `PatternRenderer` gestiona de forma transparente un mapa estático de cachés indexado mediante firmas criptográficas de contexto (`getContextSignature`), evitando costosos cálculos en bucles calientes de dibujo.

4. **Contrato de Estrategia (`PatternStrategy` - OCP)**:
   El direccionamiento de píxeles y repeticiones se desacopla mediante el patrón de diseño Estrategia (Strategy). Se define la interfaz `PatternStrategy`:
   ```typescript
   export interface PatternStrategy {
     getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null;
   }
   ```
   Cada modo de repetición (`repeat`, `repeat-x`, `repeat-y`, `mirror`, `none`) es una clase pura que hereda de esta interfaz. El `PatternRenderer` actúa como despachador de estrategias.
   - **Extensibilidad**: Los futuros desarrolladores pueden registrar nuevas estrategias procedurales, generativas o con jitter (como `radial`, `hexagonal`, `noise`) mediante `PatternRenderer.registerStrategy(name, strategy)` sin alterar el motor del renderer ni los componentes visuales.

5. **Compatibilidad Estructural Versátil (`PatternSource`)**:
   Para simplificar la integración sin acoplarse forzosamente al modelo canónico de base de datos `AssetResource`, la interfaz de entrada admite polimorfismo estructural:
   ```typescript
   export type PatternSource = 
     | AssetResource 
     | { pixels: string[]; width: number; height: number; name?: string };
   ```

## Consecuencias

- **Alta Escalabilidad**: Cualquier nueva herramienta que requiera soportar patrones (por ejemplo, herramientas de rectángulos, elipses, líneas, degradados) solo necesita llamar a `PatternRenderer.getPixel(x, y, context, source, anchorX, anchorY)` delegando toda la complejidad geométrica y de caché.
- **Acoplamiento Cero**: El renderizado de patrones se convierte en una biblioteca matemática pura e independiente de React, del ciclo de vida del navegador, de Canvas y de los comandos de historial.
- **Rendimiento Máximo**: El renderizado de texturas de gran tamaño (probado hasta 256x256 píxeles) se realiza en O(1) tras el primer render gracias al hit de caché transparente unificado.
- **Cero Regresiones**: La separación estructural se valida mediante un conjunto exhaustivo de pruebas unitarias que comprueba la congruencia de los bordes, transparencias, y rotaciones con cobertura del 100%.
