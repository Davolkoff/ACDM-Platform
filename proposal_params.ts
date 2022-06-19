export const jsonAbi = [{
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ref1SaleComission_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ref2SaleComission_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ref1TradeComission_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ref2TradeComission_",
        "type": "uint256"
      }
    ],
    "name": "setComissions",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyXXXTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

// should be array even if you has only one function
export const callableFunctions = ['setComissions', 'buyXXXTokens'];

// should be two-dimensional array even if you has only one set of parameters
export const parameters = [[10, 10, 10, 20], []];

export const description = "One of two";

// should be array even if you has only one recipient
export const recipients = ["0xCaEE76B8D45F3b6eC51fa61e8501C498692C4D8f", "0xCaEE76B8D45F3b6eC51fa61e8501C498692C4D8f"]