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
  PROFILE
} from '../constants';
import PortfolioView from '../portfolio/portfolio-view';
import LiquidityView from '../liquidity/liquidity-view';
import MarketLiquidityView from '../liquidity/market-liquidity-view';
import MintView from "../mint/mint";
import RedeemView from "../redeem/redeem"
import ProposalView from '../proposal/proposal-view';
import BorrowView from "../borrow/borrow-view";
import LoanView from "../loan/loan-view";
import UserProfileView from "../user-profile/user-profile-view";
import ProfileView from "../profile/profile-view";
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
      <Route path={makePath(LOAN)} component={LoanView} />
      <Route path={makePath(USER_PROFILE)} component={UserProfileView} />
      <Route path={makePath(PROFILE)} component={ProfileView} />
      <Redirect to={makePath(MARKETS)} />
    </Switch>
  );
};

export default withRouter(Routes);
