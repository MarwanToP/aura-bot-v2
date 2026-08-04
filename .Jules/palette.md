## 2024-10-24 - Accessible Toggle Switches
**Learning:** Custom toggle switches built with `button` elements often lack semantic meaning and focus states. Using `role="switch"` along with `aria-checked` properly conveys the component's state to screen readers. Adding `focus-visible:ring-2` ensures keyboard users can easily track their focus position.
**Action:** Always add `role="switch"`, `aria-checked`, `aria-label`, and `focus-visible` styles to custom toggle switches and icon-only buttons across the design system.
