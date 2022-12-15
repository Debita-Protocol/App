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
import type { PromiseOrValue } from "../../../../common";
import type {
  ERC20,
  ERC20Interface,
} from "../../../../contracts/bonds/libraries.sol/ERC20";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_decimals",
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
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
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
] as const;

const _bytecode =
  "0x60e06040523480156200001157600080fd5b5060405162001db538038062001db58339818101604052810190620000379190620003ba565b82600090805190602001906200004f9291906200012f565b508160019080519060200190620000689291906200012f565b508060ff1660808160ff16815250504660a081815250506200008f6200009f60201b60201c565b60c0818152505050505062000655565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f6000604051620000d3919062000564565b60405180910390207fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6463060405160200162000114959493929190620005f8565b60405160208183030381529060405280519060200120905090565b8280546200013d9062000483565b90600052602060002090601f016020900481019282620001615760008555620001ad565b82601f106200017c57805160ff1916838001178555620001ad565b82800160010185558215620001ad579182015b82811115620001ac5782518255916020019190600101906200018f565b5b509050620001bc9190620001c0565b5090565b5b80821115620001db576000816000905550600101620001c1565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6200024882620001fd565b810181811067ffffffffffffffff821117156200026a57620002696200020e565b5b80604052505050565b60006200027f620001df565b90506200028d82826200023d565b919050565b600067ffffffffffffffff821115620002b057620002af6200020e565b5b620002bb82620001fd565b9050602081019050919050565b60005b83811015620002e8578082015181840152602081019050620002cb565b83811115620002f8576000848401525b50505050565b6000620003156200030f8462000292565b62000273565b905082815260208101848484011115620003345762000333620001f8565b5b62000341848285620002c8565b509392505050565b600082601f830112620003615762000360620001f3565b5b815162000373848260208601620002fe565b91505092915050565b600060ff82169050919050565b62000394816200037c565b8114620003a057600080fd5b50565b600081519050620003b48162000389565b92915050565b600080600060608486031215620003d657620003d5620001e9565b5b600084015167ffffffffffffffff811115620003f757620003f6620001ee565b5b620004058682870162000349565b935050602084015167ffffffffffffffff811115620004295762000428620001ee565b5b620004378682870162000349565b92505060406200044a86828701620003a3565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200049c57607f821691505b60208210811415620004b357620004b262000454565b5b50919050565b600081905092915050565b60008190508160005260206000209050919050565b60008154620004e88162000483565b620004f48186620004b9565b9450600182166000811462000512576001811462000524576200055b565b60ff198316865281860193506200055b565b6200052f85620004c4565b60005b83811015620005535781548189015260018201915060208101905062000532565b838801955050505b50505092915050565b6000620005728284620004d9565b915081905092915050565b6000819050919050565b62000592816200057d565b82525050565b6000819050919050565b620005ad8162000598565b82525050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620005e082620005b3565b9050919050565b620005f281620005d3565b82525050565b600060a0820190506200060f600083018862000587565b6200061e602083018762000587565b6200062d604083018662000587565b6200063c6060830185620005a2565b6200064b6080830184620005e7565b9695505050505050565b60805160a05160c051611730620006856000396000610725015260006106f1015260006106cb01526117306000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c806370a082311161008c5780639dc29fac116100665780639dc29fac14610261578063a9059cbb1461027d578063d505accf146102ad578063dd62ed3e146102c9576100ea565b806370a08231146101e35780637ecebe001461021357806395d89b4114610243576100ea565b806323b872dd116100c857806323b872dd1461015b578063313ce5671461018b5780633644e515146101a957806340c10f19146101c7576100ea565b806306fdde03146100ef578063095ea7b31461010d57806318160ddd1461013d575b600080fd5b6100f76102f9565b6040516101049190610f1b565b60405180910390f35b61012760048036038101906101229190610fd6565b610387565b6040516101349190611031565b60405180910390f35b610145610479565b604051610152919061105b565b60405180910390f35b61017560048036038101906101709190611076565b61047f565b6040516101829190611031565b60405180910390f35b6101936106c9565b6040516101a091906110e5565b60405180910390f35b6101b16106ed565b6040516101be9190611119565b60405180910390f35b6101e160048036038101906101dc9190610fd6565b61074a565b005b6101fd60048036038101906101f89190611134565b610758565b60405161020a919061105b565b60405180910390f35b61022d60048036038101906102289190611134565b610770565b60405161023a919061105b565b60405180910390f35b61024b610788565b6040516102589190610f1b565b60405180910390f35b61027b60048036038101906102769190610fd6565b610816565b005b61029760048036038101906102929190610fd6565b610824565b6040516102a49190611031565b60405180910390f35b6102c760048036038101906102c291906111b9565b610938565b005b6102e360048036038101906102de919061125b565b610c31565b6040516102f0919061105b565b60405180910390f35b60008054610306906112ca565b80601f0160208091040260200160405190810160405280929190818152602001828054610332906112ca565b801561037f5780601f106103545761010080835404028352916020019161037f565b820191906000526020600020905b81548152906001019060200180831161036257829003601f168201915b505050505081565b600081600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610467919061105b565b60405180910390a36001905092915050565b60025481565b600080600460008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146105b5578281610534919061132b565b600460008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b82600360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610604919061132b565b9250508190555082600360008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040516106b5919061105b565b60405180910390a360019150509392505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b60007f000000000000000000000000000000000000000000000000000000000000000046146107235761071e610c56565b610745565b7f00000000000000000000000000000000000000000000000000000000000000005b905090565b6107548282610ce2565b5050565b60036020528060005260406000206000915090505481565b60056020528060005260406000206000915090505481565b60018054610795906112ca565b80601f01602080910402602001604051908101604052809291908181526020018280546107c1906112ca565b801561080e5780601f106107e35761010080835404028352916020019161080e565b820191906000526020600020905b8154815290600101906020018083116107f157829003601f168201915b505050505081565b6108208282610db2565b5050565b600081600360003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610875919061132b565b9250508190555081600360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610926919061105b565b60405180910390a36001905092915050565b4284101561097b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610972906113ab565b60405180910390fd5b600060016109876106ed565b7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98a8a8a600560008f73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000815480929190600101919050558b604051602001610a0f969594939291906113da565b60405160208183030381529060405280519060200120604051602001610a369291906114b3565b6040516020818303038152906040528051906020012085858560405160008152602001604052604051610a6c94939291906114ea565b6020604051602081039080840390855afa158015610a8e573d6000803e3d6000fd5b505050602060405103519050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614158015610b0257508773ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16145b610b41576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b389061157b565b60405180910390fd5b85600460008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550508573ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92587604051610c20919061105b565b60405180910390a350505050505050565b6004602052816000526040600020602052806000526040600020600091509150505481565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f6000604051610c88919061163a565b60405180910390207fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc64630604051602001610cc7959493929190611651565b60405160208183030381529060405280519060200120905090565b8060026000828254610cf491906116a4565b9250508190555080600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610da6919061105b565b60405180910390a35050565b80600360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610e01919061132b565b9250508190555080600260008282540392505081905550600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610e76919061105b565b60405180910390a35050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610ebc578082015181840152602081019050610ea1565b83811115610ecb576000848401525b50505050565b6000601f19601f8301169050919050565b6000610eed82610e82565b610ef78185610e8d565b9350610f07818560208601610e9e565b610f1081610ed1565b840191505092915050565b60006020820190508181036000830152610f358184610ee2565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610f6d82610f42565b9050919050565b610f7d81610f62565b8114610f8857600080fd5b50565b600081359050610f9a81610f74565b92915050565b6000819050919050565b610fb381610fa0565b8114610fbe57600080fd5b50565b600081359050610fd081610faa565b92915050565b60008060408385031215610fed57610fec610f3d565b5b6000610ffb85828601610f8b565b925050602061100c85828601610fc1565b9150509250929050565b60008115159050919050565b61102b81611016565b82525050565b60006020820190506110466000830184611022565b92915050565b61105581610fa0565b82525050565b6000602082019050611070600083018461104c565b92915050565b60008060006060848603121561108f5761108e610f3d565b5b600061109d86828701610f8b565b93505060206110ae86828701610f8b565b92505060406110bf86828701610fc1565b9150509250925092565b600060ff82169050919050565b6110df816110c9565b82525050565b60006020820190506110fa60008301846110d6565b92915050565b6000819050919050565b61111381611100565b82525050565b600060208201905061112e600083018461110a565b92915050565b60006020828403121561114a57611149610f3d565b5b600061115884828501610f8b565b91505092915050565b61116a816110c9565b811461117557600080fd5b50565b60008135905061118781611161565b92915050565b61119681611100565b81146111a157600080fd5b50565b6000813590506111b38161118d565b92915050565b600080600080600080600060e0888a0312156111d8576111d7610f3d565b5b60006111e68a828b01610f8b565b97505060206111f78a828b01610f8b565b96505060406112088a828b01610fc1565b95505060606112198a828b01610fc1565b945050608061122a8a828b01611178565b93505060a061123b8a828b016111a4565b92505060c061124c8a828b016111a4565b91505092959891949750929550565b6000806040838503121561127257611271610f3d565b5b600061128085828601610f8b565b925050602061129185828601610f8b565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806112e257607f821691505b602082108114156112f6576112f561129b565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061133682610fa0565b915061134183610fa0565b925082821015611354576113536112fc565b5b828203905092915050565b7f5045524d49545f444541444c494e455f45585049524544000000000000000000600082015250565b6000611395601783610e8d565b91506113a08261135f565b602082019050919050565b600060208201905081810360008301526113c481611388565b9050919050565b6113d481610f62565b82525050565b600060c0820190506113ef600083018961110a565b6113fc60208301886113cb565b61140960408301876113cb565b611416606083018661104c565b611423608083018561104c565b61143060a083018461104c565b979650505050505050565b600081905092915050565b7f1901000000000000000000000000000000000000000000000000000000000000600082015250565b600061147c60028361143b565b915061148782611446565b600282019050919050565b6000819050919050565b6114ad6114a882611100565b611492565b82525050565b60006114be8261146f565b91506114ca828561149c565b6020820191506114da828461149c565b6020820191508190509392505050565b60006080820190506114ff600083018761110a565b61150c60208301866110d6565b611519604083018561110a565b611526606083018461110a565b95945050505050565b7f494e56414c49445f5349474e4552000000000000000000000000000000000000600082015250565b6000611565600e83610e8d565b91506115708261152f565b602082019050919050565b6000602082019050818103600083015261159481611558565b9050919050565b600081905092915050565b60008190508160005260206000209050919050565b600081546115c8816112ca565b6115d2818661159b565b945060018216600081146115ed57600181146115fe57611631565b60ff19831686528186019350611631565b611607856115a6565b60005b838110156116295781548189015260018201915060208101905061160a565b838801955050505b50505092915050565b600061164682846115bb565b915081905092915050565b600060a082019050611666600083018861110a565b611673602083018761110a565b611680604083018661110a565b61168d606083018561104c565b61169a60808301846113cb565b9695505050505050565b60006116af82610fa0565b91506116ba83610fa0565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156116ef576116ee6112fc565b5b82820190509291505056fea26469706673582212201a655896bb8c9236a15d6faa84ff3e042b2c021b753d4705408876a4e195f3fe64736f6c634300080c0033";

type ERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC20ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC20__factory extends ContractFactory {
  constructor(...args: ERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    _decimals: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ERC20> {
    return super.deploy(
      _name,
      _symbol,
      _decimals,
      overrides || {}
    ) as Promise<ERC20>;
  }
  override getDeployTransaction(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    _decimals: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _name,
      _symbol,
      _decimals,
      overrides || {}
    );
  }
  override attach(address: string): ERC20 {
    return super.attach(address) as ERC20;
  }
  override connect(signer: Signer): ERC20__factory {
    return super.connect(signer) as ERC20__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC20Interface {
    return new utils.Interface(_abi) as ERC20Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): ERC20 {
    return new Contract(address, _abi, signerOrProvider) as ERC20;
  }
}
