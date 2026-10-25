"use client";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

const langFor = (f: string) => (f.endsWith(".html") ? html() : f.endsWith(".css") ? css() : f.endsWith(".json") ? json() : javascript());

export default function CodeEditor({ file, value, onChange, revision }: { file: string; value: string; onChange: (v: string) => void; revision: number }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange); cb.current = onChange;
  useEffect(() => {
    view.current = new EditorView({
      parent: host.current!,
      state: EditorState.create({ doc: value, extensions: [basicSetup, langFor(file), EditorView.lineWrapping,
        EditorView.updateListener.of((u) => { if (u.docChanged) cb.current(u.state.doc.toString()); }),
        EditorView.contentAttributes.of({ "aria-label": `Code editor for ${file}` })] }),
    });
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);
  // Only push external changes (undo/redo) into the editor; normal typing flows editor -> state.
  const valRef = useRef(value); valRef.current = value;
  useEffect(() => {
    const v = view.current; if (!v) return;
    const value = valRef.current;
    const cur = v.state.doc.toString();
    if (cur !== value) v.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [revision]);
  return <div ref={host} className="cm-host" />;
}
