/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  WETH,
  WETHInterface,
} from "../../../../contracts/vaults/tokens/WETH";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawal",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

const _bytecode =
  "0x60e06040523480156200001157600080fd5b506040518060400160405280600d81526020017f57726170706564204574686572000000000000000000000000000000000000008152506040518060400160405280600481526020017f5745544800000000000000000000000000000000000000000000000000000000815250601282600090805190602001906200009892919062000178565b508160019080519060200190620000b192919062000178565b508060ff1660808160ff16815250504660a08181525050620000d8620000e860201b60201c565b60c0818152505050505062000429565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60006040516200011c919062000338565b60405180910390207fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc646306040516020016200015d959493929190620003cc565b60405160208183030381529060405280519060200120905090565b828054620001869062000257565b90600052602060002090601f016020900481019282620001aa5760008555620001f6565b82601f10620001c557805160ff1916838001178555620001f6565b82800160010185558215620001f6579182015b82811115620001f5578251825591602001919060010190620001d8565b5b50905062000205919062000209565b5090565b5b80821115620002245760008160009055506001016200020a565b5090565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200027057607f821691505b6020821081141562000287576200028662000228565b5b50919050565b600081905092915050565b60008190508160005260206000209050919050565b60008154620002bc8162000257565b620002c881866200028d565b94506001821660008114620002e65760018114620002f8576200032f565b60ff198316865281860193506200032f565b620003038562000298565b60005b83811015620003275781548189015260018201915060208101905062000306565b838801955050505b50505092915050565b6000620003468284620002ad565b915081905092915050565b6000819050919050565b620003668162000351565b82525050565b6000819050919050565b62000381816200036c565b82525050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620003b48262000387565b9050919050565b620003c681620003a7565b82525050565b600060a082019050620003e360008301886200035b565b620003f260208301876200035b565b6200040160408301866200035b565b62000410606083018562000376565b6200041f6080830184620003bb565b9695505050505050565b60805160a05160c05161197b6200045960003960006108a00152600061086c01526000610846015261197b6000f3fe6080604052600436106100e15760003560e01c806370a082311161007f578063a9059cbb11610059578063a9059cbb146102e9578063d0e30db014610326578063d505accf14610330578063dd62ed3e14610359576100f0565b806370a08231146102445780637ecebe001461028157806395d89b41146102be576100f0565b806323b872dd116100bb57806323b872dd146101885780632e1a7d4d146101c5578063313ce567146101ee5780633644e51514610219576100f0565b806306fdde03146100f5578063095ea7b31461012057806318160ddd1461015d576100f0565b366100f0576100ee610396565b005b600080fd5b34801561010157600080fd5b5061010a6103f0565b60405161011791906110cd565b60405180910390f35b34801561012c57600080fd5b5061014760048036038101906101429190611188565b61047e565b60405161015491906111e3565b60405180910390f35b34801561016957600080fd5b50610172610570565b60405161017f919061120d565b60405180910390f35b34801561019457600080fd5b506101af60048036038101906101aa9190611228565b610576565b6040516101bc91906111e3565b60405180910390f35b3480156101d157600080fd5b506101ec60048036038101906101e7919061127b565b6107c0565b005b3480156101fa57600080fd5b50610203610844565b60405161021091906112c4565b60405180910390f35b34801561022557600080fd5b5061022e610868565b60405161023b91906112f8565b60405180910390f35b34801561025057600080fd5b5061026b60048036038101906102669190611313565b6108c5565b604051610278919061120d565b60405180910390f35b34801561028d57600080fd5b506102a860048036038101906102a39190611313565b6108dd565b6040516102b5919061120d565b60405180910390f35b3480156102ca57600080fd5b506102d36108f5565b6040516102e091906110cd565b60405180910390f35b3480156102f557600080fd5b50610310600480360381019061030b9190611188565b610983565b60405161031d91906111e3565b60405180910390f35b61032e610396565b005b34801561033c57600080fd5b5061035760048036038101906103529190611398565b610a97565b005b34801561036557600080fd5b50610380600480360381019061037b919061143a565b610d90565b60405161038d919061120d565b60405180910390f35b6103a03334610db5565b3373ffffffffffffffffffffffffffffffffffffffff167fe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c346040516103e6919061120d565b60405180910390a2565b600080546103fd906114a9565b80601f0160208091040260200160405190810160405280929190818152602001828054610429906114a9565b80156104765780601f1061044b57610100808354040283529160200191610476565b820191906000526020600020905b81548152906001019060200180831161045957829003601f168201915b505050505081565b600081600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161055e919061120d565b60405180910390a36001905092915050565b60025481565b600080600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146106ac57828161062b919061150a565b600460008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b82600360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546106fb919061150a565b9250508190555082600360008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040516107ac919061120d565b60405180910390a360019150509392505050565b6107ca3382610e85565b3373ffffffffffffffffffffffffffffffffffffffff167f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b6582604051610810919061120d565b60405180910390a2610841813373ffffffffffffffffffffffffffffffffffffffff16610f5590919063ffffffff16565b50565b7f000000000000000000000000000000000000000000000000000000000000000081565b60007f0000000000000000000000000000000000000000000000000000000000000000461461089e57610899610fa8565b6108c0565b7f00000000000000000000000000000000000000000000000000000000000000005b905090565b60036020528060005260406000206000915090505481565b60056020528060005260406000206000915090505481565b60018054610902906114a9565b80601f016020809104026020016040519081016040528092919081815260200182805461092e906114a9565b801561097b5780601f106109505761010080835404028352916020019161097b565b820191906000526020600020905b81548152906001019060200180831161095e57829003601f168201915b505050505081565b600081600360003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546109d4919061150a565b9250508190555081600360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610a85919061120d565b60405180910390a36001905092915050565b42841015610ada576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ad19061158a565b60405180910390fd5b60006001610ae6610868565b7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98a8a8a600560008f73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000815480929190600101919050558b604051602001610b6e969594939291906115b9565b60405160208183030381529060405280519060200120604051602001610b95929190611692565b6040516020818303038152906040528051906020012085858560405160008152602001604052604051610bcb94939291906116c9565b6020604051602081039080840390855afa158015610bed573d6000803e3d6000fd5b505050602060405103519050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614158015610c6157508773ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16145b610ca0576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c979061175a565b60405180910390fd5b85600460008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550508573ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92587604051610d7f919061120d565b60405180910390a350505050505050565b6004602052816000526040600020602052806000526040600020600091509150505481565b8060026000828254610dc7919061177a565b9250508190555080600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610e79919061120d565b60405180910390a35050565b80600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610ed4919061150a565b9250508190555080600260008282540392505081905550600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610f49919061120d565b60405180910390a35050565b600080600080600085875af1905080610fa3576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f9a9061181c565b60405180910390fd5b505050565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f6000604051610fda91906118db565b60405180910390207fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc646306040516020016110199594939291906118f2565b60405160208183030381529060405280519060200120905090565b600081519050919050565b600082825260208201905092915050565b60005b8381101561106e578082015181840152602081019050611053565b8381111561107d576000848401525b50505050565b6000601f19601f8301169050919050565b600061109f82611034565b6110a9818561103f565b93506110b9818560208601611050565b6110c281611083565b840191505092915050565b600060208201905081810360008301526110e78184611094565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061111f826110f4565b9050919050565b61112f81611114565b811461113a57600080fd5b50565b60008135905061114c81611126565b92915050565b6000819050919050565b61116581611152565b811461117057600080fd5b50565b6000813590506111828161115c565b92915050565b6000806040838503121561119f5761119e6110ef565b5b60006111ad8582860161113d565b92505060206111be85828601611173565b9150509250929050565b60008115159050919050565b6111dd816111c8565b82525050565b60006020820190506111f860008301846111d4565b92915050565b61120781611152565b82525050565b600060208201905061122260008301846111fe565b92915050565b600080600060608486031215611241576112406110ef565b5b600061124f8682870161113d565b93505060206112608682870161113d565b925050604061127186828701611173565b9150509250925092565b600060208284031215611291576112906110ef565b5b600061129f84828501611173565b91505092915050565b600060ff82169050919050565b6112be816112a8565b82525050565b60006020820190506112d960008301846112b5565b92915050565b6000819050919050565b6112f2816112df565b82525050565b600060208201905061130d60008301846112e9565b92915050565b600060208284031215611329576113286110ef565b5b60006113378482850161113d565b91505092915050565b611349816112a8565b811461135457600080fd5b50565b60008135905061136681611340565b92915050565b611375816112df565b811461138057600080fd5b50565b6000813590506113928161136c565b92915050565b600080600080600080600060e0888a0312156113b7576113b66110ef565b5b60006113c58a828b0161113d565b97505060206113d68a828b0161113d565b96505060406113e78a828b01611173565b95505060606113f88a828b01611173565b94505060806114098a828b01611357565b93505060a061141a8a828b01611383565b92505060c061142b8a828b01611383565b91505092959891949750929550565b60008060408385031215611451576114506110ef565b5b600061145f8582860161113d565b92505060206114708582860161113d565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806114c157607f821691505b602082108114156114d5576114d461147a565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061151582611152565b915061152083611152565b925082821015611533576115326114db565b5b828203905092915050565b7f5045524d49545f444541444c494e455f45585049524544000000000000000000600082015250565b600061157460178361103f565b915061157f8261153e565b602082019050919050565b600060208201905081810360008301526115a381611567565b9050919050565b6115b381611114565b82525050565b600060c0820190506115ce60008301896112e9565b6115db60208301886115aa565b6115e860408301876115aa565b6115f560608301866111fe565b61160260808301856111fe565b61160f60a08301846111fe565b979650505050505050565b600081905092915050565b7f1901000000000000000000000000000000000000000000000000000000000000600082015250565b600061165b60028361161a565b915061166682611625565b600282019050919050565b6000819050919050565b61168c611687826112df565b611671565b82525050565b600061169d8261164e565b91506116a9828561167b565b6020820191506116b9828461167b565b6020820191508190509392505050565b60006080820190506116de60008301876112e9565b6116eb60208301866112b5565b6116f860408301856112e9565b61170560608301846112e9565b95945050505050565b7f494e56414c49445f5349474e4552000000000000000000000000000000000000600082015250565b6000611744600e8361103f565b915061174f8261170e565b602082019050919050565b6000602082019050818103600083015261177381611737565b9050919050565b600061178582611152565b915061179083611152565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156117c5576117c46114db565b5b828201905092915050565b7f4554485f5452414e534645525f4641494c454400000000000000000000000000600082015250565b600061180660138361103f565b9150611811826117d0565b602082019050919050565b60006020820190508181036000830152611835816117f9565b9050919050565b600081905092915050565b60008190508160005260206000209050919050565b60008154611869816114a9565b611873818661183c565b9450600182166000811461188e576001811461189f576118d2565b60ff198316865281860193506118d2565b6118a885611847565b60005b838110156118ca578154818901526001820191506020810190506118ab565b838801955050505b50505092915050565b60006118e7828461185c565b915081905092915050565b600060a08201905061190760008301886112e9565b61191460208301876112e9565b61192160408301866112e9565b61192e60608301856111fe565b61193b60808301846115aa565b969550505050505056fea26469706673582212207da1d4f7db8a8061eb34dbf56f5fed1a42daae3f16bf67307bf7eb03c71e49be64736f6c634300080c0033";

type WETHConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: WETHConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class WETH__factory extends ContractFactory {
  constructor(...args: WETHConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<WETH> {
    return super.deploy(overrides || {}) as Promise<WETH>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): WETH {
    return super.attach(address) as WETH;
  }
  override connect(signer: Signer): WETH__factory {
    return super.connect(signer) as WETH__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): WETHInterface {
    return new utils.Interface(_abi) as WETHInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): WETH {
    return new Contract(address, _abi, signerOrProvider) as WETH;
  }
}
