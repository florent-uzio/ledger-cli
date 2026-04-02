import { confirm, select } from "@inquirer/prompts";
import * as ledger from "../ledger/index.js";
import * as xrplClient from "../xrpl/index.js";
import type { Network } from "../xrpl/index.js";
import { selectTransactionType } from "../transactions/registry.js";

async function main() {
  console.log("=== Ledger XRP CLI ===\n");

  try {
    // Step 1: Select transaction type
    const txModule = await selectTransactionType();

    // Step 2: Connect to Ledger device
    console.log("\nConnecting to Ledger device...");
    await ledger.connect();

    const { address, publicKey } = await ledger.getAddress();
    console.log(`\nYour XRP address: ${address}`);
    console.log(`Public key: ${publicKey}\n`);

    // Step 3: Select network
    const network = await select<Network>({
      message: "Select network:",
      choices: [
        { name: "Mainnet", value: "mainnet" },
        { name: "Testnet", value: "testnet" },
      ],
    });

    // Step 4: Gather transaction fields and build
    const fields = await txModule.promptForFields();
    const tx = txModule.buildTransaction(address, fields);

    // Step 5: Connect to XRPL and autofill
    console.log(`\nConnecting to XRP Ledger ${network}...`);
    await xrplClient.connect(network);

    const autofilled = await xrplClient.autofill(tx);
    console.log("\nAutofilled transaction:\n");
    console.log(JSON.stringify(autofilled, null, 2));

    // Step 6: Serialize and sign on Ledger
    const serialized = xrplClient.serialize(autofilled);
    console.log(
      "\nPlease review and approve the transaction on your Ledger device...",
    );
    const signature = await ledger.sign(serialized);

    // Step 7: Build signed blob and display
    const signedBlob = xrplClient.insertSignature(
      autofilled,
      signature,
      publicKey,
    );
    console.log("\nSigned transaction blob:\n");
    console.log(signedBlob);

    // Step 8: Confirm before submission
    const shouldSubmit = await confirm({
      message: `Submit this transaction to XRP Ledger ${network}?`,
      default: false,
    });

    if (!shouldSubmit) {
      console.log("\nTransaction cancelled. Nothing was submitted.");
      return;
    }

    // Step 9: Submit and display result
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
    console.log(`Explorer: ${xrplClient.EXPLORER_URLS[network]}${txHash}`);

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
