
## 2024-05-06 - Accessible Icon-Only Buttons in Custom Components
**Learning:** In complex custom dashboard components like `LogsModule`, pagination and action buttons frequently rely purely on Lucide react icons (e.g., `<ChevronLeft />`, `<ChevronRight />`, `<Trash2 />`) inside generic `<button>` wrappers without any inner text or `aria-label`. This pattern is pervasive across the modules directory.
**Action:** Always verify custom component icon buttons across the dashboard and inject precise, descriptive `aria-label` attributes to ensure they are discernible to assistive technologies without breaking visual layouts.
