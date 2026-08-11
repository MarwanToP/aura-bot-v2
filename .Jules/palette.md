## 2024-08-11 - Accessibility focus states and ARIA labels for icon-only buttons
**Learning:** Found that custom toggle switches and modal close buttons (using lucide-react icons) often lacked `aria-label` attributes and focus visibility styles, making them inaccessible to screen readers and keyboard navigation.
**Action:** Added `aria-label` and `focus-visible:ring-2 focus-visible:ring-purple-500` (or `rose-500`) to interactive icon-only buttons like toggle switches and close/delete buttons in configuration panels (e.g., CommandSettings and TicketSettings).
