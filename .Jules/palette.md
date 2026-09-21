## 2026-09-21 - ToggleSwitch Accessibility

**Learning:** Discovered that the reusable `ToggleSwitch` component in the dashboard lacked essential accessibility attributes (`role="switch"`, `aria-checked`, `aria-label`) and visible focus states, meaning all settings toggles in the app were inaccessible to screen readers and keyboard users.
**Action:** Implemented the ARIA attributes and a visible focus ring using existing Tailwind colors (`focus-visible:ring-purple-500`). For future reusable components, always ensure an `ariaLabel` prop is included and passed down to interactive elements.
