## 2026-10-02 - Cloudflare Node.js Compatibility Fix
**Learning:** When Cloudflare Workers built with `nodejs_compat` fail to resolve built-in Node modules (like `node:fs` or `node:path`), updating the `compatibility_date` to `2024-09-23` or later automatically resolves these built-ins without requiring the `node:` prefix, fixing the build failure while staying within non-destructive bounds.
**Action:** Always verify and update `compatibility_date` in `wrangler.toml` instead of destructively deleting deployment jobs to fix CI build errors.

## 2023-10-27 - Generic Toggle Switch Accessibility
**Learning:** Reusable toggle switches often lack semantic meaning without proper ARIA attributes and focus states, making them difficult for screen reader users and keyboard navigators.
**Action:** Always add `aria-checked`, `role="switch"`, `aria-label` (or `aria-labelledby`), and `focus-visible:ring-2` to generic switch components to ensure they behave like semantic controls.
