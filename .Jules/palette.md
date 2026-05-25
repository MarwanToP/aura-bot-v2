## 2025-02-24 - Accessible Icon-Only Buttons
**Learning:** Icon-only header buttons (like search, bell, settings, and logout) require explicit `aria-label`s for screen readers and `focus-visible` utility classes for keyboard accessibility.
**Action:** When creating or updating interactive elements containing only icons, ensure they have `aria-label`s and focus states (`focus-visible:ring-2 focus-visible:ring-[color] rounded outline-none`).
