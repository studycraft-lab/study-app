import { expect, it } from "vitest";

import manifest from "./manifest";

it("exposes StudyCraft as an installable standalone web app", () => {
  expect(manifest()).toMatchObject({
    display: "standalone",
    name: "StudyCraft",
    short_name: "StudyCraft",
    start_url: "/",
    theme_color: "#164f45",
  });
  expect(manifest().icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/icon.svg", sizes: "any" }),
    ]),
  );
});
