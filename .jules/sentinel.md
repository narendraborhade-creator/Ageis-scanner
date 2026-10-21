## 2026-10-21 - [Fix DOM XSS in ExtensionExportView.tsx]
**Vulnerability:** DOM-based XSS via `innerHTML` usage when rendering tab titles in `src/components/ExtensionExportView.tsx`.
**Learning:** The application was dynamically injecting user-controlled data (`tab.title`) into the DOM using `el.innerHTML`, which could execute malicious scripts if the title contained payload tags (e.g., `<script>` or `onload=`).
**Prevention:** Avoid `innerHTML` when rendering untrusted or user-controlled input. Use `textContent` or build DOM elements via `document.createElement` to safely render data as text, neutralizing execution contexts.
