## 2024-08-28 - Generic Div as Checkboxes are Inaccessible
**Learning:** Found an interactive element acting as a toggle in `CommandSettings.jsx` which was a `<div>` with `onClick` but lacked keyboard support and ARIA semantics.
**Action:** Always convert custom interactive toggles into `<button>` with `role="checkbox"`, `aria-checked`, and `focus-visible` utilities to ensure it's fully accessible and operable via keyboard.
