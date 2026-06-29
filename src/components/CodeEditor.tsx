"use client";

import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Chrome of the editor follows Markview's theme tokens so it matches both light
// and dark modes; syntax token colors come from CodeMirror's default highlight.
const markviewTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-navy)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
    padding: "16px 0",
  },
  ".cm-gutters": {
    backgroundColor: "var(--color-bg)",
    color: "color-mix(in srgb, var(--color-navy) 35%, transparent)",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--color-navy) 3%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in srgb, var(--color-navy) 4%, transparent)",
  },
  ".cm-cursor": { borderLeftColor: "var(--color-navy)" },
});

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      style={{ height: "100%" }}
      theme={markviewTheme}
      extensions={[html(), EditorView.lineWrapping]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
    />
  );
}
