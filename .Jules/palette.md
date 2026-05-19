## 2024-05-18 - Accessibility on icon buttons
**Learning:** Found multiple icon-only buttons missing `aria-label` and `focus-visible` states, which makes them inaccessible for keyboard users and screen readers.
**Action:** Always add `aria-label` with descriptive text and `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to any icon-only button elements.
