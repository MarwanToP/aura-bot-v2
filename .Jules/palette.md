## 2024-05-24 - Accessibility and Focus Indicators for Custom Toggles
**Learning:** Custom UI components like ToggleSwitches often lack fundamental accessibility features such as ARIA roles, checked states, and clear focus indicators, which heavily impact keyboard and screen reader users.
**Action:** When working on generic, interactive custom components, always ensure standard accessibility props (e.g. `aria-label`) and robust keyboard focus indicators (`focus-visible:ring-2`) are present and customizable by default.
