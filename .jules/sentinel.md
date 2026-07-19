## 2024-07-25 - Prevent Bias in Random Selection (Giveaways)
**Vulnerability:** Used `Array.prototype.sort(() => Math.random() - 0.5)` to shuffle arrays.
**Learning:** `Math.random() - 0.5` sorting is not cryptographically secure and results in biased shuffling depending on the V8 engine's sorting algorithm implementation. It gives unequal probability for elements to be selected.
**Prevention:** Strictly use a cryptographically secure Fisher-Yates shuffle with Node's `crypto.randomInt` for shuffling arrays or random selections.
