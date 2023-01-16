import React, { useMemo, useEffect, useState, useContext  } from "react";
import classNames from "classnames";

import Styles from "./market-card.styles.less";
import { AmmExchange, AmmOutcome, MarketInfo, MarketOutcome } from "../../types";
import { formatApy, formatLiquidity, formatCashPrice, formatDai } from "../../utils/format-number";
import { getMarketEndtimeFull } from "../../utils/date-utils";
import { CategoryIcon, CategoryLabel, ReportingStateLabel, ValueLabel } from "../common/labels";
import { MARKET_FACTORY_TYPES, MARKET_STATUS, TWELVE_HOUR_TIME } from "../../utils/constants";
import { MarketLink,VaultLink } from "../../utils/links/links";
import { ConfirmedCheck } from "../common/icons";
import { TinyThemeButton } from "../common/buttons";

import { MarketCardContext } from './market-card-context'; 
import {useUserStore} from "../../stores/user"; 
import {useDataStore2} from "../../stores/data-2"; 

// import {isBorrowerApproved} from "../../utils/contract-calls"; 

export const LoadingMarketCard = () => {
  return (
    <article className={Styles.LoadingMarketCard}>
      <div>
        <div />
        <div />
        <div />
      </div>
      <div>
        <div />
        <div />
        <div />
      </div>
      <div>
        <div />
        <div />
        <div />
      </div>
    </article>
  );
};

export const MarketCard = ({ marketId, markets, ammExchanges, ...props }) => {
  const market: MarketInfo = useMemo(() => markets[marketId], [marketId, markets]);
  const amm: AmmExchange = useMemo(() => ammExchanges[marketId], [marketId, ammExchanges]);
  if (!market) return <LoadingMarketCard />;
  return <MarketCardView {...{ amm, market, ...props}} />;
};

export const combineOutcomeData = (ammOutcomes: AmmOutcome[], marketOutcomes: MarketOutcome[]) => {
  if (!ammOutcomes || ammOutcomes.length === 0) return [];
  return marketOutcomes.map((mOutcome, index) => ({
    ...mOutcome,
    ...ammOutcomes[index],
  }));
};

export const outcomesToDisplay = (ammOutcomes: AmmOutcome[], marketOutcomes: MarketOutcome[]) => {
  const combinedData = combineOutcomeData(ammOutcomes, marketOutcomes);
  const invalid = combinedData.slice(0, 1);
  const yes = combinedData.slice(2, 3);
  const no = combinedData.slice(1, 2);
  let newOrder = invalid.concat(yes).concat(no).concat(combinedData.slice(3));
  if (newOrder[0].isFinalNumerator && newOrder[0].payoutNumerator !== "0" && newOrder[0].payoutNumerator !== null) {
    // invalid is winner -- only pass invalid
    newOrder = invalid;
  } else {
    newOrder = newOrder.filter((outcome) => !outcome.isInvalid);
  }
  return newOrder;
};

export const orderOutcomesForDisplay = (
  ammOutcomes: AmmOutcome[] = [],
  marketFactoryType: string = MARKET_FACTORY_TYPES.SPORTSLINK
): AmmOutcome[] => {
  if (marketFactoryType !== MARKET_FACTORY_TYPES.CRYPTO)
    return ammOutcomes.length > 0 && ammOutcomes[0].id === 0
      ? ammOutcomes.slice(1).concat(ammOutcomes.slice(0, 1))
      : ammOutcomes;
  return ammOutcomes;
};

export const unOrderOutcomesForDisplay = (ammOutcomes: AmmOutcome[]): AmmOutcome[] =>
  ammOutcomes.slice(-1).concat(ammOutcomes.slice(0, -1));

const OutcomesTable = ({ amm }: { amm: AmmExchange }) => {
  const {
    market: { hasWinner, winner },
    hasLiquidity,
  } = amm;
  const content = hasWinner ? (
    <div className={Styles.WinningOutcome}>
     {/* <span>Winning Outcome</span>
      <span>{amm.ammOutcomes.find((o) => o.id === winner)?.name}</span> */}
      <span>Instrument Status</span>
      <span>{"Success"}</span>
      {ConfirmedCheck}
    </div>
  ) : (
    orderOutcomesForDisplay(amm.ammOutcomes, amm?.market?.marketFactoryType)
      .slice(0, 3)
      .map((outcome) => {
        const OutcomePrice = formatCashPrice(outcome.price, amm?.cash?.name).full


        //  !hasLiquidity || isNaN(Number(outcome?.price)) || Number(outcome?.price) <= 0
         //   ? `-`
         //   : formatCashPrice(outcome.price, amm?.cash?.name).full;


        return (
          <div key={`${outcome.name}-${amm?.marketId}-${outcome.id}`}>
            <span>{outcome.name.toLowerCase()}</span>
            <span>{OutcomePrice}</span>
          </div>
        );
      })
  );
  return (
    <div
      className={classNames(Styles.OutcomesTable, {
        [Styles.hasWinner]: hasWinner,
      })}
    >
      {content}
    </div>
  );
};

export const MarketTitleArea = ({
  title = null,
  description = null,
  startTimestamp,
  timeFormat = TWELVE_HOUR_TIME,  
  marketFactoryType,
}: any) => (
  <span>
    <span>
      {!!title && <span>{title}</span>}
      {!!description && <span>{description}</span>}
    </span>
    <span>{marketFactoryType === MARKET_FACTORY_TYPES.CRYPTO ? `End Time: `: ``}{getMarketEndtimeFull(startTimestamp, timeFormat)}</span>
  </span>
);

export const VaultCardView = ({
  vaultId, 
}) =>{
   const titles = ["Flint Dao Creditline", "USDC lending in Fuse pool #3", "OTM BTC Put Short Position in weekly expiries", "Looping Yield Protocol fixed rate lending", "Kao Dao Creditline", "ETH+BTC Spot", "USDC lending in Fuse pool #3" ];
  const descriptions = ["Assess Flint Dao's creditworthiness", "Long or Short Isolated Lending Positions", "Long or Short Options selling positions", "Long or Short Leveraged Yield positions", "Assess Kao Dao's creditworthiness", "Long or Short Spot Positions","Long or Short Isolated Lending Positions"] 
  const { vaults: vaults, instruments: instruments, markets: market_ } = useDataStore2()
  console.log('vaults', vaults, instruments, market_)
  const goalApr = vaults[vaultId]?.goalAPR; 
  return (
    <article
      className={classNames(Styles.MarketCard, {
        [Styles.NoLiquidity]: false,
        [Styles.Popular]: true,
      })}
    >
      <VaultLink id={vaultId} dontGoToMarket={false}>
        <article
          className={classNames({
            [Styles.Trading]: true//reportingState === MARKET_STATUS.TRADING,
          })}
        >
         {/* <CategoryLabel {...{ categories }} />  
          <ReportingStateLabel {...{ reportingState }} />*/}
        {/*  <CategoryIcon {...{ categories }} /> */ }
          <div>
            {/*(
              <TinyThemeButton
                customClass={Styles.NoLiquidityPill}
                action={() => {}}
                text={"text"}
                disabled
              />)*/}
          <ValueLabel label="Estimated APR" value={Number(goalApr) == 0 ? "10"+"%": goalApr + "%"} />

          {/* {marketHasNoLiquidity ? (
              <TinyThemeButton
                customClass={Styles.NoLiquidityPill}
                action={() => {}}
                text={"Discretionary Loan"}
                disabled
              />
            ) : (
              <ValueLabel label="Liquidity Provider APR" value={formattedApy || "-"} />
            )} */}

          </div> 

          {/*<div>
            {(
              <ValueLabel label="Short CDS APR" value={formattedApy || "-"} />
            )} 
          </div> */}
    <div>
            {(
              <ValueLabel label="Underlying" value={vaults[vaultId]?.want.name} />
            )}
          </div>

        </article>
        <section>
          {/*<MarketTitleArea {...{ ...market, timeFormat }} /> */}
          <MarketTitleArea title={vaults[vaultId].name} description={"Description"} />

          <ValueLabel label="TVL" value={vaults[vaultId].totalAssets} />
          <ValueLabel label="Investing Restrictions" value={ vaults[vaultId].onlyVerified? "Only Verified": "None "} />
          {/*<ValueLabel label="Number of Instruments" value={ "-"} />*/}

    { /*     <ValueLabel label="Projected Yield" value={marketHasNoLiquidity ? "-" : formattedLiquidity || "-"} />
          <ValueLabel label="Term" value={marketHasNoLiquidity ? "-" : formattedLiquidity || "-"} /> */}

         {/* <OutcomesTable {...{ amm }} />
          {!hasWinner && extraOutcomes > 0 && (
            <span className={Styles.ExtraOutcomes}>{`+ ${extraOutcomes} more Outcomes`}</span>
          )} */}

        </section>

      </VaultLink>
       {/* <button onClick={() => handleChange(market.turboId)} >
          Select 
        </button>  */}
        

    </article>
  );
}
export const MarketCardView = ({
  amm,
  market,
  marketTransactions,
  handleNoLiquidity = (market: MarketInfo) => {},
  noLiquidityDisabled = false,
  timeFormat = TWELVE_HOUR_TIME,
}: {
  amm: AmmExchange;
  market: MarketInfo;
  marketTransactions?: any;
  handleNoLiquidity?: Function;
  noLiquidityDisabled?: boolean;
  timeFormat?: string;
}) => {


  const[isApproved, setIsApproved] = useState(false)
   const {formData, handleChange} = useContext(MarketCardContext);
   //console.log('market in marketcard', amm, market);
       const {
    account,
    loginAccount,
    balances,
    actions: { addTransaction },
    } = useUserStore();

  useEffect(async() => {
    if (account && loginAccount.library) {
      let approved = false;
      // approved = await isBorrowerApproved(account, loginAccount.library)
      setIsApproved(approved); 
    }
  }, [account, loginAccount])


  const { categories, marketId, reportingState, hasWinner } = market;
  const formattedLiquidity = useMemo(() => formatLiquidity(amm?.liquidityUSD || "0.00", { bigUnitPostfix: true }).full, [amm?.liquidityUSD]);
  const formattedApy = useMemo(() => marketTransactions?.apy && formatApy(marketTransactions.apy).full, [
    marketTransactions?.apy,
  ]);
  const formattedVol = useMemo(
    () => marketTransactions?.volumeTotalUSD && formatDai(marketTransactions.volumeTotalUSD, { bigUnitPostfix: true }).full,
    [marketTransactions?.volumeTotalUSD]
  );
  const extraOutcomes = amm?.ammOutcomes?.length - 3;
  const marketHasNoLiquidity = !amm?.id && !market.hasWinner;

  //Example Types 
  const types = ["Discretionary Loan", "Isolated Lending", "Options Selling", "Leveraged Yield Farming", "Discretionary Loan", "Spot Allocation","Isolated Lending"]; 
  const titles = ["Flint Dao Creditline", "USDC lending in Fuse pool #3", "OTM BTC Put Short Position in weekly expiries", "Looping Yield Protocol fixed rate lending", "Kao Dao Creditline", "ETH+BTC Spot", "USDC lending in Fuse pool #3" ];
  const descriptions = ["Assess Flint Dao's creditworthiness", "Long or Short Isolated Lending Positions", "Long or Short Options selling positions", "Long or Short Leveraged Yield positions", "Assess Kao Dao's creditworthiness", "Long or Short Spot Positions","Long or Short Isolated Lending Positions"] 
  const marketisApproved = ["True", "True", "True", "True", "True", "True", "False"]; 
  const principals = ["1000$", "3000$", "2500$","1400$", "4200$", "500$", "3200"]; 
  const aprs = ["100$", "120$","150$", "320$", "210$", "80$", "120$"]; 
  const durations = ["120 days", "1 Year", "30days", "60days", "1 Year", "10 days", "30days"]; 



  return (
    <article
      className={classNames(Styles.MarketCard, {
        [Styles.NoLiquidity]: !amm?.id,
        [Styles.Popular]: market?.isPopular,
      })}
    >
      <MarketLink id={marketId} dontGoToMarket={false}>
        <article
          className={classNames({
            [Styles.Trading]: reportingState === MARKET_STATUS.TRADING,
          })}
        >
         {/* <CategoryLabel {...{ categories }} />  */}
          <ReportingStateLabel {...{ reportingState }} />
        {/*  <CategoryIcon {...{ categories }} /> */ }
          <div>
            <ReportingStateLabel {...{ reportingState }} />
            {marketHasNoLiquidity && (
              <TinyThemeButton
                customClass={Styles.NoLiquidityPill}
                action={() => {}}
                text={types[amm?.turboId-1]}
                disabled
              />)}


          {/* {marketHasNoLiquidity ? (
              <TinyThemeButton
                customClass={Styles.NoLiquidityPill}
                action={() => {}}
                text={"Discretionary Loan"}
                disabled
              />
            ) : (
              <ValueLabel label="Liquidity Provider APR" value={formattedApy || "-"} />
            )} */}

          </div> 

          {/*<div>
            {(
              <ValueLabel label="Short CDS APR" value={formattedApy || "-"} />
            )} 
          </div> */}
    <div>
            {(
              <ValueLabel label="Is Approved" value={marketisApproved[amm?.turboId-1]} />
            )}
          </div>

        </article>
        <section>
          {/*<MarketTitleArea {...{ ...market, timeFormat }} /> */}
          <MarketTitleArea title={"s"} description={descriptions[amm?.turboId-1]} />

          <ValueLabel label="Principal" value={principals[amm?.turboId-1] || "-"} />
          <ValueLabel label="Projected Return" value={aprs[amm?.turboId-1] || "-"} />
          <ValueLabel label="Term" value={durations[amm?.turboId-1] || "-"} />

    { /*     <ValueLabel label="Projected Yield" value={marketHasNoLiquidity ? "-" : formattedLiquidity || "-"} />
          <ValueLabel label="Term" value={marketHasNoLiquidity ? "-" : formattedLiquidity || "-"} /> */}

          <OutcomesTable {...{ amm }} />
          {!hasWinner && extraOutcomes > 0 && (
            <span className={Styles.ExtraOutcomes}>{`+ ${extraOutcomes} more Outcomes`}</span>
          )}

        </section>

      </MarketLink>
       {/* <button onClick={() => handleChange(market.turboId)} >
          Select 
        </button>  */}
        

    </article>
  );
};
