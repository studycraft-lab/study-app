import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PythonCodeEditor } from "./python-code-editor";

describe("PythonCodeEditor", () => {
  afterEach(cleanup);
  it("starts with no sample code or placeholder", () => {
    render(<PythonCodeEditor value="" onChange={vi.fn()} />);
    const editor = screen.getByRole("textbox", { name: "Your Python program" });
    expect(editor).toHaveValue("");
    expect(editor).not.toHaveAttribute("placeholder");
  });
  it("inserts four spaces when Tab is pressed", () => {
    const onChange = vi.fn();
    render(<PythonCodeEditor value={'if num > 0:\nprint("Positive")'} onChange={onChange} />);
    const editor = screen.getByRole("textbox", { name: "Your Python program" }) as HTMLTextAreaElement;
    editor.setSelectionRange(12, 12);
    fireEvent.keyDown(editor, { key: "Tab" });
    expect(onChange).toHaveBeenCalledWith('if num > 0:\n    print("Positive")');
  });
});
