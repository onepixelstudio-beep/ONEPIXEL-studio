# Architecture Decision Record (ADR-SELECTION-001)
## Congelación de Arquitectura del Sistema de Selección de OnePixel Studio

**Estado**: 🧊 **CONGELADO & CONTRATO DEFINITIVO**  
**Fecha de Congelación**: 24 de Julio, 2026  
**Autor**: Arquitectura de Software OnePixel Studio  
**Ámbito**: Motor de Selecciones, Renderizado, Historial y Serialización  

---

## 1. Resumen Ejecutivo

Este documento define la arquitectura formal, contratos públicos, garantías de desacoplamiento y estrategias de extensión para el **Sistema de Selecciones de OnePixel Studio**.

Aprobado formalmente bajo las directivas del **ADR-SELECTION-001**, el diseño del sistema queda **oficialmente congelado**. Ningún componente de interfaz (UI), herramienta interactiva (Varita Mágica, Lazo, Marco Marquee, Selección por Color) o plugin futuro podrá implementarse violando las fronteras, contratos de eventos o estructuras descritas en esta especificación.

---

## 2. Visión General de la Arquitectura

El sistema se estructura en **6 subsistemas independientes y desacoplados**, donde cada módulo posee una responsabilidad única y aislada (Single Responsibility Principle):

```
+-----------------------------------------------------------------------------------+
|                               SelectionCommands                                  |
| (Operaciones de Alto Nivel: Invertir, Seleccionar Todo, Copiar, Pegar, Calar)     |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                SelectionEngine                                    |
| (Lógica Matemática de Operaciones Booleanas, API Pública & Bus de Eventos)       |
+-------------------+--------------------+--------------------+---------------------+
                    |                    |                    |
                    v                    v                    v
+-----------------------+ +------------------+ +------------------------------------+
|     SelectionMask     | |SelectionSerializer| |      SelectionHistoryAdapter       |
| (Modelo Datos/Buffer) | | (Export/Import)  | | (Snapshots Atómicos / Undo-Redo)  |
+-----------------------+ +------------------+ +------------------------------------+
                    |
                    v
+-----------------------------------------------------------------------------------+
|                            SelectionOverlayRenderer                               |
| (Vista / Marching Ants - Totalmente Pasivo, Observador del Engine)                |
+-----------------------------------------------------------------------------------+
```

---

## 3. Desglose de Responsabilidades por Módulo

| Módulo | Responsabilidad Principal | Dependencias Permitidas | Prohibiciones |
| :--- | :--- | :--- | :--- |
| `SelectionMask` | Almacenamiento eficiente del estado de selección pixel a pixel (Buffer binario / alpha de 8 bits). | Ninguna (TypeScript puro) | Cero UI, Cero DOM, Cero Canvas, Cero React |
| `SelectionEngine` | Motor matemático de operaciones algebraicas y booleanas entre máscaras. Emisor de eventos. | `SelectionMask` | No puede conocer `CanvasArea`, React hooks o eventos del ratón/DOM. |
| `SelectionOverlayRenderer` | Renderizado gráfico de las líneas animadas ("marching ants") y overlays de selección. | `SelectionMask`, Canvas2D / WebGL | No puede modificar el estado de selección, solo renderiza. |
| `SelectionCommands` | Orquestación de comandos de edición (Crop, Invert, Expand, Color Select, Fill, Copy, Paste). | `SelectionEngine`, `PixelProject` | No implementa algoritmos de renderizado ni gestión de estado en React. |
| `SelectionHistoryAdapter` | Generación y restauración de transacciones y deltas comprimidos para el sistema de Undo/Redo. | `SelectionEngine` | No duplica la lógica de mutación del estado. |
| `SelectionSerializer` | Conversión bidireccional de máscaras a formatos serializados (RLE, Base64, JSON, Binario). | `SelectionMask` | No depende del estado global ni de React. |

---

## 4. Contratos Públicos Estables (Interfaces Congeladas)

La API pública expuesta a continuación es el **contrato definitivo**. La implementación interna (ej. el buffer interno `Uint8Array`) puede optimizarse o reemplazarse sin alterar estas interfaces.

### 4.1. `SelectionMask` (Modelo de Datos)

```typescript
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ISelectionMask {
  readonly width: number;
  readonly height: number;
  
  /** Valor de selección entre 0 (no seleccionado) y 255 (totalmente seleccionado) */
  getValue(x: number, y: number): number;
  setValue(x: number, y: number, value: number): void;
  
  /** Indica si la máscara posee al menos un píxel con valor > 0 */
  isEmpty(): boolean;
  
  /** Bounding box mínima que envuelve todos los píxeles seleccionados (O(1) si está en caché) */
  getBounds(): BoundingBox | null;
  
  /** Obtiene copia del buffer crudo de 8-bits */
  getBuffer(): Uint8Array;
  
  /** Clona la máscara completa */
  clone(): ISelectionMask;
  
  /** Limpia la máscara asignando 0 a todos los píxeles */
  clear(): void;
}
```

### 4.2. `SelectionEngine` (Motor Matemático y Bus de Eventos)

```typescript
export type SelectionMode = 'replace' | 'add' | 'subtract' | 'intersect';

export interface SelectionChangeEvent {
  type: 'change' | 'clear' | 'invert';
  bounds: BoundingBox | null;
  isEmpty: boolean;
  timestamp: number;
}

export type SelectionListener = (event: SelectionChangeEvent) => void;

export interface ISelectionEngine {
  readonly width: number;
  readonly height: number;
  readonly mask: ISelectionMask;

  /** Operaciones Básicas */
  clear(): void;
  selectAll(): void;
  invert(): void;

  /** Operaciones Booleanas entre Máscaras/Regiones */
  union(otherMask: ISelectionMask): void;
  subtract(otherMask: ISelectionMask): void;
  intersect(otherMask: ISelectionMask): void;
  
  /** Operaciones por Formas Geométricas */
  selectRect(x: number, y: number, w: number, h: number, mode?: SelectionMode): void;
  selectEllipse(cx: number, cy: number, rx: number, ry: number, mode?: SelectionMode): void;
  selectPath(points: Array<{ x: number; y: number }>, mode?: SelectionMode): void;

  /** Consultas Rápida O(1) */
  contains(x: number, y: number): boolean;
  getAlphaAt(x: number, y: number): number;
  getBounds(): BoundingBox | null;
  getStatistics(): { selectedPixels: number; coveragePercentage: number };

  /** Sistema de Suscripción Decoupled (Sin React) */
  subscribe(listener: SelectionListener): () => void;
  
  /** Clona el estado actual del motor */
  clone(): ISelectionEngine;
}
```

### 4.3. `SelectionSerializer` (Serialización)

```typescript
export interface SerializedSelection {
  width: number;
  height: number;
  encoding: 'rle' | 'raw_base64';
  data: string;
}

export interface ISelectionSerializer {
  serialize(mask: ISelectionMask): SerializedSelection;
  deserialize(serialized: SerializedSelection): ISelectionMask;
}
```

---

## 5. Reglas de Desacoplamiento e Invariantes

1. **Agnosticismo Total de la Interfaz**:
   `SelectionEngine` y `SelectionMask` son 100% independientes del DOM, React, HTML Canvas y CSS Tailwind. Pueden ejecutarse en Web Workers, entornos Node.js o pruebas unitarias headless.

2. **Patrón Observer sin React**:
   El estado de selección no reside en un estado de React (`useState`). Reside en la instancia del `SelectionEngine`. Las vistas de React o componentes de UI se suscriben pasivamente mediante `subscribe()` o adaptadores con `useSyncExternalStore`.

3. **Compatibilidad con Múltiples Documentos**:
   No existe ningún estado global singleton. Cada objeto `PixelProject` o documento abierto posee su propia instancia aislada de `SelectionEngine`.

4. **Transacciones de Historia Atómicas**:
   `SelectionHistoryAdapter` captura deltas o estados de selección sin duplicar instancias innecesarias en memoria, garantizando retrocesos (`Undo`) y avances (`Redo`) limpios e instantáneos.

---

## 6. Criterios de Rendimiento

* **Consultas Puntuales $O(1)$**: `contains(x,y)` realiza un acceso directo al índice `y * width + x` en el `Uint8Array`.
* **Operaciones de Máscara $O(W \times H)$**: Operaciones globales procesadas a nivel de buffers con loops continuos de baja memoria.
* **Bounding Box Culling**: El cálculo de intersecciones y renderizado se delimita al Bounding Box (ROI - Region of Interest) de la selección, evitando iterar sobre lienzos de gran resolución no modificados.
* **Reutilización de Buffers (Buffer Pooling)**: Las herramientas de arrastre interactivo (Marquee / Lazo) reutilizan un buffer temporal mutable asignado al inicio del arrastre para evitar la recolección de basura (*Garbage Collection Overhead*) a 60 FPS.

---

## 7. Compatibilidad y Evolución Futura

La arquitectura aprobada permite integrar las siguientes características avanzadas **sin modificar ni refactorizar el núcleo** (`SelectionMask` / `SelectionEngine`):

* **Feather (Calado y Difuminado)**: Soporte nativo de valores de 0 a 255 en `SelectionMask` (máscaras alpha suavizadas).
* **Operaciones Morfológicas (Expandir / Contraer)**: Módulos de filtrado que leen y escriben sobre la interfaz de `ISelectionMask`.
* **Selección Inteligente / IA / Visión**: Módulos externos que generan una `ISelectionMask` a partir de embeddings o máscaras de segmentación e invocan `union()` o `replace()`.
* **Transformaciones de Selección**: Movimiento y escalado del contorno de selección independientemente de los píxeles del lienzo.

---

## 8. Verificación de Integridad y Compilación

| Prueba / Verificación | Estado | Detalle |
| :--- | :--- | :--- |
| **Análisis Estático (tsc)** | 🟢 PASADO | 0 errores de tipos en la solución. |
| **Reglas de Arquitectura (Guardrails)** | 🟢 PASADO | 0 ciclos de dependencia, 0 violaciones de fronteras. |
| **Compilación de Producción (Vite Build)** | 🟢 PASADO | Bundle generado correctamente. |

---

## 9. Declaración Oficial de Congelación

> **OnePixel Studio queda oficialmente certificado y bajo congelación arquitectónica conforme al ADR-SELECTION-001.**
> 
> Ninguna nueva herramienta de selección, panel de control o plugin podrá integrarse violando las fronteras, contratos y reglas expuestas en este registro.
