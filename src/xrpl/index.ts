import { Client, encode } from "xrpl";
import type { SubmittableTransaction, TxResponse } from "xrpl";

const MAINNET_URL = "wss://xrplcluster.com";

let client: Client | null = null;

export async function connect(): Promise<void> {
  client = new Client(MAINNET_URL);
  await client.connect();
  console.log("Connected to XRP Ledger mainnet.");
}

export async function autofill(tx: SubmittableTransaction): Promise<SubmittableTransaction> {
  if (!client) {
    throw new Error("XRPL client not connected. Call connect() first.");
  }
  return client.autofill(tx);
}

export function serialize(tx: SubmittableTransaction): string {
  return encode(tx);
}

export function insertSignature(
  tx: SubmittableTransaction,
  signature: string,
  publicKey: string,
): string {
  const signedTx = {
    ...tx,
    TxnSignature: signature,
    SigningPubKey: publicKey,
  };
  return encode(signedTx);
}

export async function submit(signedBlob: string): Promise<TxResponse> {
  if (!client) {
    throw new Error("XRPL client not connected. Call connect() first.");
  }
  return client.submitAndWait(signedBlob);
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
