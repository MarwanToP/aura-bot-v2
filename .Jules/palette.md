## 2024-11-20 - [Header Button Accessibility]
**Learning:** Found header icon buttons for search, notifications, and settings missing ARIA labels and focus-visible states, making them inaccessible for keyboard and screen reader users. Added ARIA labels and `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to improve keyboard navigation and accessibility.
**Action:** Always add ARIA labels and focus visible utility classes for all icon-only buttons.
