# OnePixel Studio - Architectural Evolution & Stabilization Protocol (v1.0.0-frozen)

This document establishes the official and permanent work protocol for OnePixel Studio. From this point forward, the support architecture, QA framework, diagnostics, and guardrails are declared stable and frozen. The sole objective of development is to implement creative and functional features following the **Master Plan**.

---

## 1. Absolute Infrastructure Freeze

The QA Framework, Guardrails, stabilization infrastructure, public APIs, ADR registry, and certification systems are officially **frozen**.

### Prohibited Extensions
Unless a demonstrable, objective issue arises, **DO NOT ADD**:
- New QA panels or visual diagnostics.
- New telemetry metrics or tracking layers.
- New architectural abstractions or utility wrappers.
- New preventive refactorings or generalized cleanup tasks.

*Reasoning: Overengineering introduces silent technical debt and diverts energy from core product value. The architecture exists to support the editor, not as a standalone product.*

---

## 2. Evidence-Based Architecture (EBA)

All future modifications to the core architecture must adhere strictly to the following evidence-based protocol:

```
[Detect Real Issue] ──> [Reproduce & Isolate] ──> [Root Cause Analysis] ──> [Minimal Targeted Fix] ──> [Comprehensive Verification (Lint/Build/Tests)] ──> [Re-certify Subsystem]
```

1. **Detect a Real Problem**: The issue must be backed by concrete data, console exceptions, measurable rendering lag, or reproducible user regressions.
2. **Reproduce & Isolate**: Create a reliable, repeatable sequence that triggers the bug or performance degradation.
3. **Root Cause Analysis (RCA)**: Pinpoint the exact module or coordinate boundary causing the issue.
4. **Minimal Targeted Fix**: Correct **only** the affected code. Never implement broad, preventative refactorings "just in case" (*"por si acaso"*).
5. **Continuous Verification**: Execute the full verification suite:
   - `npm run lint` / Guardrails Validator.
   - `npm run build`.
   - Automatic unit/integration tests (`npm run test`).
   - Manual verification on target platforms.
   - High-load stress tests (when appropriate).
6. **Re-certify Subsystem**: Update the subsystem status and proceed with standard functional phase development.

---

## 3. Continuous Phase Validation & Regressions Guard

Before launching any new development phase:
- **Inspect Past Deliverables**: Verify that all previously certified phases remain fully functional.
- **Run Target Tests**: Run tests focused specifically on the modules being modified or integrated.
- **Stop on Regression**: If any existing capability breaks, **stop feature work immediately**. Regressions must be solved and certified before any new feature code is allowed into the main line. *Never accumulate bugs to be resolved at the end of a project.*

---

## 4. Incremental Certification Pipeline

Each phase of the Master Plan must flow sequentially through these exact stages. No phase may begin until the prior phase is 100% certified.

```
[Phase Implementation]
          │
          ▼
[System Integration]
          │
          ▼
[Bug Remediation & Polish]
          │
          ▼
[Automated Test Verification]
          │
          ▼
[Manual UX & Touch Target Audit]
          │
          ▼
[Stress & Boundary Tests (if applicable)]
          │
          ▼
[QA Panel & Invariants Certification]
          │
          ▼
[Phase Freeze & Master Plan Rollout]
```

---

## 5. Architectural Protection via Guardrails

- The **Guardrails Validator** runs automatically as a blocking step in the linting process (`npm run lint` / `npm run build`).
- **Zero Tolerance for Relaxation**: Guardrail rules must **never** be relaxed or commented out to accommodate new feature code. If a guardrail fails, the code must be corrected to conform to the architectural boundary, with no exceptions.
