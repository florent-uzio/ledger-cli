import * as ledger from "../ledger/index.js";

async function main() {
  console.log("=== Ledger XRP CLI ===\n");

  try {
    console.log("Connecting to Ledger device...");
    await ledger.connect();

    const { address, publicKey } = await ledger.getAddress();
    console.log(`\nYour XRP address: ${address}`);
    console.log(`Public key: ${publicKey}`);
  } catch (error) {
    console.error(
      "\nError:",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    await ledger.disconnect();
  }
}

main();
