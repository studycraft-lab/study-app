import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Word2016Lesson } from "./word-2016-lesson";

describe("Word 2016 practice ribbon", () => {
  afterEach(cleanup);
  it("uses Word 2016 contextual Table Tools tabs and requires the first row for repeated headers", () => {
    render(<Word2016Lesson />);
    fireEvent.click(screen.getByRole("tab", { name: "Insert" }));
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.queryByRole("group", { name: "Table Tools" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2 × 2 table" }));

    expect(screen.getByRole("group", { name: "Table Tools" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Table Tools > Design" })).toHaveTextContent("Design");
    expect(screen.getByRole("tab", { name: "Table Tools > Layout" })).toHaveTextContent("Layout");
    expect(screen.queryByRole("tab", { name: "Table Design" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Table Tools > Layout" }));
    fireEvent.click(screen.getByRole("button", { name: "Repeat Header Rows" }));
    expect(screen.queryByText("Header row set to repeat if this table continues onto another page.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select the first table row" }));
    fireEvent.click(screen.getByRole("button", { name: "Repeat Header Rows" }));
    expect(screen.getByText("Header row set to repeat if this table continues onto another page.")).toBeInTheDocument();
  });

  it("uses the Word menus before applying a watermark or continuous line numbers", () => {
    render(<Word2016Lesson />);
    fireEvent.click(screen.getByRole("tab", { name: "Design" }));
    fireEvent.click(screen.getByRole("button", { name: "Watermark" }));
    expect(screen.getByRole("button", { name: "DRAFT watermark" })).toBeInTheDocument();
    expect(screen.queryByText("DRAFT", { selector: "span" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "DRAFT watermark" }));
    expect(screen.getByText("DRAFT", { selector: "span" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Layout" }));
    fireEvent.click(screen.getByRole("button", { name: "Line Numbers" }));
    expect(screen.getByRole("button", { name: "Continuous" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuous" }));
    expect(screen.getByLabelText("Document line numbers")).toBeInTheDocument();
  });

  it("selects the title before applying bold and opens Zoom before setting a percentage", () => {
    render(<Word2016Lesson />);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByText("Select the title before changing its formatting.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Select the title" }));
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByRole("button", { name: "Select the title" }).closest("h2")?.className).toMatch(/bold/);

    fireEvent.click(screen.getByRole("tab", { name: "View" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom" }));
    expect(screen.getByRole("group", { name: "Zoom choices" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "125%" }));
    expect(screen.queryByRole("group", { name: "Zoom choices" })).not.toBeInTheDocument();
  });

  it("opens File as Backstage instead of a Ribbon group", () => {
    render(<Word2016Lesson />);
    fireEvent.click(screen.getByRole("tab", { name: "File" }));
    expect(screen.getByLabelText("File Backstage view")).toBeInTheDocument();
    expect(screen.queryByLabelText("File Ribbon tools")).not.toBeInTheDocument();
  });

  it("shows the Word 2016 Chart Tools group after inserting a chart", () => {
    render(<Word2016Lesson />);
    fireEvent.click(screen.getByRole("tab", { name: "Insert" }));
    fireEvent.click(screen.getByRole("button", { name: "Chart" }));
    expect(screen.queryByRole("group", { name: "Chart Tools" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Column chart" }));
    expect(screen.getByRole("group", { name: "Chart Tools" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Chart Tools > Design" }));
    expect(screen.getByRole("button", { name: "Edit Data" })).toBeInTheDocument();
  });
});
