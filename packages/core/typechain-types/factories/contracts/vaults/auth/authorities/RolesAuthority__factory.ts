/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../../common";
import type {
  RolesAuthority,
  RolesAuthorityInterface,
} from "../../../../../contracts/vaults/auth/authorities/RolesAuthority";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "contract Authority",
        name: "_authority",
        type: "address",
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
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract Authority",
        name: "newAuthority",
        type: "address",
      },
    ],
    name: "AuthorityUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnerUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes4",
        name: "functionSig",
        type: "bytes4",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "PublicCapabilityUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes4",
        name: "functionSig",
        type: "bytes4",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "RoleCapabilityUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "UserRoleUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "authority",
    outputs: [
      {
        internalType: "contract Authority",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "functionSig",
        type: "bytes4",
      },
    ],
    name: "canCall",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "functionSig",
        type: "bytes4",
      },
    ],
    name: "doesRoleHaveCapability",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
    ],
    name: "doesUserHaveRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
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
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    name: "getRolesWithCapability",
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
    ],
    name: "getUserRoles",
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
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    name: "isCapabilityPublic",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract Authority",
        name: "newAuthority",
        type: "address",
      },
    ],
    name: "setAuthority",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newAuthority",
        type: "address",
      },
    ],
    name: "setNewAuthority",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "functionSig",
        type: "bytes4",
      },
      {
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "setPublicCapability",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "functionSig",
        type: "bytes4",
      },
      {
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "setRoleCapability",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "role",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "enabled",
        type: "bool",
      },
    ],
    name: "setUserRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b50604051620017b3380380620017b383398181016040528101906200003791906200018a565b81806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8292fce18fa69edf4db7b94ea2e58241df0ae57f97e0a6c9b29067028bf92d7660405160405180910390a3505050620001d1565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006200010d82620000e0565b9050919050565b6200011f8162000100565b81146200012b57600080fd5b50565b6000815190506200013f8162000114565b92915050565b6000620001528262000100565b9050919050565b620001648162000145565b81146200017057600080fd5b50565b600081519050620001848162000159565b92915050565b60008060408385031215620001a457620001a3620000db565b5b6000620001b4858286016200012e565b9250506020620001c78582860162000173565b9150509250929050565b6115d280620001e16000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80638da5cb5b1161008c578063b700961311610066578063b700961314610259578063bf7e214f14610289578063c6b0263e146102a7578063ea7ca276146102c3576100ea565b80638da5cb5b146101ef5780639d0eba611461020d578063b4bad06a14610229576100ea565b806367aff484116100c857806367aff4841461016b5780637917b794146101875780637a9e5e4b146101b75780637d40583d146101d3576100ea565b806306a36aee146100ef57806313af40351461011f5780632f47571f1461013b575b600080fd5b61010960048036038101906101049190611001565b6102f3565b6040516101169190611047565b60405180910390f35b61013960048036038101906101349190611001565b61030b565b005b610155600480360381019061015091906110ba565b610415565b6040516101629190611115565b60405180910390f35b61018560048036038101906101809190611195565b610444565b005b6101a1600480360381019061019c91906110ba565b6105c3565b6040516101ae9190611047565b60405180910390f35b6101d160048036038101906101cc9190611226565b6105e8565b005b6101ed60048036038101906101e89190611253565b6107a9565b005b6101f76109e7565b60405161020491906112c9565b60405180910390f35b61022760048036038101906102229190611001565b610a0b565b005b610243600480360381019061023e91906112e4565b610abe565b6040516102509190611115565b60405180910390f35b610273600480360381019061026e9190611337565b610b67565b6040516102809190611115565b60405180910390f35b610291610ceb565b60405161029e91906113e9565b60405180910390f35b6102c160048036038101906102bc9190611404565b610d11565b005b6102dd60048036038101906102d89190611457565b610e97565b6040516102ea9190611115565b60405180910390f35b60036020528060005260406000206000915090505481565b610339336000357fffffffff0000000000000000000000000000000000000000000000000000000016610ef0565b610378576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161036f906114f4565b60405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8292fce18fa69edf4db7b94ea2e58241df0ae57f97e0a6c9b29067028bf92d7660405160405180910390a350565b60046020528160005260406000206020528060005260406000206000915091509054906101000a900460ff1681565b610472336000357fffffffff0000000000000000000000000000000000000000000000000000000016610ef0565b6104b1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104a8906114f4565b60405180910390fd5b8015610513578160ff166001901b60001b600360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254179250508190555061056c565b8160ff166001901b60001b19600360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825416925050819055505b8160ff168373ffffffffffffffffffffffffffffffffffffffff167f4c9bdd0c8e073eb5eda2250b18d8e5121ff27b62064fbeeeed4869bb99bc5bf2836040516105b69190611115565b60405180910390a3505050565b6005602052816000526040600020602052806000526040600020600091509150505481565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614806107025750600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663b700961333306000357fffffffff00000000000000000000000000000000000000000000000000000000166040518463ffffffff1660e01b81526004016106c093929190611523565b602060405180830381865afa1580156106dd573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610701919061156f565b5b61070b57600080fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fa3396fd7f6e0a21b50e5089d2da70d5ac0a3bbbd1f617a93f134b7638998019860405160405180910390a350565b6107d7336000357fffffffff0000000000000000000000000000000000000000000000000000000016610ef0565b610816576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161080d906114f4565b60405180910390fd5b80156108c7578360ff166001901b60001b600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000847bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191681526020019081526020016000206000828254179250508190555061096f565b8360ff166001901b60001b19600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000847bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168152602001908152602001600020600082825416925050819055505b817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168373ffffffffffffffffffffffffffffffffffffffff168560ff167fa52ea92e6e955aa8ac66420b86350f7139959adfcc7e6a14eee1bd116d09860e846040516109d99190611115565b60405180910390a450505050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610a6357600080fd5b6001600260008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b60008060018560ff16600560008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000867bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191681526020019081526020016000205460001c901c16141590509392505050565b6000600460008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060009054906101000a900460ff1680610ce25750600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002054600360008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054166000801b14155b90509392505050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b610d3f336000357fffffffff0000000000000000000000000000000000000000000000000000000016610ef0565b610d7e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d75906114f4565b60405180910390fd5b80600460008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000847bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060006101000a81548160ff021916908315150217905550817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168373ffffffffffffffffffffffffffffffffffffffff167f950a343f5d10445e82a71036d3f4fb3016180a25805141932543b83e2078a93e83604051610e8a9190611115565b60405180910390a3505050565b60008060018360ff16600360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205460001c901c161415905092915050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161480610f965750600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff165b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610fce82610fa3565b9050919050565b610fde81610fc3565b8114610fe957600080fd5b50565b600081359050610ffb81610fd5565b92915050565b60006020828403121561101757611016610f9e565b5b600061102584828501610fec565b91505092915050565b6000819050919050565b6110418161102e565b82525050565b600060208201905061105c6000830184611038565b92915050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b61109781611062565b81146110a257600080fd5b50565b6000813590506110b48161108e565b92915050565b600080604083850312156110d1576110d0610f9e565b5b60006110df85828601610fec565b92505060206110f0858286016110a5565b9150509250929050565b60008115159050919050565b61110f816110fa565b82525050565b600060208201905061112a6000830184611106565b92915050565b600060ff82169050919050565b61114681611130565b811461115157600080fd5b50565b6000813590506111638161113d565b92915050565b611172816110fa565b811461117d57600080fd5b50565b60008135905061118f81611169565b92915050565b6000806000606084860312156111ae576111ad610f9e565b5b60006111bc86828701610fec565b93505060206111cd86828701611154565b92505060406111de86828701611180565b9150509250925092565b60006111f382610fc3565b9050919050565b611203816111e8565b811461120e57600080fd5b50565b600081359050611220816111fa565b92915050565b60006020828403121561123c5761123b610f9e565b5b600061124a84828501611211565b91505092915050565b6000806000806080858703121561126d5761126c610f9e565b5b600061127b87828801611154565b945050602061128c87828801610fec565b935050604061129d878288016110a5565b92505060606112ae87828801611180565b91505092959194509250565b6112c381610fc3565b82525050565b60006020820190506112de60008301846112ba565b92915050565b6000806000606084860312156112fd576112fc610f9e565b5b600061130b86828701611154565b935050602061131c86828701610fec565b925050604061132d868287016110a5565b9150509250925092565b6000806000606084860312156113505761134f610f9e565b5b600061135e86828701610fec565b935050602061136f86828701610fec565b9250506040611380868287016110a5565b9150509250925092565b6000819050919050565b60006113af6113aa6113a584610fa3565b61138a565b610fa3565b9050919050565b60006113c182611394565b9050919050565b60006113d3826113b6565b9050919050565b6113e3816113c8565b82525050565b60006020820190506113fe60008301846113da565b92915050565b60008060006060848603121561141d5761141c610f9e565b5b600061142b86828701610fec565b935050602061143c868287016110a5565b925050604061144d86828701611180565b9150509250925092565b6000806040838503121561146e5761146d610f9e565b5b600061147c85828601610fec565b925050602061148d85828601611154565b9150509250929050565b600082825260208201905092915050565b7f554e415554484f52495a45440000000000000000000000000000000000000000600082015250565b60006114de600c83611497565b91506114e9826114a8565b602082019050919050565b6000602082019050818103600083015261150d816114d1565b9050919050565b61151d81611062565b82525050565b600060608201905061153860008301866112ba565b61154560208301856112ba565b6115526040830184611514565b949350505050565b60008151905061156981611169565b92915050565b60006020828403121561158557611584610f9e565b5b60006115938482850161155a565b9150509291505056fea26469706673582212205aa85b4b3ef3d6c787373a4bb7845a0c8f952f45189a35b44018d6f55a28a48364736f6c634300080c0033";

type RolesAuthorityConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: RolesAuthorityConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class RolesAuthority__factory extends ContractFactory {
  constructor(...args: RolesAuthorityConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _owner: PromiseOrValue<string>,
    _authority: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<RolesAuthority> {
    return super.deploy(
      _owner,
      _authority,
      overrides || {}
    ) as Promise<RolesAuthority>;
  }
  override getDeployTransaction(
    _owner: PromiseOrValue<string>,
    _authority: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_owner, _authority, overrides || {});
  }
  override attach(address: string): RolesAuthority {
    return super.attach(address) as RolesAuthority;
  }
  override connect(signer: Signer): RolesAuthority__factory {
    return super.connect(signer) as RolesAuthority__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): RolesAuthorityInterface {
    return new utils.Interface(_abi) as RolesAuthorityInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): RolesAuthority {
    return new Contract(address, _abi, signerOrProvider) as RolesAuthority;
  }
}
