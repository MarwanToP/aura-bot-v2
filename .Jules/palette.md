## 2026-09-30 - Added Accessible Switch Role and Focus States

**Learning:** Custom toggle switch components must explicitly provide screen reader semantics (`role="switch"`, `aria-checked`, `aria-label`) and keyboard focus visual feedback (`focus-visible:ring-2`) since generic buttons lack these traits natively.

**Action:** Ensure any custom interactive UI components have the necessary ARIA attributes and focus styles mapping to their visual state and behavior.
