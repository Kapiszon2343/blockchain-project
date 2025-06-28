# Blockchain Project: Copyright-Protected Publishing Platform

This project allows authors to publish and manage content on the blockchain while protecting their intellectual property. It includes a smart contract, backend API, and a frontend interface. For details check other attached documents.

## 🌐 Live Demo

Frontend is deployed on GitHub Pages:  
🔗 [https://kapiszon2343.github.io/blockchain-project/](https://kapiszon2343.github.io/blockchain-project/)

> ⚠️ To use the app:
> - Make sure you are **logged into MetaMask** with a **Sepolia account**.
> - Run the **backend locally** to connect to blockchain and serve content data.

---

## 🗂️ Project Structure

- backend/ # Node.js + Express API
- blockchain/ # Solidity contracts with Hardhat
- frontend/ # React + Wagmi app (deployed on GitHub Pages)

## Getting Started

### Start backend locally
```bash
cd backend
npm install
npm run start
```

### Use live demo or start local node
Local blockchain
```bash
cd blockchain
npm install
npm hardhat compile
npx hardhat node
npx hardhat ignition deploy ignition/modules/Publishing.ts --network localhost
```
And local frontend host
```bash
cd frontend
npm install
npm run dev
```

## Testing

### backend
```bash
cd backend
npm test
```

### blockchain
```bash
cd blockchain
npx hardhat test
```

### frontend
First run backend, blockchain and frontend locally, then
```bash
cd frontend
npx playwright install --with-deps
npx synpress
npx playwright test
```

