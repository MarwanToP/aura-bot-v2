## 2024-05-24 - Accessibility for icon-only buttons
**Learning:** Found multiple icon-only buttons missing `aria-label` attributes and keyboard focus states, making them difficult to use for screen reader and keyboard users.
**Action:** Added `aria-label` attributes to clarify button functions and `focus-visible` utility classes (`focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) to improve keyboard navigation visibility.
