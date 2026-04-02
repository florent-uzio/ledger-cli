import { Client, encode } from "xrpl";
import type { SubmittableTransaction, TxResponse } from "xrpl";

export type Network = "mainnet" | "testnet";

const NETWORK_URLS: Record<Network, string> = {
  mainnet: "wss://xrplcluster.com",
  testnet: "wss://s.altnet.rippletest.net:51233",
};

export const EXPLORER_URLS: Record<Network, string> = {
  mainnet: "https://livenet.xrpl.org/transactions/",
  testnet: "https://testnet.xrpl.org/transactions/",
};

let client: Client | null = null;

export async function connect(network: Network): Promise<void> {
  client = new Client(NETWORK_URLS[network]);
  await client.connect();
  console.log(`Connected to XRP Ledger ${network}.`);
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
