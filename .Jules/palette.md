## 2024-05-15 - ARIA Labels and Focus States for Icon-Only Buttons
**Learning:** Found that the app uses Lucide icons within generic `<button>` tags without text or accessibility attributes. Users relying on screen readers or keyboard navigation would not know what these buttons do or if they are focused.
**Action:** Always ensure that icon-only interactive elements contain `aria-label` providing context and include focus utilities (`focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none`) to improve accessibility.
