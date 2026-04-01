import { describe, it, expect } from "vitest";
import {
  validateIssuer,
  validateCredentialType,
  buildTransaction,
} from "./credentialAccept.js";
import { convertStringToHex } from "xrpl";

const VALID_ADDRESS = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
const VALID_ACCOUNT = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";

describe("validateIssuer", () => {
  it("accepts a valid classic address", () => {
    expect(validateIssuer(VALID_ADDRESS)).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(validateIssuer("")).toBeTypeOf("string");
  });

  it("rejects a random string", () => {
    expect(validateIssuer("not-an-address")).toBeTypeOf("string");
  });

  it("rejects an address with invalid characters", () => {
    expect(validateIssuer("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyT0")).toBeTypeOf(
      "string",
    );
  });

  it("rejects an address that is too short", () => {
    expect(validateIssuer("rHb9")).toBeTypeOf("string");
  });
});

describe("validateCredentialType", () => {
  it("accepts a single character", () => {
    expect(validateCredentialType("a")).toBe(true);
  });

  it("accepts a 64-byte ASCII string", () => {
    expect(validateCredentialType("a".repeat(64))).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(validateCredentialType("")).toBeTypeOf("string");
  });

  it("rejects a string longer than 64 bytes", () => {
    expect(validateCredentialType("a".repeat(65))).toBeTypeOf("string");
  });

  it("counts multi-byte characters correctly", () => {
    // Each emoji is 4 bytes, so 17 emojis = 68 bytes > 64
    const tooLong = "😀".repeat(17);
    expect(validateCredentialType(tooLong)).toBeTypeOf("string");
  });

  it("accepts multi-byte characters within limit", () => {
    // 16 emojis = 64 bytes, exactly at the limit
    const atLimit = "😀".repeat(16);
    expect(validateCredentialType(atLimit)).toBe(true);
  });
});

describe("buildTransaction", () => {
  it("builds a correct CredentialAccept transaction", () => {
    const fields = { issuer: VALID_ADDRESS, credentialType: "MyCredential" };
    const tx = buildTransaction(VALID_ACCOUNT, fields);

    expect(tx).toEqual({
      TransactionType: "CredentialAccept",
      Account: VALID_ACCOUNT,
      Issuer: VALID_ADDRESS,
      CredentialType: convertStringToHex("MyCredential"),
    });
  });

  it("sets TransactionType to CredentialAccept", () => {
    const tx = buildTransaction(VALID_ACCOUNT, {
      issuer: VALID_ADDRESS,
      credentialType: "test",
    });
    expect(tx.TransactionType).toBe("CredentialAccept");
  });

  it("uses the provided account as Account", () => {
    const tx = buildTransaction(VALID_ACCOUNT, {
      issuer: VALID_ADDRESS,
      credentialType: "test",
    });
    expect(tx.Account).toBe(VALID_ACCOUNT);
  });

  it("hex-encodes the CredentialType", () => {
    const tx = buildTransaction(VALID_ACCOUNT, {
      issuer: VALID_ADDRESS,
      credentialType: "ABC",
    });
    expect(tx.CredentialType).toBe("414243");
  });
});
