import { confirm } from "@inquirer/prompts";
import * as ledger from "../ledger/index.js";
import * as xrplClient from "../xrpl/index.js";
import {
  promptForFields,
  buildTransaction,
} from "../transactions/credentialAccept.js";

const EXPLORER_BASE_URL = "https://livenet.xrpl.org/transactions/";

async function main() {
  console.log("=== Ledger XRP CLI ===\n");

  try {
    // Step 1: Connect to Ledger device
    console.log("Connecting to Ledger device...");
    await ledger.connect();

    const { address, publicKey } = await ledger.getAddress();
    console.log(`\nYour XRP address: ${address}`);
    console.log(`Public key: ${publicKey}\n`);

    // Step 2: Gather transaction fields
    console.log("--- CredentialAccept Transaction ---\n");
    const fields = await promptForFields();
    const tx = buildTransaction(address, fields);

    // Step 3: Connect to XRPL mainnet and autofill
    console.log("\nConnecting to XRP Ledger mainnet...");
    await xrplClient.connect();

    const autofilled = await xrplClient.autofill(tx);
    console.log("\nAutofilled transaction:\n");
    console.log(JSON.stringify(autofilled, null, 2));

    // Step 4: Serialize and sign on Ledger
    const serialized = xrplClient.serialize(autofilled);
    console.log(
      "\nPlease review and approve the transaction on your Ledger device...",
    );
    const signature = await ledger.sign(serialized);

    // Step 5: Build signed blob and display
    const signedBlob = xrplClient.insertSignature(
      autofilled,
      signature,
      publicKey,
    );
    console.log("\nSigned transaction blob:\n");
    console.log(signedBlob);

    // Step 6: Confirm before submission
    const shouldSubmit = await confirm({
      message: "Submit this transaction to XRP Ledger mainnet?",
      default: false,
    });

    if (!shouldSubmit) {
      console.log("\nTransaction cancelled. Nothing was submitted.");
      return;
    }

    // Step 7: Submit and display result
    console.log("\nSubmitting transaction...");
    const result = await xrplClient.submit(signedBlob);

    const txResult =
      result.result.meta && typeof result.result.meta === "object"
        ? (result.result.meta as { TransactionResult: string })
            .TransactionResult
        : "unknown";
    const txHash = result.result.hash;

    console.log(`\nResult: ${txResult}`);
    console.log(`Transaction hash: ${txHash}`);
    console.log(`Explorer: ${EXPLORER_BASE_URL}${txHash}`);

    if (txResult !== "tesSUCCESS") {
      console.error(`\nTransaction failed with result: ${txResult}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("\nError:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await xrplClient.disconnect();
    await ledger.disconnect();
  }
}

main();
