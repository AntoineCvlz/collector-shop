import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("concatène des classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignore les valeurs falsy (conditions)", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("dédoublonne les classes Tailwind en conflit (twMerge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
