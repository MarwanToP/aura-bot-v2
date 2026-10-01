## 2026-10-01 - Icon-Only Button Accessibility
**Learning:** Found multiple instances of icon-only buttons (like delete or toggle buttons) in the dashboard settings panels that lacked aria-labels, making them inaccessible to screen readers.
**Action:** Always add aria-labels to buttons that only contain icons, specifically when mapping over lists of settings where delete/toggle actions are common.
