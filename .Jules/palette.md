## 2026-10-12 - ToggleSwitch Accessibility

**Learning:** When improving the accessibility of generic switch components (like `ToggleSwitch`), it's critical to implement `aria-label` as an optional prop with a sensible default value rather than hardcoding a string. This ensures the component remains flexible and reusable across different contexts while guaranteeing baseline accessibility.

**Action:** Always expose accessibility attributes like `aria-label` or `aria-labelledby` as configurable props with fallback defaults when building generic UI components.
