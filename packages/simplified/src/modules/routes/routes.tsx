import React from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import { Utils } from '@augurproject/comps';
import MarketsView from '../markets/markets-view';
import MarketView from '../market/market-view';

import {
  MARKETS,
  MARKET,
  PORTFOLIO,
  LIQUIDITY,
  MARKET_LIQUIDITY,
  MINT,
  PROPOSAL,
  BORROW,
  REDEEM
} from '../constants';
import PortfolioView from '../portfolio/portfolio-view';
import LiquidityView from '../liquidity/liquidity-view';
import MarketLiquidityView from '../liquidity/market-liquidity-view';
import MintView from "../mint/mint";
import RedeemView from "../redeem/redeem"
import ProposalView from '../proposal/proposal-view';
import BorrowView from "../borrow/borrow-view";
import LoanView from "../loan/loan-view";
//import MintDSView from '../mint-ds/mint-ds-view';
const { PathUtils: { makePath } } = Utils;

const Routes = p => {
  return (
    <Switch>
      <Route path={makePath(PORTFOLIO)} component={PortfolioView} />
      <Route path={makePath(MARKETS)} component={MarketsView} />
      <Route path={makePath(MARKET)} component={MarketView} />
      <Route path={makePath(LIQUIDITY)} component={LiquidityView} />
      <Route path={makePath(MINT)} component={MintView} />
      <Route path={makePath(REDEEM)} component={RedeemView} />
      <Route path={makePath(PROPOSAL)} component={ProposalView} />
      <Route path={makePath(MARKET_LIQUIDITY)} component={MarketLiquidityView} />
      <Route path={makePath(BORROW)} component={BorrowView} />
      <Route path={makePath("loan")} component={LoanView} />
      <Redirect to={makePath(MARKETS)} />
    </Switch>
  );
};

export default withRouter(Routes);
