## 2024-07-25 - Added ARIA labels and focus states to dashboard icons
**Learning:** Icon-only buttons (like those using Lucide icons) throughout the app lacked both screen reader accessible text (aria-label) and visual indicators for keyboard navigation (focus states).
**Action:** Always include explicit `aria-label` attributes for screen readers and explicit `focus-visible` utility classes (e.g., `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) for keyboard accessibility to all interactive elements containing only icons.
