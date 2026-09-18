
## 2026-09-18 - Added ARIA attributes to custom Toggle component
**Learning:** Custom generic interactive components like toggle switches (e.g., using a `<button>` tag but visually styled as a switch) need specific ARIA roles (`role="switch"`) and states (`aria-checked`) for screen readers to correctly interpret them, as well as focus states for keyboard navigation.
**Action:** Always ensure that custom generic UI elements include appropriate ARIA roles, ARIA states, and keyboard focus styles (e.g., using `focus-visible:` Tailwind utility classes).
