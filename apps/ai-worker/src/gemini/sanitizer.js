/**
 * Sanitizes user input before passing it to Google Gemini 1.5 Flash
 * to prevent prompt injection vulnerabilities.
 */
export function sanitizePrompt(input) {
  if (typeof input !== 'string') return '';

  // 1. Truncate inputs over 2000 characters
  const truncated = input.trim().slice(0, 2000);

  // 2. Escape XML boundary tags and code fence breaks
  const xmlEscaped = truncated
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```/g, "'''");

  // 3. Wrap input in explicit boundary tag
  return `<user_input>\n${xmlEscaped}\n</user_input>`;
}
