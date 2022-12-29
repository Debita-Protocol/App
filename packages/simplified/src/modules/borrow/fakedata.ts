import { UserPoolData, VaultInfo, VaultInfos, InstrumentInfos, Instrument, CoreMarketInfo, PoolInstrument } from "@augurproject/comps/build/types";

export let vaults: VaultInfos = {};
export let instruments: InstrumentInfos = {};

//fake data
let emptyMarket: CoreMarketInfo = {
    bondPool: "0x1",
    marketId: "1",
    vaultId: "0",
    creationTimestamp: "1",
    longZCB: "0x1",
    shortZCB: "0x1",
    parameters: {
        N: "1",
        sigma: "1",
        omega: "1",
        delta: "1",
        r: "1",
        s: "1",
        steak: "1"
    },
    phase: {
        duringAssessment: true,
        onlyReputable: true,
        resolved: false,
        alive: true,
        atLoss: false,
        base_budget: "0"
    },
    approved_principal: "0",
    approved_yield: "0",
    validatorData: {
        validators: [],
        val_cap: "0",
        avg_price: "0",
        totalSales: "0",
        totalStaked: "0",
        numApproved: "0",
        initialStake: "0",
        finalStake: "0",
        numResolved: "0"
    },
    longZCBprice: "0",
    longZCBsupply: "0",
    redemptionPrice: "0",
    totalCollateral: "0"
};

let emptyInstrument: Instrument = {
    marketId: "0",
    utilizer: "0x0",
    vaultId: "0",
    trusted: false,
    balance: "0",
    principal: "0",
    yield: "0",
    duration: "0",
    description: "a test description of the instrument",
    address: "0x1",
    maturityDate: "0",
    name: "test instrument",
    seniorAPR: "0.5",
    exposurePercentage: "25",
    managerStake: "0",
    approvalPrice: "0",
};


export let emptyPoolInstrument: PoolInstrument = {
    name: "test pool",
    marketId: "0",
    vaultId: "0",
    utilizer: "0x0",
    trusted: false,
    description: "a test description of the instrument",
    balance: "0",
    principal: "0",
    yield: "0",
    address: "0x1",
    saleAmount: "0",
    initPrice: "0",
    promisedReturn: "0",
    inceptionTime: "0",
    inceptionPrice: "0",
    poolLeverageFactor: "0",
    totalBorrowedAssets: "0",
    totalSuppliedAssets: "0",
    APR: "0",
    collaterals: [
        {
            address: "0xUSDC",//usdc
            name: "USDC",
            symbol: "USDC",
            borrowAmount: "15",
            maxAmount: "20",
            tokenId: "0",
            isERC20: true
        },
        {
            address: "0xDOGE",//usdc
            name: "DOGE",
            symbol: "DOGE",
            borrowAmount: "15",
            maxAmount: "20",
            tokenId: "0",
            isERC20: true
        },
        {
            address: "0xNFT1",//usdc
            name: "NFT1",
            symbol: "NFT1",
            borrowAmount: "15",
            maxAmount: "20",
            tokenId: "1",
            isERC20: false
        },

    ],
    auctions: [
        {
            auctionId: "1",
            tokenAddress: "0xUSDC",
            tokenId: "0",
            startTime: "0",
            decayConstant: "0",
            initialPrice: "0",
            currentPrice: "0"
        },
        {
            auctionId: "2",
            tokenAddress: "0xDOGE",
            tokenId: "0",
            startTime: "0",
            decayConstant: "0",
            initialPrice: "0",
            currentPrice: "0"
        }
    ]
}

let emptyVault: VaultInfo = {
    vaultId: "1",
    name: "test vault",
    address: "0x1",
    marketIds: [],
    onlyVerified: false,
    default_params: {
        N: "1",
        sigma: "1",
        omega: "1",
        delta: "1",
        r: "1",
        s: "1",
        steak: "1"
    },
    r: "10",
    asset_limit: "0",
    total_asset_limit: "0",
    want: {
        address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",//usdc
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        displayDecimals: 2
    },
    totalShares: "0",
    totalAssets: "0",
    utilizationRate: "0",
    exchangeRate: "0",
    totalEstimatedAPR: "0",
};

export let userPoolData: UserPoolData = {
    marketId: "1",
    vaultId: "1",
    supplyBalances: {
        "0xUSDC": {
            "0": "100"
        },
        "0xDOGE": {
            "0": "100"
        },
        "0xNFT1": {
            "1": "1"
        }
    },
    walletBalances: {
        "0xUSDC": {
            "0": "50.1414"
        },
        "0xDOGE": {
            "0": "200"
        },
        "0xNFT1": {
            "1": "1"
        }
    },
    borrowBalance: {
        shares: "5.221",
        amount: "10.6"
    },
    accountLiquidity: "50",
    remainingBorrowAmount: "5"
}

let _markets = {};
for (let i = 1; i < 10; i++) {
    let vault: any = {};
    Object.assign(
        vault,
        emptyVault,
        {
            vaultId: i.toString(),
            address: "0x" + i.toString(),
            marketIds: []
        }
    );
    for (let j = i + (i - 1); j < i + (i - 1) + 2; j++) {
        vault.marketIds.push(j.toString());
        Object.assign(
            _markets,
            {
                [j.toString()]: {
                    ...emptyMarket,
                    vaultId: i.toString(),
                    longZCB: "0x" + j.toString(),
                    shortZCB: "0x" + j.toString(),
                    marketId: j.toString()
                }
            }
        );
        Object.assign(instruments,
            {
                [j.toString()]: {
                    ...emptyPoolInstrument,
                    vaultId: i.toString(),
                    marketId: j.toString(),
                    utilizer: "0x" + j.toString()
                }
            })
    }
    Object.assign(vaults, { [i.toString()]: vault });
}