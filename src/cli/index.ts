import * as ledger from "../ledger/index.js";
import {
  promptForFields,
  buildTransaction,
} from "../transactions/credentialAccept.js";

async function main() {
  console.log("=== Ledger XRP CLI ===\n");

  try {
    console.log("Connecting to Ledger device...");
    await ledger.connect();

    const { address, publicKey } = await ledger.getAddress();
    console.log(`\nYour XRP address: ${address}`);
    console.log(`Public key: ${publicKey}\n`);

    console.log("--- CredentialAccept Transaction ---\n");
    const fields = await promptForFields();
    const tx = buildTransaction(address, fields);

    console.log("\nBuilt transaction:\n");
    console.log(JSON.stringify(tx, null, 2));
  } catch (error) {
    console.error("\nError:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await ledger.disconnect();
  }
}

main();
