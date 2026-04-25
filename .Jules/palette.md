## 2025-04-25 - Icon-only buttons lack ARIA labels
**Learning:** Found multiple instances of icon-only buttons (e.g. search, bell, settings, theme palette, media attachments) missing `aria-label` attributes across the dashboard frontend (`website/public/index.html`), making them inaccessible to screen readers.
**Action:** Added semantic `aria-label`s to all `<button>` tags that rely solely on `data-lucide` icons to describe their action to assistive technologies.
