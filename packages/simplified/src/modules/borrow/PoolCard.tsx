import React, {useMemo} from "react"
import Styles from "./borrow-view.styles.less";
import { Link } from "react-router-dom";
import makePath from "@augurproject/comps/build/utils/links/make-path";
import makeQuery from "@augurproject/comps/build/utils/links/make-query";
import {
    Constants,
    Components
} from "@augurproject/comps";
import { InstrumentInfos, CoreInstrumentData, VaultInfos, NFT } from "@augurproject/comps/build/types";

const { 
    LabelComps: {ValueLabel} 
} = Components;
const {
    MARKET_ID_PARAM_NAME
} = Constants;

export const PoolCard: React.FC = ({
    marketId,
    instruments,
    vaults,
    ...props
}): {
    marketId: string,
    instruments: InstrumentInfos,
    vaults: VaultInfos
} => {
    const instrument: CoreInstrumentData = useMemo(() => instruments[marketId], [marketId, instruments]);
    if (!instrument) {
        return <LoadingPoolCard/>;
    }
    const { vaultId, utilizer, poolData: {leverageFactor, NFTs: acceptedNFTs } } = instrument;

    return (
        <PoolCardView
            marketId={marketId}
            vaultId={vaultId}
            utilizer={utilizer}
            collateral={acceptedNFTs}
            leverageFactor={leverageFactor}
            {...props}
        />
    )
}

const NFTItem: React.FC = ({nft}: {nft: NFT})  => {
    const { address, name, symbol, tokenURI } = nft;
    return (
        <td className={Styles.nftItem}>
            <ul className="nftSymbol">
                { symbol }
            </ul>
            {/* <ul className="nftName">
                { name }
            </ul> */}
            {/* <ul className="nftAddress">
                { address }
            </ul> */}
        </td>
    );
}

const PoolCardView: React.FC = ({
    marketId,
    vaultId,
    utilizer,
    collateral,
    leverageFactor,
    dontGoToMarket=false
}: {
    marketId: string,
    vaultId: string,
    utilizer: string,
    collateral: NFT[],
    leverageFactor: string,
    dontGoToMarket?: boolean
}) => {

    return (<tr>
            <td>
                { marketId }
            </td>
            <td>
                { vaultId }
            </td>
            <td>
                { utilizer }
            </td>
            <td>
                { leverageFactor }
            </td>
            <td>
            { (collateral && collateral.length > 0) ?(
                collateral.map((nft: NFT) => {
                    return (
                        <NFTItem
                            key={nft.name}
                            nft={nft}
                        />
                    )
                }) 
            ) : (
                null
            )}
            </td>
            
            <td>
                <div>
                <Link
                    data-testid={`link-${marketId}`}
                    to={
                        !dontGoToMarket
                        ? {
                            pathname: makePath("pool"),
                            search: makeQuery({
                                [MARKET_ID_PARAM_NAME]: marketId,
                            }),
                            }
                            : null
                        }
                >
                    Select
                </Link>
                </div>
                
            </td>
    </tr>
    )
}

export const LoadingPoolCard = () => {
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