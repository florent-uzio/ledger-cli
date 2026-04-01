# Plan: Ledger CLI for XRP CredentialAccept Transactions

> Source PRD: PRD.md

## Architectural decisions

Durable decisions that apply across all phases:

- **Module structure**: Four modules — `ledger/`, `transactions/`, `xrpl/`, `cli/`
- **Ledger interface**: `connect()`, `getAddress()`, `sign(blob)`, `disconnect()`
- **XRPL interface**: `connect()`, `autofill(tx)`, `submit(signedBlob)`, `disconnect()`
- **Transaction module interface**: Each transaction type exports a prompt function and a build function, registered in a transaction registry
- **Derivation path**: `44'/144'/0'/0/0` (standard XRP)
- **Network**: Mainnet only (`wss://xrplcluster.com` or similar)
- **Tech stack**: TypeScript ESM, `@inquirer/prompts`, `xrpl` SDK, `@ledgerhq/hw-app-xrp`, `@ledgerhq/device-transport-kit-node-hid`, Vitest
- **Serialization**: Use `xrpl` SDK's built-in binary codec (no separate `ripple-binary-codec` dependency)

---

## Phase 1: Ledger Connection & Address Retrieval

**User stories**: 2, 3, 4

### What to build

A minimal CLI that connects to a Ledger Nano device over USB HID, retrying with user-friendly messages if the device is not connected or the XRP app is not open. Once connected, it derives the user's XRP address from the device's public key using the standard derivation path and displays it. This is the first end-to-end proof that the Ledger communication layer works.

### Acceptance criteria

- [ ] CLI launches and attempts to connect to a Ledger device
- [ ] If no device is found or XRP app is not open, the CLI waits and retries with a clear message
- [ ] Once connected, the XRP address is derived from the device and displayed to the user
- [ ] The user can see their XRP address without manually entering it

---

## Phase 2: CredentialAccept Transaction Building & Validation

**User stories**: 1, 5, 11, 12

### What to build

After retrieving the address from the Ledger, the CLI prompts the user for the two CredentialAccept-specific fields: Issuer (validated as a valid XRP address) and CredentialType (validated as 1–64 bytes). The CLI then builds a complete CredentialAccept transaction object with TransactionType auto-set and Account populated from the Ledger-derived address. The built transaction is displayed to the user for review.

### Acceptance criteria

- [ ] CLI prompts for Issuer and validates it as a valid XRP address, rejecting invalid input with a clear error
- [ ] CLI prompts for CredentialType and validates it is 1–64 bytes, rejecting invalid input with a clear error
- [ ] TransactionType is automatically set to "CredentialAccept"
- [ ] Account is populated from the Ledger-derived address (Phase 1)
- [ ] The fully built transaction object (minus network fields) is displayed to the user

---

## Phase 3: Autofill, Sign, Submit End-to-End

**User stories**: 6, 7, 8, 9, 10

### What to build

The complete signing and submission flow. After the transaction is built, the CLI connects to mainnet via the xrpl SDK, autofills Fee, Sequence, LastLedgerSequence, and NetworkID. It serializes the transaction to binary, sends it to the Ledger device for signing, and the user approves on the physical device. The CLI displays the signed blob and asks for final confirmation before submitting to mainnet. After submission, it displays the result code (e.g. tesSUCCESS), transaction hash, and a link to `livenet.xrpl.org`.

### Acceptance criteria

- [ ] CLI connects to XRP Ledger mainnet and autofills Fee, Sequence, LastLedgerSequence, and NetworkID
- [ ] The fully autofilled transaction is displayed before signing
- [ ] Transaction is serialized and sent to the Ledger device for signing
- [ ] User approves the transaction on the Ledger device's physical buttons
- [ ] Signed blob is displayed and user is prompted for confirmation before submission
- [ ] After submission, the result code, transaction hash, and explorer link are displayed
- [ ] Clear error messages are shown if the transaction fails (e.g. credential doesn't exist, already accepted, expired)

---

## Phase 4: Transaction Type Selection & Extensibility

**User stories**: 13, 14, 15, 16

### What to build

Add a transaction type selector at CLI launch so the user can choose which transaction type to build. Refactor CredentialAccept into the registry pattern so that each transaction type is a self-contained module. The ledger and xrpl modules expose clean interfaces so transaction modules don't need to know about USB transport or WebSocket details. Adding a new transaction type requires only creating a new module and registering it — no changes to ledger, xrpl, or cli orchestration code.

### Acceptance criteria

- [ ] CLI presents a transaction type selector at launch
- [ ] CredentialAccept is available as a selectable option
- [ ] Transaction types are registered in a central registry
- [ ] Adding a new transaction type requires only a new module file and a registry entry
- [ ] Ledger module exposes a clean interface (connect, getAddress, sign, disconnect) with no transport details leaking
- [ ] XRPL module exposes a clean interface (connect, autofill, submit, disconnect) with no WebSocket details leaking

---

## Phase 5: Tests

**User stories**: (supports all user stories via quality assurance)

### What to build

Set up Vitest and write tests for transaction building and input validation. Given specific user inputs (Issuer, CredentialType), verify the produced transaction object has the correct structure and field values. Verify that invalid XRP addresses are rejected, CredentialType values outside 1–64 bytes are rejected, and valid inputs are accepted. Ledger communication and network submission are not tested (require hardware/live network).

### Acceptance criteria

- [ ] Vitest is configured and runnable via `npm test`
- [ ] Transaction building tests: given valid inputs, the output transaction has correct TransactionType, Account, Issuer, and CredentialType
- [ ] Validation tests: invalid XRP addresses are rejected
- [ ] Validation tests: CredentialType outside 1–64 bytes is rejected
- [ ] Validation tests: valid inputs are accepted
- [ ] No tests require a physical Ledger device or live network connection
