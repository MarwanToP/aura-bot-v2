## 2024-09-01 - Accessible Custom Toggles
**Learning:** Custom interactive elements built with `div` or generic `button` tags often miss native accessibility semantics. Specifically, custom toggle switches need `role="switch"` and `aria-checked` to be understood by screen readers, and require explicit `focus-visible` styling (e.g., via Tailwind's `focus-visible:ring-*` classes) to support keyboard navigation.
**Action:** Always verify that interactive custom UI components have appropriate ARIA roles/states and explicitly test keyboard focus states during the verification phase.
