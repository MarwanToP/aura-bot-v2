## 2024-09-26 - Accessible Reusable Toggle Switch
**Learning:** Found a custom ToggleSwitch component (`apps/dashboard/src/components/ToggleSwitch.jsx`) that uses a `<button>` but lacks `aria-pressed` and `aria-label` attributes, making it completely opaque to screen readers.
**Action:** Adding `aria-pressed` based on the `enabled` state and an optional `ariaLabel` prop. Added `focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cosmic-bg` for keyboard accessibility.
