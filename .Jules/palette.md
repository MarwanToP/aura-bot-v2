## 2024-07-28 - Icon-Only Button Accessibility
**Learning:** The frontend uses Lucide icons and glassmorphic UI components. Any interactive elements (like `<button>`) that contain only icons lack inherent screen reader context and keyboard navigation visibility.
**Action:** Must always include explicit `aria-label` attributes for screen readers and explicit `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) for keyboard accessibility.
