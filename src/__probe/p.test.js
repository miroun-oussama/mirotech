import { describe, it, expect } from "vitest";
try { describe("p", () => { it("ok", () => { expect(1).toBe(1); }); }); } catch (e) { console.log("STACK", e.stack); }
