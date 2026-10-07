## 2026-10-06 - Accessible Generic Switches
**Learning:** Custom UI switches built with `div` or generic `button` elements lack inherent screen reader context and keyboard navigability compared to native `<input type="checkbox">`.
**Action:** Always add `role="switch"`, `aria-checked`, a configurable `aria-label`, and explicit `:focus-visible` or `focus:ring` states to custom toggle components to ensure they behave semantically and are perceivable to assistive technologies.
