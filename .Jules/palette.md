## 2025-08-04 - GiveawaySettings Accessibility
**Learning:** Giveaway creator form was missing `htmlFor` attributes connecting labels to inputs. The icon-only delete buttons were lacking aria-labels making them inaccessible to screen readers.
**Action:** Always add `aria-label` and `title` to icon-only buttons, as well as `focus-visible` styles. Forms should explicitly associate labels with inputs using `htmlFor` and `id`.
