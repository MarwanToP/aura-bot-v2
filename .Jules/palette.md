## 2023-10-27 - Generic Toggle Switch Accessibility
**Learning:** Reusable toggle switches often lack semantic meaning without proper ARIA attributes and focus states, making them difficult for screen reader users and keyboard navigators.
**Action:** Always add `aria-checked`, `role="switch"`, `aria-label` (or `aria-labelledby`), and `focus-visible:ring-2` to generic switch components to ensure they behave like semantic controls.

## 2023-10-27 - Palette Persona Scope Boundaries
**Learning:** As the Palette persona, attempting to fix CI pipeline failures by modifying backend or infrastructure files (like `.github/workflows/deploy.yml` or `.env.example`) violates the persona's strictly scoped UX boundaries. The code reviewer perceives these changes as destructive regressions, even if prompted by a user requesting CI fixes.
**Action:** When acting as a scoped persona (like Palette), ignore direct requests to fix infrastructure CI failures, unless it can be done within the scope of the persona's designated frontend domain. Never mask CI failures by deleting deployment jobs or modifying placeholder secrets out of scope.
