# Ledger CLI for XRP Transactions

A TypeScript CLI tool that connects to a Ledger Nano hardware wallet to build, sign, and submit XRP Ledger transactions. The Ledger device handles all private key operations — your keys never leave the hardware wallet.

Currently supports **CredentialAccept** transactions, with an extensible architecture for adding more transaction types.

## Prerequisites

- **Node.js** v18 or later
- **Ledger Nano S or Nano X** with the XRP app installed and open
- USB connection to your Ledger device

## Installation

```bash
git clone <repo-url>
cd ledger-cli
npm install
```

## Usage

### Run in development mode (recommended)

```bash
npm run dev
```

### Build and run

```bash
npm run build
npm run start
```

### Run tests

```bash
npm test
```

## How It Works

The CLI walks you through each step interactively:

1. **Select transaction type** — Choose from available transaction types (e.g. CredentialAccept)
2. **Connect to Ledger** — The CLI detects your Ledger device over USB and retries if not found
3. **Derive address** — Your XRP address and public key are read from the device automatically
4. **Select network** — Choose Mainnet or Testnet
5. **Enter transaction fields** — You are prompted for the required fields (e.g. Issuer and CredentialType for CredentialAccept)
6. **Autofill network fields** — Fee, Sequence, LastLedgerSequence, and NetworkID are filled automatically via the XRPL
7. **Review and sign** — The full transaction is displayed, then sent to the Ledger for on-device signing
8. **Confirm and submit** — You review the signed blob and confirm before it is submitted on-chain
9. **View result** — The CLI displays the result code, transaction hash, and an explorer link

## CredentialAccept Fields

| Field                                                | Source                                          |
| ---------------------------------------------------- | ----------------------------------------------- |
| `Issuer`                                             | User-entered (validated as a valid XRP address) |
| `CredentialType`                                     | User-entered (validated as 1–64 bytes)          |
| `TransactionType`                                    | Auto-set to `CredentialAccept`                  |
| `Account`                                            | Derived from Ledger device                      |
| `Fee`, `Sequence`, `LastLedgerSequence`, `NetworkID` | Auto-filled by XRPL                             |

## Project Structure

```
src/
├── cli/            # Entry point and orchestration
├── ledger/         # Ledger device connection, address retrieval, signing
├── transactions/   # Transaction type modules (prompt + build per type)
│   └── registry.ts # Transaction type selector
└── xrpl/           # XRPL network connection, autofill, serialization, submission
```

## Adding a New Transaction Type

1. Create a new file in `src/transactions/` (e.g. `payment.ts`)
2. Export a `promptForFields()` function and a `buildTransaction()` function
3. Register it in `src/transactions/registry.ts`

No changes to the ledger, xrpl, or cli modules are needed.

## Notes

- **CredentialAccept on Ledger**: The Ledger XRP app does not recognize CredentialAccept as a known transaction type. It will display as a raw/unknown transaction on the device — this is expected.
- **Ledger limits**: Nano S supports up to ~800 byte transactions; Nano X supports up to ~10,000 bytes. CredentialAccept is well within both limits.
