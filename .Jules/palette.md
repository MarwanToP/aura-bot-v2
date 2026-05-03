## 2024-05-24 - Missing ARIA labels and focus states on icon-only buttons
**Learning:** The Aura dashboard heavily relies on glassmorphic design and uses numerous Lucide icon-only buttons (like search, settings, notifications). These were completely inaccessible to screen readers and lacked keyboard focus states, breaking accessibility norms.
**Action:** Applied `aria-label` and `focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none` to primary icon-only interactive elements to ensure they are perceivable and operable by all users.
