## 2023-10-24 - Accessibility for icon-only buttons
**Learning:** Found multiple instances of `<button>` elements in the dashboard that contain only icons (e.g. `<button><i data-lucide="..."></i></button>`). These are inaccessible to screen readers.
**Action:** Always add `aria-label` attributes to icon-only buttons. Add focus classes (`focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) for keyboard accessibility.
