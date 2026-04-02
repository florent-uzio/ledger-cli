// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Ledger packages have CJS/ESM interop issues with Node16 resolution
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import Xrp from "@ledgerhq/hw-app-xrp";

const DERIVATION_PATH = "44'/144'/0'/0/0";
const RETRY_INTERVAL_MS = 3000;

let transport: any = null;
let xrpApp: any = null;

export async function connect(): Promise<void> {
  const Transport = (TransportNodeHid as any).default ?? TransportNodeHid;
  const XrpApp = (Xrp as any).default ?? Xrp;

  while (true) {
    try {
      transport = await Transport.open("");
      xrpApp = new XrpApp(transport);
      // Verify the XRP app is open by requesting its configuration
      await xrpApp.getAppConfiguration();
      console.log("Ledger device connected.");
      return;
    } catch (error) {
      if (transport) {
        try {
          await transport.close();
        } catch {
          // ignore close errors
        }
        transport = null;
        xrpApp = null;
      }
      console.log(
        "Ledger device not found or XRP app not open. Retrying in 3 seconds...",
      );
      console.log("Please connect your Ledger and open the XRP app.");
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }
}

export async function getAddress(): Promise<{
  address: string;
  publicKey: string;
}> {
  if (!xrpApp) {
    throw new Error("Ledger not connected. Call connect() first.");
  }
  const { address, publicKey } = await xrpApp.getAddress(DERIVATION_PATH);
  return { address, publicKey };
}

export async function sign(rawTxHex: string): Promise<string> {
  if (!xrpApp) {
    throw new Error("Ledger not connected. Call connect() first.");
  }
  return xrpApp.signTransaction(DERIVATION_PATH, rawTxHex);
}

export async function disconnect(): Promise<void> {
  if (transport) {
    await transport.close();
    transport = null;
    xrpApp = null;
  }
}
