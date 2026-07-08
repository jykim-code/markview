"use client";

import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { selectionNeedles } from "@/lib/editorSync";

export interface CodeController {
  /** Scroll the editor so its scroll position matches ratio (0..1). */
  scrollToRatio: (ratio: number) => void;
  /** Current scroll position of the editor as a ratio (0..1). */
  getScrollRatio: () => number;
  /** Find text in the source and select + reveal it. Returns whether found. */
  selectText: (text: string) => boolean;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "html" | "markdown";
  /** Receives a controller once the editor is ready, for imperative control. */
  onReady?: (controller: CodeController) => void;
  /** Fires on user scroll with the scroll position as a ratio (0..1). */
  onScrollRatio?: (ratio: number) => void;
}

// Chrome follows Markview's theme tokens (light/dark); token colors come from
// CodeMirror's default highlight style.
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
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--color-navy) 18%, transparent)",
  },
  ".cm-cursor": { borderLeftColor: "var(--color-navy)" },
});

export default function CodeEditor({
  value,
  onChange,
  language = "html",
  onReady,
  onScrollRatio,
}: CodeEditorProps) {
  const langExt = language === "markdown" ? markdown() : html();

  function handleCreate(view: EditorView) {
    const controller: CodeController = {
      getScrollRatio() {
        const s = view.scrollDOM;
        const max = s.scrollHeight - s.clientHeight;
        return max > 0 ? s.scrollTop / max : 0;
      },
      scrollToRatio(ratio: number) {
        const s = view.scrollDOM;
        const max = s.scrollHeight - s.clientHeight;
        s.scrollTop = Math.max(0, max * ratio);
      },
      selectText(text: string) {
        const doc = view.state.doc.toString();
        for (const needle of selectionNeedles(text)) {
          const idx = doc.indexOf(needle);
          if (idx >= 0) {
            view.focus();
            view.dispatch({
              selection: { anchor: idx, head: idx + needle.length },
              scrollIntoView: true,
            });
            return true;
          }
        }
        return false;
      },
    };

    if (onScrollRatio) {
      view.scrollDOM.addEventListener(
        "scroll",
        () => onScrollRatio(controller.getScrollRatio()),
        { passive: true }
      );
    }
    onReady?.(controller);
  }

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      style={{ height: "100%" }}
      theme={markviewTheme}
      extensions={[langExt, EditorView.lineWrapping]}
      onCreateEditor={handleCreate}
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
