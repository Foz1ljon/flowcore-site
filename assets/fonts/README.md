# Local fonts

Downloaded from the Google Fonts CSS API, with the Latin subset including Uzbek
apostrophes, punctuation and currency symbols. Both families use the SIL Open Font
License; the original licenses are included in this directory.

- Bricolage Grotesque v9: optical size 96, width 82, variable weights 500–800.
- Onest v11: variable weights 400–700.

Only these two font files are loaded by pages. Body, heading and logo text retain
local font files; small code-like labels and handwritten examples use system fonts.
`font-display: optional` leaves readable fallback text visible when a font is slow.
The critical files are preloaded and reused from the browser cache. When changing
font files, use new versioned filenames and update both preload and CSS references.

Sources: https://fonts.google.com/specimen/Bricolage+Grotesque and
https://fonts.google.com/specimen/Onest.
