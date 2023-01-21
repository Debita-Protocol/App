import React, { useState, useEffect, useMemo } from "react";
// @ts-ignore
import Styles from "./portfolio-view.styles.less";
import Activity from "./activity";
import { PositionsLiquidityViewSwitcher, NFTPositionsLiquidityViewSwitcher, ZCBPositionTable, VaultPositionTable } from "../common/tables";
import { PositionsView } from "../common/portfolio"
import { AppViewStats } from "../common/labels";
import _ from "lodash";
import { BigNumber as BN} from "bignumber.js";
import {
  ContractCalls,
  Formatter,
  Icons,
  Constants,
  createBigNumber,
  Stores,
  SEO,
  ButtonComps,
  LabelComps,
  Utils,
  useDataStore2,
} from "@augurproject/comps";
import { PORTFOLIO_HEAD_TAGS } from "../seo-config";
import { Cash } from "@augurproject/comps/build/types";
import BigNumber from "bignumber.js";
import { ZERO } from "modules/constants";
import { MaticIcon } from "@augurproject/comps/build/components/common/icons";
import ProfileView from "../profile/profile-view"; 
const {
  Formatter: { formatCash },
} = Utils;
const { NetworkMismatchBanner } = LabelComps;
const { claimWinnings, claimFees } = ContractCalls;
const { formatEther } = Formatter;
const { ACTIVITY, TABLES, TX_STATUS, USDC } = Constants;
const {
  Hooks: { useDataStore, useAppStatusStore, useScrollToTopOnMount, useUserStore },
  Utils: { keyedObjToArray },
} = Stores;
const { UsdIcon } = Icons;
const { PrimaryThemeButton } = ButtonComps;

const calculateTotalWinnings = (claimbleMarketsPerCash): { total: BigNumber; ids: string[]; address: string }[] => {
  const factories = claimbleMarketsPerCash.reduce(
    (p, { ammExchange: { turboId, marketFactoryAddress }, claimableWinnings: { claimableBalance } }) => {
      const factory = p[marketFactoryAddress] || { total: ZERO, ids: [] };
      factory.total = factory.total.plus(createBigNumber(claimableBalance));
      factory.ids.push(turboId);
      factory.address = marketFactoryAddress;
      return { ...p, [marketFactoryAddress]: factory };
    },
    {}
  );
  return Object.values(factories);
};

export const getClaimAllMessage = (cash: Cash): string => `Claim All ${cash?.name} Winnings`;
export const getClaimFeesMessage = (cash: Cash): string => `Claim All ${cash?.name} Fees`;

const handleClaimAll = (loginAccount, cash, ids, address, addTransaction, canClaim, setPendingClaim) => {
  const from = loginAccount?.account;
  const chainId = loginAccount?.chainId;
  if (from && canClaim) {
    setPendingClaim(true);
    claimWinnings(from, loginAccount?.library, ids, address)
      .then((response) => {
        // handle transaction response here
        setPendingClaim(false);
        if (response) {
          const { hash } = response;
          addTransaction({
            hash,
            chainId,
            seen: false,
            status: TX_STATUS.PENDING,
            from,
            addedTime: new Date().getTime(),
            message: getClaimAllMessage(cash),
            marketDescription: "",
          });
        }
      })
      .catch((error) => {
        setPendingClaim(false);
        console.log("Error when trying to claim winnings: ", error?.message);
        addTransaction({
          hash: `claim-all-failed${Date.now()}`,
          chainId,
          seen: false,
          status: TX_STATUS.FAILURE,
          from,
          addedTime: new Date().getTime(),
          message: getClaimAllMessage(cash),
          marketDescription: "",
        });
      });
  }
};

const handleClaimFees = (loginAccount, cash, ids, address, addTransaction, canClaim, setPendingClaimFees) => {
  const from = loginAccount?.account;
  const chainId = loginAccount?.chainId;
  if (from && canClaim) {
    setPendingClaimFees(true);
    claimFees(from, loginAccount?.library, address)
      .then((response) => {
        // handle transaction response here
        setPendingClaimFees(false);
        if (response) {
          const { hash } = response;
          addTransaction({
            hash,
            chainId,
            seen: false,
            status: TX_STATUS.PENDING,
            from,
            addedTime: new Date().getTime(),
            message: getClaimFeesMessage(cash),
            marketDescription: "",
          });
        }
      })
      .catch((error) => {
        setPendingClaimFees(false);
        console.log("Error when trying to claim winnings: ", error?.message);
      });
  }
};

export const RewardsSection = () => {
  const { balances } = useUserStore();
  const total = formatEther(balances?.totalRewards || "0").formatted;
  return (
    <div className={Styles.RewardsSection}>
      <div>
        <span>Available Liquidity Provider Reward</span>
        <span>(Will be claimed automatically when removing liquidity per market)</span>
      </div>
      <div>
        <span>
          {total}
          {MaticIcon}
        </span>
      </div>
    </div>
  );
};

export const ClaimWinningsSection = () => {
  const { isLogged } = useAppStatusStore();
  const {
    balances: { marketShares, claimableFees },
    loginAccount,
    transactions,
    actions: { addTransaction },
  } = useUserStore();
  const [pendingClaim, setPendingClaim] = useState(false);
  const [pendingClaimFees, setPendingClaimFees] = useState(false);
  const { cashes } = useDataStore();
  const claimableMarkets = marketShares ? keyedObjToArray(marketShares).filter((m) => !!m?.claimableWinnings) : [];
  const keyedCash = keyedObjToArray(cashes);
  const usdcCash = keyedCash.find((c) => c?.name === USDC);
  const MarketFactoryTotals = calculateTotalWinnings(claimableMarkets);
  const hasClaimableFees = createBigNumber(claimableFees || "0").gt(0);
  const disableClaimUSDCWins =
    pendingClaim ||
    Boolean(transactions.find((t) => t.message === getClaimAllMessage(usdcCash) && t.status === TX_STATUS.PENDING));
  const disableClaimUSDCFees =
    pendingClaimFees ||
    Boolean(transactions.find((t) => t.message === getClaimFeesMessage(usdcCash) && t.status === TX_STATUS.PENDING));
  if (!isLogged || (MarketFactoryTotals.length === 0 && !hasClaimableFees)) return null;
  return (
    <div className={Styles.ClaimableWinningsSection}>
      {isLogged &&
        MarketFactoryTotals.length > 0 &&
        MarketFactoryTotals.map((factory) => (
          <PrimaryThemeButton
            key={factory.address}
            text={
              !pendingClaim
                ? `Claim Winnings (${formatCash(factory.total, usdcCash?.name).full})`
                : `Waiting for Confirmation`
            }
            subText={pendingClaim && `(Confirm this transaction in your wallet)`}
            disabled={disableClaimUSDCWins}
            icon={!pendingClaim && UsdIcon}
            action={() => {
              handleClaimAll(
                loginAccount,
                usdcCash,
                factory.ids,
                factory.address,
                addTransaction,
                true,
                setPendingClaim
              );
            }}
          />
        ))}
      {isLogged &&
        hasClaimableFees &&
        MarketFactoryTotals.map((factory) => (
          <PrimaryThemeButton
            text={
              !pendingClaimFees ? `Claim Fees (${formatCash(claimableFees, USDC).full})` : `Waiting for Confirmation`
            }
            disabled={disableClaimUSDCFees}
            action={() => {
              handleClaimFees(
                loginAccount,
                usdcCash,
                factory.ids,
                factory.address,
                addTransaction,
                true,
                setPendingClaimFees
              );
            }}
          />
        ))}
    </div>
  );
};

export const PortfolioView = () => {
  const { isMobile } = useAppStatusStore();
  const { ramm: { reputationScore, vaultBalances, zcbBalances}} = useUserStore();
  const { markets, instruments, vaults } = useDataStore2()
  const [view, setView] = useState(TABLES);

  const _zcbBalances = useMemo(() => {
    if (Object.entries(zcbBalances).length > 0) {
      return _.map(zcbBalances, (item, key) => {
        console.log("item", item);
        const { duringAssessment, alive, resolved, bondPool: {
          longZCBPrice,
        } } = markets[key]

        const { name } = instruments[key]

        const shortZCBPrice = new BN(1).minus(new BN(longZCBPrice)).toFixed(4);
        return {
          name: name,
          long: item.longZCB,
          short: item.shortZCB,
          marketId: key,
          approved: alive && duringAssessment ? false : true,
          resolved: alive && resolved ? true : false,
          visible: alive && (Number(item.longZCB) > 0 || Number(item.shortZCB) > 0) ? true : false,
          longPrice: longZCBPrice,
          shortPrice: shortZCBPrice,
        }
      })
    }
    return [];
  }, [zcbBalances])

  const _vaultBalances = useMemo(() => {
    if (Object.entries(vaultBalances).length > 0) {
      return _.map(vaultBalances, (item, key) => {
        const { name, totalEstimatedAPR, exchangeRate, totalAssets, want: {symbol }} = vaults[key]
        const { base, shares} = item;
        return {
          name: name,
          symbol: symbol,
          shares: shares,
          totalAssets: totalAssets,
          totalEstimatedAPR: totalEstimatedAPR,
          exchangeRate: exchangeRate,
          visible: Number(shares) > 0 ? true : false,
          vaultId: key
        }
      })
    }
    return [];
  }, [vaults, vaultBalances])
  console.log("vaultBalances", _vaultBalances)

  useScrollToTopOnMount();

  useEffect(() => {
    if (!isMobile) setView(TABLES);
  }, [isMobile]);
  return (
    <div className={Styles.PortfolioView}>
      <SEO {...PORTFOLIO_HEAD_TAGS} />
      <section>
        <NetworkMismatchBanner />
        <AppViewStats portfolioPage = {true} small trading />
        <ClaimWinningsSection />
        {/*<PositionsLiquidityViewSwitcher
          showActivityButton={isMobile}
          setTables={() => setView(TABLES)}
          setActivity={() => setView(ACTIVITY)}
          claimableFirst
        />*/}
        
        {view === ACTIVITY && <Activity />}
        {/*<PositionsView portfolioPage = {true} />*/}
        {/* <ProfileView/> */}
        <div className={Styles.zcb}>
          <h2>Manager Positions</h2>
          <br />
          <ZCBPositionTable positions={_zcbBalances}/>
        </div>
        
        <div className={Styles.VaultBalances}>
          <h2>Vault Positions</h2>
          <br />
          <VaultPositionTable positions={_vaultBalances}/>
        </div>



        {view === ACTIVITY && <Activity />}
      </section>

     {/* <section>
        <Activity />
      </section> */}
    </div>
  );
};

export default PortfolioView;
