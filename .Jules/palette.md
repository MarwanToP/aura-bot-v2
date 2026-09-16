## 2026-09-16 - Missing ARIA roles on custom toggles
**Learning:** Found a pattern where custom toggle components (like `ToggleSwitch.jsx`) lack `role="switch"`, `aria-checked`, and keyboard focus states, hindering screen reader and keyboard accessibility.
**Action:** Ensure all interactive elements acting as toggles have proper ARIA switch roles and focus-visible classes applied.
