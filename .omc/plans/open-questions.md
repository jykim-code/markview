# Open Questions

## markview-chrome-extension - 2026-03-31

- [ ] **CORS on upload API:** Does `POST /api/upload` on markview.kr allow cross-origin requests from `chrome-extension://` origins? If not, the Share feature will need a CORS header update on the server side. -- Blocks Share feature in Step 4
- [ ] **Content Security Policy for Mermaid:** Mermaid uses `eval()`-like patterns internally. The extension manifest CSP may need `unsafe-eval` in `content_security_policy.extension_pages`, or Mermaid may need a CSP-safe build. -- Could block Mermaid rendering in Step 3
- [ ] **Chrome Web Store developer account:** Is there an existing Chrome Web Store developer account for Markview, or does one need to be created ($5 one-time fee)? -- Needed for Step 5 submission
- [ ] **Share API authentication:** The current upload API has no auth. Should the extension share endpoint have any rate limiting or API key mechanism to prevent abuse? -- Design decision for Step 4
- [ ] **Icon assets:** The existing `markview_icon.png` needs to be resized to 16/32/48/128px variants. Should these be generated programmatically during build or created as static assets? -- Minor decision for Step 5
- [ ] **KaTeX CSS bundling strategy:** KaTeX CSS includes font references. Fonts need to be bundled in the extension or the CSS paths need rewriting. Verify `katex.min.css` font paths resolve correctly when copied into extension. -- Could affect math rendering in Step 3
