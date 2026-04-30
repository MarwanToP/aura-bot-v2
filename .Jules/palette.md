UX/accessibility rules and learnings for Palette

## 2026-04-30 - Added ARIA and focus-visible to icon-only buttons
**Learning:** Found an accessibility pattern where icon-only buttons lacked aria-labels for screen readers and focus-visible classes for keyboard navigation.
**Action:** Apply 'aria-label' and 'focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none' consistently to icon-only interactive elements.
