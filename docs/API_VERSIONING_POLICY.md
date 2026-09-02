# OnePixel Studio - Public API Versioning & Deprecation Policy

This document defines the official policy and standards for managing, evolving, and deprecating the public interfaces of OnePixel Studio's seven core subsystems: **Canvas, Layers, History, Timeline, Animation, Selection, and Export**.

---

## 1. Versioning Standard

OnePixel Studio follows a rigid semantic versioning standard (based on SemVer) for its internal subsystem interfaces to ensure predictable integration:

```
[MAJOR].[MINOR].[PATCH]
```

- **MAJOR (e.g., v1.0.0 → v2.0.0)**: Introduced when there are incompatible, breaking changes to the subsystem's public API signature that require modifications in dependent modules.
- **MINOR (e.g., v1.0.0 → v1.1.0)**: Introduced when backward-compatible features, optional properties, or new helper methods are added to the public interface.
- **PATCH (e.g., v1.0.0 → v1.0.1)**: Introduced for backward-compatible bug fixes, performance optimizations, or internal refactorings that do not alter the public signature.

All subsystem versions are declared and tracked in the central version dictionary in `src/api/publicApis.ts` under `PUBLIC_API_VERSIONS`.

---

## 2. API Modification Procedure

When an engineer needs to modify a public API, they must follow this formal sequence:

```
[Analyze Change] ──> [Apply @deprecated] ──> [Introduce vNext] ──> [Grace Period] ──> [Safe Removal]
```

### Phase 2.1: Minor & Patch Changes (Compatible)
1. Add the new optional parameter, method, or property to the subsystem interface in `src/api/publicApis.ts`.
2. Increment the `MINOR` or `PATCH` version in `PUBLIC_API_VERSIONS`.
3. Implement the corresponding behavior in the subsystem module.
4. Verify the build compiles successfully with `npm run lint` and `npm run build`.

### Phase 2.2: Major Changes (Incompatible / Breaking)
Direct breaking changes are strictly prohibited in stable release cycles. If a method signature must be changed or replaced, the **Deprecation Pipeline** must be triggered.

---

## 3. Mandatory Deprecation Pipeline

No public API element (method, interface, or property) can be deleted or modified in a breaking way without first going through a formal deprecation period.

### Step 3.1: Mark as `@deprecated`
The existing API element must be annotated with standard JSDoc `@deprecated` comments explaining the replacement and the version in which it will be removed:

```typescript
export interface SelectionSubsystemAPI {
  version: '1.0.0';

  /**
   * Calculates the rectangular bounding box for the active selection.
   * @deprecated Since v1.1.0. Use `getSelectionBoundsExtended` instead.
   * Will be removed in v2.0.0.
   */
  getSelectionBounds(pixels: boolean[], width: number, height: number): { minX: number; minY: number; maxX: number; maxY: number } | null;

  /** New replacement method */
  getSelectionBoundsExtended(pixels: boolean[], width: number, height: number, includeFeathering?: boolean): SelectionBounds;
}
```

### Step 3.2: Recommended Minimum Lifespan
- A deprecated API **MUST** remain active and fully functional for at least **one entire development phase** (or 30 days) before it can be safely removed.
- This grace period ensures that developers working on secondary modules or integration branches have sufficient time to transition their code.

### Step 3.3: Static Warning logs
In development mode, deprecated paths should trigger non-blocking console warning logs when called to alert developers during manual integration testing:
```typescript
console.warn('[DEPRECATION WARNING] SelectionSubsystemAPI.getSelectionBounds is deprecated and will be removed in v2.0.0.');
```

---

## 4. Migration & Transition Procedures

When promoting a subsystem to a new major version (e.g., `v1` to `v2`):

1. **Dual Exposure (optional)**: For complex transitions, expose both `SubsystemAPIV1` and `SubsystemAPIV2` in `src/api/publicApis.ts` concurrently.
2. **Refactor Phase**: Update dependent UI components and controllers to consume the `v2` endpoints.
3. **Validate**: Run the automated Guardrail check and linter. Ensure zero deprecation warnings remain in the source code.
4. **Decommission**: Remove the deprecated `v1` interface and cleanup redundant implementation code.
