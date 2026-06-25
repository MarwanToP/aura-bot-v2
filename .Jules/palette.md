## 2024-03-24 - Accessibility improvements for icon-only buttons
**Learning:** Found multiple icon-only buttons in the web dashboard missing ARIA labels and focus states. This makes navigation difficult for screen readers and keyboard users.
**Action:** When adding new icon buttons (especially using lucide icons), ensure `aria-label` is set and add `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to the class list.
