
## 2026-10-20 - [Fix] Remove DOM XSS from generated browser extension code
**Vulnerability:** Found a DOM-based Cross-Site Scripting (XSS) vulnerability in `src/components/ExtensionExportView.tsx`. The template string used to export `browser.js` contained insecure DOM manipulation via `innerHTML` where an untrusted variable `tab.title` was concatenated directly.
**Learning:** Even generated code in an export or template needs strict DOM-based XSS protections. Vulnerabilities can be shipped to users via exported extensions if string concatenation is used to build DOM elements from potentially unsafe input.
**Prevention:** Instead of generating JS code that uses `innerHTML` with string concatenation, the template must use secure DOM creation methods (like `document.createElement` and `.textContent`) when handling any user input, such as `tab.title`.
