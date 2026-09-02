# ADR-TRANSFORM-001: Architecture Decision Record — Pixel and Selection Transformation System

- **Status**: Approved & Frozen (Architecture System Freeze for Sprint 1.6)
- **Date**: July 24, 2026
- **Subsystem**: `TransformEngine` (`/src/core/transform`)
- **Preceding Record**: `ADR-SELECTION-001` (Selection Engine Consolidation & Freeze)

---

## 1. Context & Executive Summary

Following the official consolidation and freeze of the **Selection Subsystem** (`ADR-SELECTION-001`), OnePixel Studio requires a high-performance, decoupled **Transformation System** (`TransformEngine`).

This document defines the architectural blueprint, mathematical model, memory management contracts, and integration interfaces for `TransformEngine`. As mandated, `SelectionEngine` remains strictly decoupled and untouched; `TransformEngine` consumes the public selection API without modifying selection logic or introducing circular dependencies.

---

## 2. System Scope

The `TransformEngine` subsystem is responsible for spatial and geometric transformations across pixel and object data targets:

1. **Active Selection Content**: Transforming the pixel RGBA data within an active selection mask boundary.
2. **Full Layers**: Transforming an entire layer buffer when no active selection is present.
3. **Animation Frames & Multi-Frame Sequences**: Applying uniform spatial transformations across selected animation frames or timeline spans.
4. **Future Target Extensions**: Transforming vector paths, text objects, or embedded asset containers via unified spatial matrix adapters.

---

## 3. Architectural Separation of Responsibilities

Strict architectural boundaries prevent feature leakage between selection management and pixel transformations:

### 3.1 SelectionEngine Responsibilities (ADR-SELECTION-001 - Frozen)
- Selection mask creation, modification, and Boolean operations (Add, Subtract, Intersect).
- Selection spatial queries (`contains()`, `getBounds()`, `getAlphaAt()`).
- Selection overlay rendering (marching ants, pivot indicator, interaction handles).
- Selection hit testing and interaction state management (`SelectionInteractionController`).
- **Forbidden**: `SelectionEngine` **MUST NOT** perform raster sampling, pixel interpolation, or layer buffer mutation.

### 3.2 TransformEngine Responsibilities (ADR-TRANSFORM-001)
- 2D Affine transformation matrix computation and state maintenance.
- High-speed pixel sampling and interpolation (`Nearest Neighbor` for pixel art fidelity, `Bilinear` / `Bicubic` for continuous smooth scaling).
- Real-time zero-allocation preview generation on pre-allocated offscreen contexts.
- Commit phase pixel rasterization and destructuring into layer RGBA arrays.
- History command dispatch for atomic Undo/Redo integration.
- **Forbidden**: `TransformEngine` **MUST NOT** alter selection masks during drag operations or duplicate selection state machine logic.

---

## 4. Mathematical Transformation Model

`TransformEngine` employs 2D Homogeneous Coordinate Affine Transformation Matrices (3x3 representation).

$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} a & c & tx \\ b & d & ty \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x - px \\ y - py \\ 1 \end{bmatrix} + \begin{bmatrix} px \\ py \\ 0 \end{bmatrix}$$

Flat 6-tuple array notation: `[a, b, c, d, tx, ty]`

### 4.1 Supported Transformation Primitives
1. **Translation**: $T(tx, ty)$ — Linear pixel offset.
2. **Scaling**: $S(sx, sy)$ — Uniform and anisotropic scaling relative to Pivot $P(px, py)$.
3. **Rotation**: $R(\theta)$ — Angular rotation around Pivot $P(px, py)$.
4. **Flipping**: $M(fx, fy)$ — Horizontal ($fx = -1$) or Vertical ($fy = -1$) reflection across pivot axis.
5. **Shear/Skew**: $K(kx, ky)$ — Angular distortion along orthogonal axes.

### 4.2 Pivot Mechanics
All rotations, scaling, and flips are evaluated relative to a configurable pivot point $P(px, py)$, defaulting to the geometric center of the target bounding box $B$:

$$px = B.x + \frac{B.width}{2}, \quad py = B.y + \frac{B.height}{2}$$

### 4.3 Pixel Sampling Algorithms
- **Nearest Neighbor (`nearest`)**: Preserves discrete color boundaries without introducing anti-aliasing artifacts. **Mandatory default for Pixel Art workflows**.
- **Bilinear Interpolation (`bilinear`)**: Smooth 4-tap pixel blend for continuous photographic or high-resolution assets.
- **Bicubic Interpolation (`bicubic`)**: 16-tap cubic spline interpolation for high-fidelity resizing.

---

## 5. End-to-End Workflow & Lifecycle

The transformation lifecycle operates as a non-destructive session:

```
[Idle] ──> startSession(target) ──> [Session Active]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
          updateMatrix()                                   renderPreview()
     (Scale, Rotate, Translate)                         (Zero-allocation 60 FPS)
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
          commitSession()                                cancelSession()
    (Rasterize pixels & save History)                 (Restore original state)
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                                      [Idle]
```

1. **Initialization (`startSession`)**:
   - Extract bounding box and target pixel RGBA buffer.
   - Cache original pixel buffer in a re-usable session backup context.
   - Initialize affine matrix to Identity `[1, 0, 0, 1, 0, 0]`.
2. **Interactive Preview (`updateMatrix` & `renderPreview`)**:
   - Update matrix transformation parameters continuously on user pointer drag.
   - Draw preview onto canvas overlay using `ctx.transform()` and offscreen cached source image.
   - **Zero memory allocations occur during active dragging**.
3. **Commit Phase (`commitSession`)**:
   - Execute inverse matrix mapping ($M^{-1}$) over output pixel grid.
   - Apply selected pixel sampling algorithm (`nearest` / `bilinear`).
   - Write output RGBA data back to target layer or frame.
   - Translate selection mask using `SelectionEngine.translate()` if transforming an active selection.
   - Register single atomic command with `HistorySubsystemAPI`.
4. **Cancel Phase (`cancelSession`)**:
   - Discard session matrix state.
   - Release session resources without modifying layer pixels.

---

## 6. Subsystem Integration & Contracts

### 6.1 History Subsystem (`HistorySubsystemAPI`)
- `TransformEngine` generates a single immutable snapshot payload (`TransformHistoryCommand`) containing `originalImageData`, `transformedImageData`, target ID, and matrix state.
- Undo restores `originalImageData` and original matrix state; Redo re-applies `transformedImageData`.

### 6.2 Layers Subsystem (`LayersSubsystemAPI`)
- Directly modifies layer pixel data only during `commitSession()`.
- Respects layer locks: throws or aborts if target layer is locked.

### 6.3 Timeline & Onion Skin Subsystems
- Live transformation preview is rendered exclusively for active frame target.
- Onion Skin rendering displays static reference frames without transformation distortion.
- Multi-frame commitment iterates over frame range applying identical matrix transformations.

### 6.4 Render Pipeline & Exporters (`ExportSubsystemAPI`)
- Exporters receive committed rasterized layers, requiring zero knowledge of live transform session states.
- High-fidelity export renders commit transforms using exact pixel interpolation settings (`nearest` for pixel art).

---

## 7. Performance & Memory Guarantees

1. **60 FPS Real-time Canvas Rendering**:
   - Interactive preview uses hardware-accelerated canvas context transformations (`ctx.setTransform(a, b, c, d, tx, ty)`).
2. **Zero Allocation During Drag**:
   - Pre-allocated `OffscreenCanvas` and `ImageData` buffers are reused across pointer events.
   - Matrix calculations mutate a single static `TransformMatrix2D` instance.
3. **Bounded Memory Overhead**:
   - Session backup buffers match exact target bounding box size rather than full project dimensions when transforming selections.

---

## 8. Extensibility Roadmap

The matrix model inherently guarantees support for future transformation modes without API breaking changes:

| Transformation Mode | Implementation Strategy |
| :--- | :--- |
| **Scale & Rotate** | Standard 2D Affine Matrix multiplication |
| **Horizontal / Vertical Flip** | Matrix scale by `-1` across pivot axis |
| **Skew / Shear** | Affine matrix shear elements $c = \tan(\phi_x), b = \tan(\phi_y)$ |
| **Perspective Distortion** | 3x3 Projective Matrix ($8$-parameter homography) |
| **Mesh Warp / Freeform** | Bilinear mesh interpolation over $N \times M$ control grid |

---

## 9. Public TypeScript Interfaces

The subsystem exports public contracts defined in `/src/core/transform/`:

- `ITransformEngine`: Core session controller interface.
- `TransformTypes.ts`: Type declarations for `TransformMatrix2D`, `TransformSessionState`, `TransformTarget`, and `InterpolationMode`.
- `TransformSubsystemAPI`: Public facade registered in `/src/api/publicApis.ts`.

---

## 10. Authorization & Architectural Sign-off

`ADR-TRANSFORM-001` is officially signed off and frozen. Proceed with implementation of Sprint 1.6: Transformation Subsystem.
