/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { Cash, CashInterface } from "../../../contracts/utils/Cash";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "decimals_",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
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
        name: "value",
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
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
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
        name: "account",
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
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
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
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "faucet",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
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
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b50604051620018d8380380620018d883398181016040528101906200003791906200031c565b828281600390805190602001906200005192919062000091565b5080600490805190602001906200006a92919062000091565b50505080600560006101000a81548160ff021916908360ff1602179055505050506200041b565b8280546200009f90620003e5565b90600052602060002090601f016020900481019282620000c357600085556200010f565b82601f10620000de57805160ff19168380011785556200010f565b828001600101855582156200010f579182015b828111156200010e578251825591602001919060010190620000f1565b5b5090506200011e919062000122565b5090565b5b808211156200013d57600081600090555060010162000123565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620001aa826200015f565b810181811067ffffffffffffffff82111715620001cc57620001cb62000170565b5b80604052505050565b6000620001e162000141565b9050620001ef82826200019f565b919050565b600067ffffffffffffffff82111562000212576200021162000170565b5b6200021d826200015f565b9050602081019050919050565b60005b838110156200024a5780820151818401526020810190506200022d565b838111156200025a576000848401525b50505050565b6000620002776200027184620001f4565b620001d5565b9050828152602081018484840111156200029657620002956200015a565b5b620002a38482856200022a565b509392505050565b600082601f830112620002c357620002c262000155565b5b8151620002d584826020860162000260565b91505092915050565b600060ff82169050919050565b620002f681620002de565b81146200030257600080fd5b50565b6000815190506200031681620002eb565b92915050565b6000806000606084860312156200033857620003376200014b565b5b600084015167ffffffffffffffff81111562000359576200035862000150565b5b6200036786828701620002ab565b935050602084015167ffffffffffffffff8111156200038b576200038a62000150565b5b6200039986828701620002ab565b9250506040620003ac8682870162000305565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620003fe57607f821691505b60208210811415620004155762000414620003b6565b5b50919050565b6114ad806200042b6000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c8063579158971161007157806357915897146101a357806370a08231146101d357806395d89b4114610203578063a457c2d714610221578063a9059cbb14610251578063dd62ed3e14610281576100b4565b806306fdde03146100b9578063095ea7b3146100d757806318160ddd1461010757806323b872dd14610125578063313ce567146101555780633950935114610173575b600080fd5b6100c16102b1565b6040516100ce9190610cce565b60405180910390f35b6100f160048036038101906100ec9190610d89565b610343565b6040516100fe9190610de4565b60405180910390f35b61010f610366565b60405161011c9190610e0e565b60405180910390f35b61013f600480360381019061013a9190610e29565b610370565b60405161014c9190610de4565b60405180910390f35b61015d61039f565b60405161016a9190610e98565b60405180910390f35b61018d60048036038101906101889190610d89565b6103b6565b60405161019a9190610de4565b60405180910390f35b6101bd60048036038101906101b89190610eb3565b6103ed565b6040516101ca9190610de4565b60405180910390f35b6101ed60048036038101906101e89190610ee0565b610402565b6040516101fa9190610e0e565b60405180910390f35b61020b61044a565b6040516102189190610cce565b60405180910390f35b61023b60048036038101906102369190610d89565b6104dc565b6040516102489190610de4565b60405180910390f35b61026b60048036038101906102669190610d89565b610553565b6040516102789190610de4565b60405180910390f35b61029b60048036038101906102969190610f0d565b610576565b6040516102a89190610e0e565b60405180910390f35b6060600380546102c090610f7c565b80601f01602080910402602001604051908101604052809291908181526020018280546102ec90610f7c565b80156103395780601f1061030e57610100808354040283529160200191610339565b820191906000526020600020905b81548152906001019060200180831161031c57829003601f168201915b5050505050905090565b60008061034e6105fd565b905061035b818585610605565b600191505092915050565b6000600254905090565b60008061037b6105fd565b90506103888582856107d0565b61039385858561085c565b60019150509392505050565b6000600560009054906101000a900460ff16905090565b6000806103c16105fd565b90506103e28185856103d38589610576565b6103dd9190610fdd565b610605565b600191505092915050565b60006103f93383610ad4565b60019050919050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606004805461045990610f7c565b80601f016020809104026020016040519081016040528092919081815260200182805461048590610f7c565b80156104d25780601f106104a7576101008083540402835291602001916104d2565b820191906000526020600020905b8154815290600101906020018083116104b557829003601f168201915b5050505050905090565b6000806104e76105fd565b905060006104f58286610576565b90508381101561053a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610531906110a5565b60405180910390fd5b6105478286868403610605565b60019250505092915050565b60008061055e6105fd565b905061056b81858561085c565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610675576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161066c90611137565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156106e5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106dc906111c9565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040516107c39190610e0e565b60405180910390a3505050565b60006107dc8484610576565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146108565781811015610848576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161083f90611235565b60405180910390fd5b6108558484848403610605565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156108cc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108c3906112c7565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561093c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161093390611359565b60405180910390fd5b610947838383610c2b565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050818110156109cd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109c4906113eb565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610abb9190610e0e565b60405180910390a3610ace848484610c30565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610b44576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b3b90611457565b60405180910390fd5b610b5060008383610c2b565b8060026000828254610b629190610fdd565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610c139190610e0e565b60405180910390a3610c2760008383610c30565b5050565b505050565b505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610c6f578082015181840152602081019050610c54565b83811115610c7e576000848401525b50505050565b6000601f19601f8301169050919050565b6000610ca082610c35565b610caa8185610c40565b9350610cba818560208601610c51565b610cc381610c84565b840191505092915050565b60006020820190508181036000830152610ce88184610c95565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610d2082610cf5565b9050919050565b610d3081610d15565b8114610d3b57600080fd5b50565b600081359050610d4d81610d27565b92915050565b6000819050919050565b610d6681610d53565b8114610d7157600080fd5b50565b600081359050610d8381610d5d565b92915050565b60008060408385031215610da057610d9f610cf0565b5b6000610dae85828601610d3e565b9250506020610dbf85828601610d74565b9150509250929050565b60008115159050919050565b610dde81610dc9565b82525050565b6000602082019050610df96000830184610dd5565b92915050565b610e0881610d53565b82525050565b6000602082019050610e236000830184610dff565b92915050565b600080600060608486031215610e4257610e41610cf0565b5b6000610e5086828701610d3e565b9350506020610e6186828701610d3e565b9250506040610e7286828701610d74565b9150509250925092565b600060ff82169050919050565b610e9281610e7c565b82525050565b6000602082019050610ead6000830184610e89565b92915050565b600060208284031215610ec957610ec8610cf0565b5b6000610ed784828501610d74565b91505092915050565b600060208284031215610ef657610ef5610cf0565b5b6000610f0484828501610d3e565b91505092915050565b60008060408385031215610f2457610f23610cf0565b5b6000610f3285828601610d3e565b9250506020610f4385828601610d3e565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610f9457607f821691505b60208210811415610fa857610fa7610f4d565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610fe882610d53565b9150610ff383610d53565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561102857611027610fae565b5b828201905092915050565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b600061108f602583610c40565b915061109a82611033565b604082019050919050565b600060208201905081810360008301526110be81611082565b9050919050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b6000611121602483610c40565b915061112c826110c5565b604082019050919050565b6000602082019050818103600083015261115081611114565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b60006111b3602283610c40565b91506111be82611157565b604082019050919050565b600060208201905081810360008301526111e2816111a6565b9050919050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000600082015250565b600061121f601d83610c40565b915061122a826111e9565b602082019050919050565b6000602082019050818103600083015261124e81611212565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b60006112b1602583610c40565b91506112bc82611255565b604082019050919050565b600060208201905081810360008301526112e0816112a4565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000611343602383610c40565b915061134e826112e7565b604082019050919050565b6000602082019050818103600083015261137281611336565b9050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b60006113d5602683610c40565b91506113e082611379565b604082019050919050565b60006020820190508181036000830152611404816113c8565b9050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b6000611441601f83610c40565b915061144c8261140b565b602082019050919050565b6000602082019050818103600083015261147081611434565b905091905056fea2646970667358221220d6f7c519455924d605344f8556d4fae49c2c078f5aab3ee3703ceb8a4137287064736f6c634300080c0033";

type CashConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CashConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Cash__factory extends ContractFactory {
  constructor(...args: CashConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    decimals_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Cash> {
    return super.deploy(
      name_,
      symbol_,
      decimals_,
      overrides || {}
    ) as Promise<Cash>;
  }
  override getDeployTransaction(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    decimals_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      name_,
      symbol_,
      decimals_,
      overrides || {}
    );
  }
  override attach(address: string): Cash {
    return super.attach(address) as Cash;
  }
  override connect(signer: Signer): Cash__factory {
    return super.connect(signer) as Cash__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CashInterface {
    return new utils.Interface(_abi) as CashInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Cash {
    return new Contract(address, _abi, signerOrProvider) as Cash;
  }
}
