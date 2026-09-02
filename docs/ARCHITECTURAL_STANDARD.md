# OnePixel Studio: Architectural Standard for Tools

This document defines the standard, production-ready pipeline for implementing and extending editor tools in OnePixel Studio. Developers must adhere strictly to this uniform flow to guarantee consistent behavior, state integrity, high-performance execution, and clean undo/redo capability.

---

## 1. Core Architecture Diagram

The unified data and control pipeline flows in a single direction to keep operations predictable and decoupled:

```
[User Input]
     │
     ▼
┌──────────────┐
│  1. Tool     │  <-- Captures pointer, mouse, touch, or hotkey interactions in CanvasArea
└──────┬───────┘
       │ raw mouse events (clientX, clientY)
       ▼
┌──────────────┐
│2. Controller │  <-- Translates view coords, applies SnappingEngine, Symmetry, and active Tool rules
└──────┬───────┘
       │ sanitized canvas coordinates (X, Y)
       ▼
┌──────────────┐
│3. Commands   │  <-- Encapsulates atomic mutations into transactional commands
└──────┬───────┘
       │ commits changes / triggers
       ▼
┌──────────────┐
│4. History    │  <-- Tracks states in Undo/Redo queues with optimized Structural Sharing
└──────┬───────┘
       │ triggers reactive re-render
       ▼
┌──────────────┐
│5. Renderer   │  <-- Executes layered canvas drawing passes (layers, onion skin, active overlays)
└──────┬───────┘
       │ redraws canvas context viewport
       ▼
┌──────────────┐
│  6. UI       │  <-- Updates pixel coordinates, status indicators, HUDs, and sidebar states
└──────────────┘
```

---

## 2. Pipeline Breakdown

### Phase 1: Tool (Interaction)
The entry point of user interaction is the **CanvasArea** element. It captures the physical events from the browser:
- `onMouseDown` / `onTouchStart`
- `onMouseMove` / `onTouchMove`
- `onMouseUp` / `onTouchEnd`
- Global keyboard event listeners (`onKeyDown`, `onKeyUp`).

*Rule:* The interaction phase must not directly mutate project state. It is responsible only for gathering raw coordinates, modifier keys (`shiftKey`, `altKey`, `ctrlKey`), and tracking pointer active states.

### Phase 2: Controller (Coordination)
The controller translates raw input events into precise grid coordinates and coordinates behavior:
1. **Coordinate Translation:** Converts physical client coordinates `(clientX, clientY)` to canvas space `(canvasX, canvasY)` based on the current Pan and Zoom level using `getFractionalCanvasCoords`.
2. **Snapping Engine (`SnapEngine`):** Snaps raw grid coordinates to active guide lines, symmetry lines, or standard grid increments (e.g. 8x8) unless bypassed (via the `Alt` key).
3. **Symmetry Rules:** Computes symmetric partner coordinates for mirror-mode operations (horizontal, vertical, radial mirroring).
4. **Tool Router:** Routes coordinates to the active tool implementation handler (e.g., Pen, Bucket, Lasso selection, Shape tool, Eraser).

### Phase 3: Commands (Execution)
Any action that mutates the drawing or project data must be encapsulated in a **Command** object:
- **Atomicity:** A command represents a single, complete edit action (e.g. "Draw Line", "Delete Layer", "Move Guides").
- **State Transactions:** High-frequency edits (like continuous brush strokes) must be batched inside a transaction starting with `startTransaction()` and committing on `endTransaction()`.
- **Validation:** Commands validate boundaries (e.g., index within `0` and `width * height - 1`) to prevent runtime crashes.

### Phase 4: History (Undo/Redo & Structural Sharing)
Every completed command commits a state snapshot to the history stack:
- **Memory Optimization:** Uses reference-based structural sharing (`shareStructure`) inside `useUndoRedo` to reuse unchanged frames and layers.
- **Reference Integrity:** Prevents unnecessary garbage collection (GC) sweeps, keeping frame-by-frame memory footprints at a fraction of deep-cloned states.
- **Queue Limits:** Holds up to 50 levels of history, automatically purging older states to keep memory low.

### Phase 5: Renderer (Context Drawing)
The rendering loop is fully decoupled from interaction. It draws in logical layers onto the canvas:
1. **Background Layer:** Transparency indicator checkerboard pattern.
2. **Onion Skinning:** Renders preceding (with 70% opacity) and succeeding (with 40% opacity) frames.
3. **Drawing Layer:** Iterates active frame layers, respecting opacity and visibility toggles.
4. **Temporary Overlays:** Curve line preview, rectangle bounds, selection lasso paths, marquee marching ants, and temporary move/duplicate pixel matrices.
5. **HUD / Grid Elements:** Snapping lines, active ruler guides, and symmetry centers.

### Phase 6: UI (Feedback)
The user interface displays visual helpers outside of the canvas rendering stream:
- Coordinates display (e.g., `X: 12, Y: 18`) in the lower status bar.
- Project metadata and frame listings.
- Floating toolbar highlighting active states.

---

## 3. Tool Implementation Checklist

When creating a new tool (e.g., "Magic Brush" or "Polygon Tool"), follow this template:

1. **Define the Tool Enum:** Register the tool identifier in `ToolType` (`src/types.ts`).
2. **Assign Tool Cursor:** Update `CursorEngine` (`src/utils/canvas/CursorEngine.ts`) to return the appropriate cursor CSS class.
3. **Coordinate translation:** Leverage `getFractionalCanvasCoords` inside `handleMouseMove` to extract grid positions.
4. **Enforce Snapping:** Wrap final coordinate targets with `getSnappedCoords`.
5. **Batch mutations:** Wrap high-frequency paint events in a drawing transaction (`startTransaction() / endTransaction()`).
6. **Commit history:** Call `saveSnapshotToHistory` once the gesture concludes (`handleMouseUp`).

---

## 4. Architectural Decision Records (ADR) Registry Policy

As OnePixel Studio scales, architectural integrity must be preserved through recorded consensus. The policy for registering ADRs is as follows:
- **Mandatory ADR**: Any major architectural change (e.g., modifying the core state shape in `PixelProject`, adding global third-party library dependencies, altering the rendering engine pipeline, or introducing new network sync systems) **MUST** be registered in a new, sequential ADR file under `/docs/` (following the `adr-XXX-topic.md` template).
- **No ADR Required**: Minor code changes, single-component refactorings, local bug fixes, or minor enhancements do not require a formal ADR.

---

## 5. QA Framework Freeze & Evolution Policy

The **QA Framework (v1.0.0-frozen)** and overall architecture are now officially frozen and declared stable.
- **Exclusion of New Features**: Adding new telemetry systems, custom performance diagnostic panels, or mock assertion layers is **STRICTLY PROHIBITED** unless responding to a real, reproducible bug, regression, or a prioritized piece of technical debt.
- **Maintenance Only**: Future updates to `/src/qa/*` must be strictly restricted to maintenance and bug fixes.
- **Evolution Protocol**: Any and all future structural modifications must conform to the strict, evidence-based process outlined in [docs/ARCHITECTURAL_EVOLUTION_PROTOCOL.md](/docs/ARCHITECTURAL_EVOLUTION_PROTOCOL.md). No preventative "just-in-case" changes are permitted.

---

