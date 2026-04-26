## 2024-05-18 - Missing ARIA Labels and Focus Rings on Glassmorphic Icon Buttons
**Learning:** Glassmorphic UI components using text-less Lucide icons often strip default browser focus outlines, leading to poor keyboard accessibility, and lack readable names for screen readers.
**Action:** Always explicitly add `aria-label` attributes and `focus-visible:ring-2` (with appropriate coloring, e.g., `focus-visible:ring-indigo-500 rounded outline-none`) to icon-only buttons to ensure they are fully accessible for both keyboard and screen reader users.
