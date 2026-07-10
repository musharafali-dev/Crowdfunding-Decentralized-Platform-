# DeCrowdfund - Decentralized Crowdfunding Platform

DeCrowdfund is a fully functional, premium, trustless decentralized crowdfunding platform. It empowers campaign creators to pitch their projects and raise funds in native cryptocurrency (ETH) directly from contributors, with automated smart contract logic enforcing deadlines and goals, and providing 100% automated refund protection.

---

## 🏗️ Technical Architecture Overview

The application utilizes a decentralized, three-tier architecture:

```
                      ┌──────────────────────────────────────┐
                      │            User Browser              │
                      │      (Next.js App + Tailwind)        │
                      └──────────────────┬───────────────────┘
                                         │
                                   Wallet Signer
                                   (Wagmi / Viem)
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    ┌─────────────────────────┐                     ┌─────────────────────────┐
    │     Smart Contract      │                     │     Pinata IPFS Node    │
    │  (Solidity + Hardhat)   │                     │  (Decentralized Assets) │
    └─────────────────────────┘                     └─────────────────────────┘
```

1. **Smart Contract Layer (Solidity)**: Deployed on the Sepolia testnet, managing campaign data structures, counting campaign states, tracking contributions, locking funds securely, and executing fee distributions.
2. **Frontend Layer (Next.js 14 + Tailwind CSS)**: Next.js App Router providing a premium dark-mode, glassmorphic UI. Integrates **Wagmi** and **RainbowKit** for wallet connection and low-level Viem transactions.
3. **Decentralized Storage Layer (IPFS/Pinata)**: Front-end uploads campaign images directly to Pinata (IPFS), storing the immutable content address hash on-chain in the Campaign struct.

---

## 📜 Smart Contract Documentation (`CrowdfundingPlatform.sol`)

The `CrowdfundingPlatform` contract uses Solidity `^0.8.19` and inherits OpenZeppelin's `ReentrancyGuard` to protect all withdrawal and refund mechanisms from reentrancy exploits.

### State Variables & Configuration
*   `campaignCount`: Private counter tracking the total campaigns created (used as the ID generator).
*   `campaigns`: Public mapping of `uint256` IDs to `Campaign` structs.
*   `campaignContributors`: Public mapping of `uint256` campaign IDs to an array of contributor addresses.
*   `contributions`: Public mapping of `uint256` campaign ID to user address to contribution amount in Wei.
*   `platformOwner`: Address of the platform owner, receiving the dynamic platform fee.
*   `platformFee`: Value in basis points (e.g., `200` = 2.0%) charged on successfully funded campaigns.
*   `MAX_FEE`: Constant set to `1000` (10%) enforcing the maximum platform commission limit.
*   `categories`: List of valid strings representing campaign categories.

### Key Modifiers
*   `onlyCreator(uint256 _campaignId)`: Restricts functions to the campaign creator.
*   `campaignExists(uint256 _campaignId)`: Verifies campaign index exists on-chain.
*   `beforeDeadline(uint256 _campaignId)`: Ensures block.timestamp is before the campaign deadline.
*   `afterDeadline(uint256 _campaignId)`: Allows execution after deadline or if campaign is Cancelled.
*   `onlyOwner()`: Restricts administrative settings to the platform owner.

### Core Write Functions

#### 1. `createCampaign`
```solidity
function createCampaign(
    string memory _title,
    string memory _description,
    uint256 _goal,
    uint256 _durationInDays,
    string memory _imageHash,
    string memory _category
) external payable returns (uint256)
```
Creates a new campaign. If the creator sends ETH (`msg.value > 0`), it automatically processes it as an initial bootstrapping contribution.

#### 2. `contribute`
```solidity
function contribute(uint256 _campaignId) external payable campaignExists(_campaignId) beforeDeadline(_campaignId) nonReentrant
```
Accepts native ETH contributions for active campaigns. Automatically registers new backers and sets funding flags.

#### 3. `withdrawFunds`
```solidity
function withdrawFunds(uint256 _campaignId) external onlyCreator(_campaignId) campaignExists(_campaignId) afterDeadline(_campaignId) nonReentrant
```
Releases funds to the creator if the funding goal was met. Deducts the platform commission (e.g., 2%) and transfers it to the platform owner, then sends the rest to the creator.

#### 4. `claimRefund`
```solidity
function claimRefund(uint256 _campaignId) external campaignExists(_campaignId) afterDeadline(_campaignId) nonReentrant
```
Allows backers to reclaim 100% of their contributions if the campaign fails to reach its goal by the deadline or is cancelled. Employs checks-effects-interactions patterns to clear balances before transferring ETH.

#### 5. `cancelCampaign`
```solidity
function cancelCampaign(uint256 _campaignId) external onlyCreator(_campaignId) campaignExists(_campaignId) beforeDeadline(_campaignId)
```
Enables creators to cancel their campaigns before the deadline. Once cancelled, backers can instantly retrieve refunds.

---

## ⚙️ Setup & Installation Guide

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
*   MetaMask or any WalletConnect compatible Web3 wallet.

### 1. Smart Contract Setup & Compile
Navigate to the `smart-contracts` folder:
```bash
cd smart-contracts
npm install
```
Compile the contracts:
```bash
npx hardhat compile
```
Verify contract tests (all 29 tests):
```bash
npx hardhat test
```

### 2. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd ../frontend
npm install
```

Configure your environment variables by copying `.env.example` to `.env.local` inside the `frontend` folder:
```bash
cp .env.example .env.local
```
Fill in the values:
*   `NEXT_PUBLIC_PINATA_JWT`: Your Pinata JWT Token for image uploads. If left blank, the app runs in **Mock Fallback Upload Mode**, allowing offline testing.
*   `NEXT_PUBLIC_WC_PROJECT_ID`: Your WalletConnect project ID. If left blank, the app falls back to a development key.

---

## 🚀 Local Network Deployment & Testing Guide

To test the full end-to-end user flow locally:

1.  **Start a Local Node**:
    Inside the `smart-contracts` folder, run a local Ethereum network:
    ```bash
    npx hardhat node
    ```
2.  **Deploy Smart Contracts**:
    In a new terminal window, deploy the contract to your local network:
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
    This script automatically compiles the contract, deploys it to your localhost network, and exports the contract address and ABI directly to `/frontend/src/contracts`.

3.  **Start the Next.js Dev Server**:
    Navigate to the `frontend` folder and start the dev server:
    ```bash
    cd ../frontend
    npm run dev
    ```
    Open `http://localhost:3000` to interact with the platform.

4.  **Connect MetaMask to Localhost**:
    *   Add a custom RPC network to MetaMask:
        *   Network Name: `Hardhat Localhost`
        *   New RPC URL: `http://127.0.0.1:8545`
        *   Chain ID: `1337` (or `31337` depending on Node settings; our contract configures chainId 1337).
        *   Currency Symbol: `ETH`
    *   Import one of Hardhat's private keys (shown in the terminal outputs of `npx hardhat node`) into MetaMask to test with free test ETH.

---

## 📖 User Guide

### For Campaign Creators
1.  **Connecting Wallet**: Click "Connect Wallet" at the top right, select MetaMask, and switch to your local Hardhat network (or Sepolia).
2.  **Launching a Campaign**:
    *   Navigate to "Create Campaign" page.
    *   Enter Title, Category, Goal (in ETH), and Duration (in days).
    *   Write a detailed description and upload a cover photo.
    *   Confirm the MetaMask transaction.
3.  **Cancelling a Campaign**: You can cancel active campaigns before their deadline from your "Dashboard".
4.  **Withdrawing Funds**: Once the deadline passes, if your campaign met or exceeded its goal, a "Withdraw Funds" button will appear on the Campaign Details page or on your Dashboard. Confirm the transaction to receive your funds (minus a 2% platform fee).

### For Contributors
1.  **Exploring Projects**: Browse active and completed campaigns on the "Explore" page, filter by category, or use the search bar.
2.  **Backing a Campaign**: Open a project, enter your contribution amount in ETH under "Back this project", and confirm the wallet transaction.
3.  **Reclaiming Refunds**: If a project you supported does not reach its goal by the deadline or gets cancelled, visit the project page or your Dashboard to click "Claim Refund" and receive your ETH back instantly.
