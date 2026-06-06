## 2024-08-16 - Add ARIA labels to Icon-Only Buttons
**Learning:** Found multiple icon-only interactive buttons without explicit labels, which hinders accessibility. Added `aria-label` attributes and keyboard focus indicator classes specific to this app's components (`focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`).
**Action:** Always ensure any interactive elements (like `<button>`) that contain only icons must include explicit `aria-label` attributes for screen readers and explicit `focus-visible` utility classes for keyboard accessibility.
