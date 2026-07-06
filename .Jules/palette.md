## 2024-05-20 - Icon Accessibility in Glassmorphic UIs
**Learning:** Icon-only buttons using Lucide icons within glassmorphic UI patterns lack semantic meaning for screen readers and distinct keyboard focus indicators, rendering them inaccessible to users relying on assistive technologies or keyboard navigation.
**Action:** Always add descriptive `aria-label` attributes and explicit focus utility classes (`focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) to interactive elements containing only icons.
