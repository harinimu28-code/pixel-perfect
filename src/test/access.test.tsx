import { describe, expect, it } from "vitest";
import { canAccess } from "@/lib/access";

describe("role access", () => {
  it("no role can open nothing", () => expect(canAccess(null, "/")).toBe(false));
  it("only admin opens team management", () => {
    expect(canAccess("admin", "/users")).toBe(true);
    expect(canAccess("art_director", "/users")).toBe(false);
  });
  it("department roles cannot open approvals", () => expect(canAccess("lighting", "/approvals")).toBe(false));
  it("art director can open approvals", () => expect(canAccess("art_director", "/approvals")).toBe(true));
});
