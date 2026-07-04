## 2024-07-24 - Add ARIA Labels and Focus States to Icon-Only Buttons
**Learning:** The dashboard uses Lucide icons inside interactive `<button>` elements, but many lack explicit `aria-label` attributes for screen readers and `focus-visible` utility classes for keyboard accessibility.
**Action:** Always add `aria-label` and `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to icon-only buttons to ensure they are accessible via keyboard and screen readers.
