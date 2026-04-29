## 2024-05-24 - Accessible Icon-Only Buttons
**Learning:** Icon-only buttons often lack context for screen readers and miss clear focus states for keyboard users, making them difficult to use.
**Action:** Apply `aria-label` attributes to describe the button's action and add `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to ensure keyboard navigation accessibility without breaking the visual aesthetics of the UI.
