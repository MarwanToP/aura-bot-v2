## 2024-07-26 - Icon-only buttons accessibility
**Learning:** Found multiple icon-only buttons (like header actions) lacking `aria-label` and `focus-visible` states, making them invisible to screen readers and difficult for keyboard users to navigate.
**Action:** Always add explicit `aria-label` and `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to icon-only buttons.
