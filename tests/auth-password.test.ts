import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

describe("password hashing (scrypt)", () => {
  it("verifies the password it hashed", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const stored = hashPassword("right");
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("salts: two hashes of the same password differ, both verify", () => {
    const a = hashPassword("same");
    const b = hashPassword("same");
    expect(a).not.toBe(b);
    expect(verifyPassword("same", a)).toBe(true);
    expect(verifyPassword("same", b)).toBe(true);
  });

  it("rejects malformed stored strings without throwing", () => {
    for (const bad of ["", "plaintext", "scrypt$x$y$z", "bcrypt$a$b$c$d$e", "scrypt$0$8$1$AA$BB"]) {
      expect(verifyPassword("anything", bad)).toBe(false);
    }
  });

  it("rejects a tampered hash", () => {
    const stored = hashPassword("secret");
    const parts = stored.split("$");
    const flipped = Buffer.from(parts[5]!, "base64url");
    flipped[0]! ^= 0xff;
    parts[5] = flipped.toString("base64url");
    expect(verifyPassword("secret", parts.join("$"))).toBe(false);
  });
});
