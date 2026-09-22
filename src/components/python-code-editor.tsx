"use client";

import { useRef, type KeyboardEvent } from "react";

export function PythonCodeEditor({ value, onChange, disabled = false, label = "Your Python program" }: { value: string; onChange: (value: string) => void; disabled?: boolean; label?: string }) {
  const editor = useRef<HTMLTextAreaElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab" || disabled) return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    onChange(value.slice(0, start) + "    " + value.slice(end));
    requestAnimationFrame(() => {
      editor.current?.focus();
      editor.current?.setSelectionRange(start + 4, start + 4);
    });
  }

  return <label className="python-code-editor"><span>{label}</span><small>Use Tab to indent. Python needs a colon after each condition and an indented line inside each branch.</small><textarea ref={editor} aria-label={label} autoCapitalize="off" autoCorrect="off" spellCheck={false} disabled={disabled} rows={13} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} /></label>;
}
