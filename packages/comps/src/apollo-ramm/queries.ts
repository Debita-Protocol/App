import { gql } from '@apollo/client';


export const GET_VAULTS = gql`
    query getVaults {
        vaults {
            address:id
            vaultId
            name
            symbol
            marketIds: markets {
                id
            }
            onlyVerified
            asset_limit: assetLimit
            total_asset_limit: totalAssetLimit
            want: underlying {
                address: id
                name
                symbol
                decimals
            }
            totalShares: totalSupply
            totalAssets: totalAssets
            utilizationRate
            exchangeRate
            totalEstimatedAPR
            goalAPR
            totalProtection
            rVault

            # parameters
            N
            sigma
            omega
            delta
            rMarket
            s
            steak
        }
    }
`

export const GET_MARKETS = gql`
    query getMarkets {
        markets {
            marketId:id
            vaultId: vault {
                vaultId
            }
            bondPool {
                address: id
                longZCB{
                    address:id
                    name
                    symbol
                    decimals
                    totalSupply
                }
                shortZCB {
                    address: id
                    name
                    symbol
                    decimals
                    totalSupply
                }
                longZCBPrice
                b_initial
                b
                a_initial
                discountCap
                discountedReserved
            }
            creationTimestamp
          
            # parameters
            N
            sigma
            alpha
            omega
            delta
            rMarket: r
            s
            steak

            duringAssessment
            onlyReputable
            resolved
            alive
            base_budget: baseBudget
            marketCondition
          
            redemptionPrice
            totalCollateral
            approved_principal:approvedPrincipal
            approved_yield: approvedYield
            marketConditionMet: marketCondition 
            validators {
                address:id
            }
            initialStake
            finalStake
            validatorAveragePrice
            validatorNumResolved
            validatorNumApproved
            validatorTotalZCB
            validatorTotalStaked
        }
    }
`

export const GET_INSTRUMENTS = gql`
fragment basic on BaseInstrument {
    # instrument address
    address: id
    name
    marketId: market {
      id
    }
    vaultId: vault {
      vaultId
    }
    # address of the utilizer
    utilizer
    # maybe a better way to do this?
    balance: underlyingBalance
    seniorAPR
    exposurePercentage
    managerStake 
    approvalPrice
    principal
    expectedYield
    duration
    description
  }
query{
    creditlineInstruments{
        ...basic
      }
    generalInstruments{
      ...basic
    }
    poolInstruments {
      ...basic 
      initPrice
      saleAmount
      promisedReturn
      inceptionTime
      inceptionPrice
      poolLeverageFactor:leverageFactor
      totalBorrowedAssets: totalBorrowAssets
      totalSuppliedAssets: totalSupplyAssets
      totalAvailableAssets
      APR:seniorAPR
      managementFee
      collaterals {
        id
        name
        symbol
        decimals
        totalSupplied
        owner
        isERC20
        maxAmount
        borrowAmount
        tokenId
        address: tokenAddress
      }
    }
}
`