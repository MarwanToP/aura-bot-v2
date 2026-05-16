
## 2024-05-16 - Icon-Only Button Accessibility
**Learning:** Found that many interactive elements (like the sidebar collapse, chat preview toolbar, and dashboard header tools) rely solely on Lucide icons for visual meaning without providing accessible names for screen readers, or proper focus indicators for keyboard users.
**Action:** Always verify `<button>` elements containing only `<i>` tags receive both an explicit `aria-label` describing their function and `focus-visible` utility classes (e.g. `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) to ensure WCAG compliance.
