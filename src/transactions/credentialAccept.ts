import { input } from "@inquirer/prompts";
import { convertStringToHex, GlobalFlags, isValidClassicAddress } from "xrpl";
import type { CredentialAccept } from "xrpl";

export function validateIssuer(value: string): true | string {
  if (!isValidClassicAddress(value)) {
    return "Invalid XRP address. Please enter a valid classic address (e.g. rXXX...).";
  }
  return true;
}

export function validateCredentialType(value: string): true | string {
  if (value.length === 0) {
    return "CredentialType cannot be empty.";
  }
  const byteLength = Buffer.byteLength(value, "utf8");
  if (byteLength > 64) {
    return `CredentialType must be 1-64 bytes (got ${byteLength} bytes).`;
  }
  return true;
}

export async function promptForFields(): Promise<{
  issuer: string;
  credentialType: string;
}> {
  const issuer = await input({
    message: "Issuer (XRP address of the credential issuer):",
    validate: validateIssuer,
  });

  const credentialType = await input({
    message: "CredentialType (1-64 bytes):",
    validate: validateCredentialType,
  });

  return { issuer, credentialType };
}

export function buildTransaction(
  account: string,
  publicKey: string,
  fields: { issuer: string; credentialType: string },
): CredentialAccept {
  return {
    TransactionType: "CredentialAccept",
    Flags: 2147483648,
    Account: account,
    Issuer: fields.issuer,
    CredentialType: convertStringToHex(fields.credentialType),
    SigningPubKey: publicKey,
  };
}
