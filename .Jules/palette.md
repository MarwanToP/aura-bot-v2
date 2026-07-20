## UX/Accessibility Guidelines for Aura
## 2024-05-19 - ARIA Labels for Icon-Only Buttons
**Learning:** The dashboard has a variety of buttons with only Lucide icons and no inner text. These are inaccessible to screen readers as they lack `aria-label` attributes.
**Action:** Update buttons in `website/public/index.html` that only contain an icon to include an appropriate `aria-label`. We also need to add keyboard focus visibility classes (`focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) as established by the guidelines.
