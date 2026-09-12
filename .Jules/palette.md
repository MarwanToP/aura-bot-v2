
## 2026-09-12 - Toggle Switch Accessibility
**Learning:** Custom UI toggle elements (like those built with div/button in React) are frequently implemented without the 'switch' ARIA role and fail to provide 'aria-checked' state or clear 'aria-label's for screen readers. They also often lack focus-visible styles for keyboard navigation, making them difficult to use without a mouse.
**Action:** When creating or reviewing custom toggle switches, always ensure they use '<button type="button">', have 'role="switch"', explicitly pass 'aria-checked={enabled}', provide an 'aria-label', and include clear keyboard focus indicators (e.g., 'focus-visible:ring-2').
