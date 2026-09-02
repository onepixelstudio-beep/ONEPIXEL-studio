# ADR-007: Arquitectura de Recursos Persistentes y Biblioteca de Activos (AssetResource)

## Estado
**APROBADO**

## Contexto
OnePixel Studio requiere un sistema de biblioteca de recursos avanzado para persistir y aplicar elementos reutilizables creados por el artista, comenzando por los sellos (stamps) y extendiéndose en el futuro a patrones, pinceles personalizados y otros recursos gráficos.

Hasta la fecha, los datos en el lienzo y los elementos flotantes se gestionaban principalmente de forma en-memoria o mediante estructuras pesadas. Almacenar colecciones de sellos con matrices completas de píxeles directamente en una única clave de almacenamiento síncrona (como `localStorage`) presenta dos riesgos críticos:
1. **Problemas de rendimiento**: Deserializar grandes colecciones de píxeles en el arranque crítico de la aplicación ralentiza el tiempo de carga y de interactividad.
2. **Quota Exceeded**: El límite de `localStorage` de 5MB puede verse saturado rápidamente.

Para resolver esto y garantizar la escalabilidad futura hacia múltiples tipos de activos sin introducir migraciones destructivas, se rediseña la arquitectura hacia un modelo unificado de activos canónicos.

## Decisiones
1. **Consolidación de AssetResource como Contrato Canónico**:
   Toda la biblioteca de recursos gira en torno al modelo `AssetResource` definido en `src/types.ts`. Este modelo unifica los activos bajo una estructura limpia que separa la información organizativa de los datos específicos y metadatos flexibles.

2. **Organización del Modelo de Datos**:
   La interfaz `AssetResource` se compone de cuatro zonas conceptuales estables desde la versión 1:
   - **Información Común**: Campos de gobernanza, auditoría y geometría (`id` UUID, `version`, `type`, `name`, `description`, `tags`, `createdAt`, `updatedAt`, `width`, `height`, `pivot`, `preview`, `author`, `origin`).
   - **Datos Específicos (`data`)**: Contenedor aislado para propiedades de bajo nivel exclusivas de cada tipo de recurso (por ejemplo, para el tipo `STAMP` almacena `StampData` con el array `pixels`). Esto permite la evolución de nuevos tipos de activos (`PATTERN`, `BRUSH`, `TILE`, `TEMPLATE`, `SELECTION`) en fases posteriores sin alterar la estructura raíz del recurso.
   - **Metadatos Opcionales (`metadata`)**: Un almacén dinámico/flexible de tipo `Record<string, unknown>` para configuraciones y parámetros secundarios u opcionales específicos del sistema.
   - **Capa de Abstracción de Persistencia**: Mapeada en `LibraryService`, que gestiona la carga diferida e indexación.

3. **Separación de Responsabilidades**:
   - `SelectionState` representa el estado activo de la selección en el lienzo.
   - `CaptureService` actúa como el extractor matemático puro de píxeles, encapsulando la lógica geométrica de los modos de bounding box.
   - `AssetResource` representa la entidad canónica persistible.
   - `LibraryService` asume el rol exclusivo de persistencia.

4. **Optimización de Almacenamiento (Lazy Loading)**:
   - Los metadatos comunes e indexadores de los activos se almacenan de forma compacta en la clave única (`onepixel_stamps_index`).
   - El payload específico (`data`) de cada recurso se almacena de manera aislada en su propia clave individual (`onepixel_stamp_data_[assetId]`).
   - En el arranque de la aplicación, solo se carga el índice. El array pesado de píxeles u otra información técnica de `data` se carga de forma diferida (lazy loading) únicamente cuando el usuario selecciona o aplica el recurso.

5. **Sistema de Migración Integrado (`migrateAsset`)**:
   - Se implementa un middleware de migración robusto en `LibraryService.migrateAsset()`.
   - Este método normaliza de manera transparente recursos legacy de versiones anteriores (por ejemplo, aquellos que almacenaban el array de píxeles directamente en la raíz `pixels` o guardaban datos planos) hacia la nueva estructura jerárquica con `data.pixels` y rellena valores por defecto garantizando la compatibilidad hacia atrás total y libre de fallos.

6. **Modos de Bounding Box**:
   - Se diseña la arquitectura para soportar extracción de selección exacta (Modo A) y bounding box recortado/ajustado al área de píxeles opacos real (Modo B).

## Consecuencias
- **Bajo Acoplamiento**: Los componentes React y el lienzo no conocen los detalles de almacenamiento de los activos; interactúan puramente con el contrato estable de `AssetResource`.
- **Rendimiento Óptimo**: El arranque inicial de la aplicación permanece ligero y veloz independientemente del volumen de datos de los activos de la biblioteca local.
- **Robustez y Tolerancia a Fallos**: Gracias al middleware `migrateAsset()`, la evolución de futuros esquemas o la carga de datos antiguos no provoca roturas de renderizado ni regresiones de la base de datos de usuario.
- **Preparación para Cloud**: Este modelo orientado a documentos y almacenamiento por claves mapea de forma directa a bases de datos en la nube (como Firebase Firestore), posibilitando una futura sincronización y uso compartido multiusuario en OnePixel Studio de forma trivial.
