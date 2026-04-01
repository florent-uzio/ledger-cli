# PRD: Ledger CLI for XRP CredentialAccept Transactions

## Problem Statement

There is no simple CLI tool to interact with a Ledger Nano hardware wallet for submitting XRP Ledger transactions. Users who need to accept credentials on the XRP Ledger using their Ledger device must currently rely on manual or fragmented workflows. The client needs a clean, professional-grade CLI that guides users step-by-step through building, signing, and submitting a CredentialAccept transaction — with the Ledger device handling all private key operations securely.

## Solution

A TypeScript Node.js CLI application that connects to a Ledger Nano device over USB, walks the user through entering the required fields for a CredentialAccept transaction, auto-fills network fields via the xrpl SDK, sends the transaction to the Ledger for on-device signing, and submits the signed transaction to the XRP Ledger mainnet. The tool is designed to be extensible so that additional transaction types can be added in the future.

## User Stories

1. As a credential subject, I want to launch the CLI and be prompted for the required CredentialAccept fields (Issuer, CredentialType), so that I don't need to remember the transaction schema.
2. As a credential subject, I want the CLI to automatically detect and connect to my Ledger Nano device, so that I don't need to manually configure USB connections.
3. As a credential subject, I want the CLI to wait and retry if my Ledger device is not connected or the XRP app is not open, so that I can plug in my device at my own pace without the CLI crashing.
4. As a credential subject, I want my Account address to be automatically derived from my Ledger device, so that I don't need to manually look up or enter my XRP address.
5. As a credential subject, I want the TransactionType to be automatically set to CredentialAccept, so that I only need to provide the fields specific to my transaction.
6. As a credential subject, I want the Fee, Sequence, and LastLedgerSequence to be automatically filled by the xrpl SDK, so that I don't need to manually query the network for these values.
7. As a credential subject, I want the CLI to display the fully built transaction and the signed blob before submission, so that I can review and confirm before it goes on-chain.
8. As a credential subject, I want to approve the transaction on my Ledger device's physical buttons, so that my private key never leaves the hardware wallet.
9. As a credential subject, I want to see the transaction result (e.g. tesSUCCESS), the transaction hash, and a link to livenet.xrpl.org after submission, so that I can verify the transaction on-chain.
10. As a credential subject, I want clear error messages if the transaction fails (e.g. credential doesn't exist, already accepted, expired), so that I understand what went wrong.
11. As a credential subject, I want the Issuer field to be validated as a valid XRP address before the transaction is built, so that I catch typos early.
12. As a credential subject, I want the CredentialType field to be validated as 1-64 bytes, so that I don't submit an invalid transaction.
13. As a CLI user, I want to select which transaction type to build when I launch the CLI, so that the tool can support multiple transaction types over time.
14. As a developer maintaining this tool, I want each transaction type to be a self-contained module, so that adding new transaction types does not require modifying existing code.
15. As a developer maintaining this tool, I want the Ledger communication logic to be encapsulated behind a simple interface (connect, getAddress, sign), so that transaction modules don't need to know about USB transport details.
16. As a developer maintaining this tool, I want the xrpl network logic to be encapsulated behind a simple interface (autofill, submit, disconnect), so that transaction modules don't need to manage WebSocket connections.

## Implementation Decisions

### Module Structure

The project will be organized into four major modules:

- **`ledger/`** — Encapsulates all Ledger device interaction. Exposes a simple interface: `connect()`, `getAddress()`, `sign(blob)`, `disconnect()`. Handles USB HID transport via `@ledgerhq/device-transport-kit-node-hid`, retry logic when the device is not connected or the XRP app is not open, and public key retrieval using derivation path `44'/144'/0'/0/0`.

- **`transactions/`** — One module per transaction type. Each module exports: (1) a function to prompt the user for the transaction-specific fields using `@inquirer/prompts`, and (2) a function to build the transaction object from those inputs. `credentialAccept.ts` is the first module. New transaction types are added by creating a new file in this folder and registering it in a transaction registry.

- **`xrpl/`** — Encapsulates all XRP Ledger network interaction. Exposes: `connect()`, `autofill(tx)`, `submit(signedBlob)`, `disconnect()`. Connects to mainnet (`wss://xrplcluster.com` or similar). Uses the `xrpl` SDK's `client.autofill()` to populate Fee, Sequence, LastLedgerSequence, and NetworkID. Uses the `xrpl` SDK's binary codec (via `xrpl` package — no separate `ripple-binary-codec` dependency) for serialization.

- **`cli/`** — The entry point and orchestrator. Flow: connect to Ledger → select transaction type → gather inputs via prompts → build transaction → auto-fill network fields → serialize → sign on Ledger → display signed blob and ask for confirmation → submit → display result with transaction hash and explorer link.

### Tech Stack

- TypeScript with ESM modules
- `@inquirer/prompts` for interactive CLI prompts
- `xrpl` SDK for autofill, serialization (binary codec included), and submission
- `@ledgerhq/hw-app-xrp` and `@ledgerhq/device-transport-kit-node-hid` for Ledger communication
- Vitest for testing

### Network

- Mainnet only (the Ledger device only supports mainnet)

### Ledger Signing Flow

1. Connect to Ledger device via Node HID transport (with retry if not connected)
2. Retrieve public key and derive Account address
3. Build and autofill the transaction
4. Serialize the transaction to binary using the xrpl SDK's binary codec
5. Send the binary blob to the Ledger device for signing
6. User reviews and approves on the device (note: CredentialAccept is not in the Ledger XRP app's recognized types, so it will display as a raw/unknown transaction)
7. Receive signature, insert into transaction blob
8. Display signed blob and prompt user for confirmation
9. Submit to mainnet
10. Display result code, transaction hash, and link to `livenet.xrpl.org`

### CredentialAccept Fields

- **User-entered:** `Issuer` (valid XRP address), `CredentialType` (1-64 bytes)
- **Auto-set:** `TransactionType` ("CredentialAccept"), `Account` (from Ledger device)
- **Auto-filled by xrpl SDK:** `Fee`, `Sequence`, `LastLedgerSequence`, `NetworkID`
- **Optional fields:** Not exposed in the CLI for simplicity

## Testing Decisions

Tests should verify **external behavior**, not implementation details. A good test provides specific inputs and asserts on the outputs or side effects, without coupling to internal function calls or data structures that may change.

### Modules to test

- **Transaction building** — Given specific user inputs (Issuer, CredentialType), assert that the produced transaction object has the correct structure, field values, and TransactionType.
- **Input validation** — Assert that invalid XRP addresses are rejected, CredentialType values outside 1-64 bytes are rejected, and valid inputs are accepted.

### Prior art

This is a greenfield project, so there is no existing test infrastructure. Vitest will be set up as the test runner. Tests will be colocated with their modules or placed in a top-level `tests/` directory, depending on team preference.

### Not tested (by design)

- Ledger device communication (requires physical hardware)
- Network submission (requires live mainnet connection)

## Out of Scope

- Support for transaction types other than CredentialAccept (will be added later as separate modules)
- Optional transaction fields (Memos, SourceTag, Flags, etc.)
- Testnet or devnet support
- Custom Ledger derivation paths
- Multi-signing
- Browser or mobile support (Node.js CLI only)
- Mocked integration tests for Ledger or network flows

## Further Notes

- **CredentialAccept on Ledger:** The Ledger XRP app does not currently list CredentialAccept as a recognized transaction type. The transaction will still be signable, but the device will display it as a raw/unknown transaction rather than showing parsed field names. This is acceptable for the current use case.
- **Extensibility pattern:** When adding a new transaction type, a developer creates a new file in `transactions/`, implements the prompt and build functions following the same interface as `credentialAccept.ts`, and registers it in the transaction type selector. No changes to the ledger, xrpl, or cli modules should be required.
- **Hardware constraints:** Ledger Nano S supports up to 24 fields / 800 byte transactions; Nano X supports up to 60 fields / 10,000 bytes. CredentialAccept is well within both limits.
