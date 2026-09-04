## 2024-09-04 - Accessible Custom Toggle Switches
**Learning:** Custom UI switches (like generic buttons manipulating CSS background positioning for visual toggle states) are common in this app but lack semantic HTML properties to communicate their purpose to screen readers and keyboard users.
**Action:** Always add `role="switch"`, `aria-checked`, and robust focus indicators (`focus-visible` ring utilities) to custom toggle buttons to ensure keyboard and assistive technology accessibility.
