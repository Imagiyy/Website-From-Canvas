# Solid product roadmap for this editor

This project has the right core idea, but it is over-scoped for a single front-end prototype. The fastest way to turn it into a solid product is to fix the architecture in layers, starting with the foundational state model and product scope.

## 1) Flaw-by-flaw recursive remediation plan

### 1. State duplication and drift
Problem:
The same editor state is split across pages, nodes, project storage, and localStorage.

Fix:
Create a single canonical editor state model and keep persistence as an adapter around it.

Action plan:
- Keep one source of truth for page data inside the editor store.
- Save to localStorage only as a serialization layer, not as another state model.
- Treat project data and editor state as separate concerns.
- Add a state validation pass before save and on load.

### 2. Over-scoped feature set
Problem:
The app includes CMS, SEO, commerce, auth, deploy, collaboration, and versioning, but some are only UI mocks.

Fix:
Define a solid MVP and intentionally gate the rest behind feature flags.

Action plan:
- MVP: canvas editor, layers, property inspector, project manager, exports, design tokens, and asset usage.
- Phase 2: comments and SEO.
- Phase 3: CMS and commerce.
- Phase 4: collaboration and deployment.

### 3. Fragile undo/redo history
Problem:
History snapshots are broad and expensive, and they are not strongly bounded.

Fix:
Reduce history to the minimal serializable editor state and centralize it.

Action plan:
- Snapshot only page, node graph, selection, and viewport state.
- Batch related actions when editing a single object.
- Add coarse-grained command history for drag operations and fine-grained history for text edits.

### 4. Grouping and nested geometry bugs
Problem:
Child transforms, parent relationships, and orders can become inconsistent.

Fix:
Move grouping into a single model that enforces invariants.

Action plan:
- Keep all nodes in a flat map, but validate parent-child relationships before save.
- Recompute child order whenever a group changes.
- Reject invalid parent relationships and recursive nesting.

### 5. Persistence that is not a real data layer
Problem:
localStorage calls are embedded directly in the store logic.

Fix:
Separate persistence from behavior.

Action plan:
- Create a persistence service with save/load, migration, and error handling.
- Add schema versioning for future compatibility.
- Store only canonical state, not derived UI state.

### 6. UI logic mixed with app logic
Problem:
The canvas pointer logic, keyboard shortcuts, and node editing are tightly coupled to the store and DOM.

Fix:
Split editor behavior into discrete modules.

Action plan:
- Keep store for data and actions only.
- Keep interaction handlers in dedicated editor services.
- Keep DOM access inside the canvas layer.

### 7. Weak auth and collaboration assumptions
Problem:
The project pretends to have real auth and collaboration flows, but currently uses fake UI shells.

Fix:
Use true feature gating and optional demo mode.

Action plan:
- Show auth only when backend is available.
- Keep collaboration behind a demo flag until a reliable backend is added.
- Treat mocked collaboration as marketing, not as product logic.

### 8. Missing quality gates
Problem:
There are no tests or automated checks.

Fix:
Add test coverage around state transitions and editor invariants.

Action plan:
- Add unit tests for node creation, group transforms, paste behavior, and history snapshots.
- Add integration tests for project load/save and page switching.
- Add a CI workflow that runs linting and tests before merge.

### 9. Product scope mismatch
Problem:
The product is trying to be every tool at once.

Fix:
Define the real user value and simplify everything else.

Action plan:
- Focus on a strong single workflow: design a page, adjust properties, save, and export.
- Keep advanced features as optional modules, not essential screens.

### 10. Lack of operational clarity
Problem:
The app is large but is not organized around business flows or user tasks.

Fix:
Create a clear product architecture and team boundaries.

Action plan:
- split responsibilities into editor runtime, data persistence, export pipeline, and feature modules
- define component ownership and service boundaries
- standardize naming and file structure

## 2) Recommended product shape for the next version

### Core product
- page editor
- property inspector
- layer stack
- export to static HTML or React/Tailwind
- project management
- autosave and version history

### Secondary product
- components library
- design tokens
- comments and review
- SEO metadata panel

### Delayed product
- live collaboration
- CMS content models
- e-commerce dashboards
- deployment workflows
- backend auth

## 3) Immediate implementation order

1. Fix state ownership and persistence boundaries.
2. Add feature flags for all non-core modules.
3. Stabilize selection, grouping, and history.
4. Add reliable tests around the core editor actions.
5. Re-introduce advanced panels only when the core is robust.

## 4) Success criteria

A solid product version should be able to do all of the following reliably:
- create a page and edit nodes
- move, resize, group, and order elements
- save and restore a project
- export working code
- handle undo/redo with predictable results
- maintain browser-only reliability without hidden state drift

The app should not claim features it cannot guarantee. The strongest version is a realistic editor that does the essential flow extremely well.
