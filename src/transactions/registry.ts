import { select } from "@inquirer/prompts";
import type { SubmittableTransaction } from "xrpl";
import * as credentialAccept from "./credentialAccept.js";

export interface TransactionModule {
  promptForFields(): Promise<Record<string, unknown>>;
  buildTransaction(
    account: string,
    fields: Record<string, unknown>,
  ): SubmittableTransaction;
}

const registry: Record<string, TransactionModule> = {
  CredentialAccept: credentialAccept as TransactionModule,
};

export async function selectTransactionType(): Promise<TransactionModule> {
  const types = Object.keys(registry);

  if (types.length === 1) {
    return registry[types[0]];
  }

  const selected = await select({
    message: "Select transaction type:",
    choices: types.map((name) => ({ name, value: name })),
  });

  return registry[selected];
}
