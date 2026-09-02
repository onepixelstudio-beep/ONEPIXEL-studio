# OnePixel Studio - Architecture Guardrails & Fitness Rules

This document establishes the official, immutable architectural rules that protect the codebase of **OnePixel Studio** as it scales through successive development phases. These guidelines prevent design erosion, maintain high testability, and enforce strict module isolation.

---

## 1. Official Architecture Flow & Dependency Diagram

To ensure structural consistency and prevent circular dependency patterns, all files in the project must strictly adhere to the unidirectional flow mapped below:

```
┌──────────────────────────────────────┐
│            1. UI Components          │ (React Views, Modals, Timeline, Headers)
└──────────────────┬───────────────────┘
                   │ reads state / triggers
                   ▼
┌──────────────────────────────────────┐
│           2. Controllers             │ (Pointer handlers, Tool dispatchers, SnapEngine)
└──────────────────┬───────────────────┘
                   │ translates inputs to
                   ▼
┌──────────────────────────────────────┐
│         3. Command System            │ (Command classes, Tag/Layer/Frame actions)
└──────────────────┬───────────────────┘
                   │ mutates structures / triggers
                   ▼
┌──────────────────────────────────────┐
│          4. Project Model            │ (State representation, pixel maps, metadata)
└──────────────────┬───────────────────┘
                   │ pushes state snapshots to
                   ▼
┌──────────────────────────────────────┐
│           5. History Manager         │ (Undo/Redo via Structural Sharing)
└──────────────────┬───────────────────┘
                   │ triggers reactive redraw
                   ▼
┌──────────────────────────────────────┐
│         6. Canvas Renderer           │ (Layered offscreen compositing passes)
└──────────────────────────────────────┘
```

The strict, logical sequence is:
**UI ──> Controllers ──> Commands ──> Project Model ──> History ──> Renderer ──> Canvas**

---

## 2. Invariant Guardrail Rules (Architectural Fitness)

The following rules define the immutable constraints of the codebase. Our automated checker (`npm run lint`) enforces these rules during pre-compilation:

### Rule 2.1: Inter-Subsystem Isolation via Public APIs (v1)
- Subsystems **MUST** only be accessed via their official v1 Public APIs declared in `/src/api/publicApis.ts`.
- It is **STRICTLY PROHIBITED** for any module to import or directly access private internal files or helper utilities of another subsystem.
- **No deep imports**: Never bypass public boundary interfaces.

### Rule 2.2: Separation of UI and Logic
- **UI Components (`/src/components/*`, `/src/qa/ui/*`)** capture physical user interactions and display visual state.
- UI elements are **FORBIDDEN** from performing direct state mutations, canvas pixel manipulations, flood fill algorithms, or binary encoding inline.
- UI components must delegate all state-affecting actions to Controllers and Commands.

### Rule 2.3: Structural Mutations strictly via Commands
- Changes to core project assets (creating/deleting/reordering layers, adding/modifying frames, altering Onion Skin settings, or drawing pixel updates) **MUST** be executed through atomic, validated **Command** definitions.
- Direct inline manipulation of the project structure bypassing standard commands is prohibited.

### Rule 2.4: History as the Sole Undo/Redo Engine
- The `useUndoRedo` hook is the **SOLE** manager of history stacks (Undo and Redo queues).
- Individual tools, selection modules, or layers are forbidden from maintaining secondary undo/redo lists.
- History snapshots must be pushed via `saveSnapshotToHistory` (or the `HistorySubsystemAPI`) using **Structural Sharing** (references preserved via `shareStructure`) to avoid Garbage Collection stuttering.

### Rule 2.5: QA System as a Passive Observer
- The **QA/Diagnostics System (`/src/qa/*`)** operates strictly as an observer.
- QA code is **FORBIDDEN** from modifying production state, altering pixel values, altering selection masks, or forcing fake user input triggers during normal application execution.
- QA modules may only read telemetry, log events, run non-destructive fitness assertions, and render diagnostics overlays.

### Rule 2.6: Export System Decoupled from React
- The **Export Subsystem (`src/utils/exportSystem.ts`, `gifEncoder.ts`, `apngEncoder.ts`, `spriteSheetBuilder.ts`)** must be completely headless and decoupled from the React lifecycle.
- Export modules **MUST NOT** import React hooks (`useState`, `useEffect`, etc.), depend on rendering frames in active visual elements, or depend on `CanvasArea.tsx` components. They must perform processing purely through memory buffers, standard CanvasRenderingContext2D streams, and Web Workers.

---

## 3. Automated Fitness Tests Reference

The automated validator located in `scripts/validate-guardrails.js` performs the following static analysis assertions:

| Target File / Path | Forbidden Import Pattern | Reason |
| :--- | :--- | :--- |
| `src/qa/*` | Direct state mutations or input overrides | QA must remain a passive observer |
| `src/utils/export*`, `src/utils/gif*`, `src/utils/apng*` | `react`, `src/components/CanvasArea` | Export must be headless and fully decoupled from React |
| `src/components/Timeline`, `src/components/LayerManager` | Direct canvas pixel manipulation or geometry engines | UI must remain separate from logic |
| Any module | Private internal modules of other subsystems | Modules must strictly consume Public APIs |
