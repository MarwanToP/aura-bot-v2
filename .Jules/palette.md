## 2024-05-18 - Accessibility on Icon-Only Buttons
**Learning:** Found that many interactive icon-only buttons in the dashboard lack `aria-label` and `focus-visible` utility classes, reducing keyboard and screen-reader accessibility.
**Action:** Add `aria-label` and `focus-visible` classes (e.g. `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) to icon-only interactive elements like settings or palette selectors to ensure compliance with a11y standards.
