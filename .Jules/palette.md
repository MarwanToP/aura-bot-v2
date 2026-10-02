## 2023-10-27 - Generic Toggle Switch Accessibility
**Learning:** Reusable toggle switches often lack semantic meaning without proper ARIA attributes and focus states, making them difficult for screen reader users and keyboard navigators.
**Action:** Always add `aria-checked`, `role="switch"`, `aria-label` (or `aria-labelledby`), and `focus-visible:ring-2` to generic switch components to ensure they behave like semantic controls.
