## 2026-09-29 - Reusable Component Accessibility
**Learning:** Reusable interactive components like generic toggle switches often lack necessary ARIA roles (`role="switch"`) and states (`aria-checked`) from the start, breaking accessibility for every implementation instance.
**Action:** When auditing custom interactive components, always ensure they accept optional `aria-label` props and manage their ARIA states internally to guarantee accessibility wherever they are used.
