## 2024-12-11 - Toggle Switch Accessibility
**Learning:** Reusable components like ToggleSwitch often lack necessary accessibility attributes (role, aria-checked, aria-label) preventing screen readers from understanding their state or purpose.
**Action:** Adding `role="switch"`, `aria-checked`, and an optional `ariaLabel` prop with sensible defaults improves a11y for custom toggles without breaking existing implementations.
