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
  REDEEM,
  LOAN,
  USER_PROFILE,
  PROFILE,
  CREDITLINE
} from '../constants';
import PortfolioView from '../portfolio/portfolio-view';
import LiquidityView from '../liquidity/liquidity-view';
import MarketLiquidityView from '../liquidity/market-liquidity-view';
import MintView from "../mint/mint";
import RedeemView from "../redeem/redeem"
import ProposalsView from '../proposals/proposals-view';
import BorrowView from "../borrow/borrow-view";
import LoanView from "../loan/loan-view";
import ProfileView from "../profile/profile-view";
import CreditLineProposalView from "../creditline-proposal/creditline-proposal-view";
import CreditlineView from "../creditline/creditline-view";
import InstrumentProposalView from "../instrument-proposal/instrument-proposal-view";

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
      <Route path={makePath([PROPOSAL, CREDITLINE])} component={CreditLineProposalView} />
      <Route path={makePath([PROPOSAL, "other"])} component={InstrumentProposalView} />
      <Route path={makePath(PROPOSAL)} component={ProposalsView} />
      <Route path={makePath(MARKET_LIQUIDITY)} component={MarketLiquidityView} />
      <Route path={makePath(LOAN)} component={LoanView} />
      <Route path={makePath(PROFILE)} component={ProfileView} />
      <Route path={makePath(CREDITLINE)} component={CreditlineView} />
      <Redirect to={makePath(MARKETS)} />
    </Switch>
  );
};

export default withRouter(Routes);
