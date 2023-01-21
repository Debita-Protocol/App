import React, { useEffect } from "react";
import { useLocation } from "react-router";
import { HashRouter } from "react-router-dom";

// @ts-ignore
import Styles from "./App.styles.less";

import Routes from "./routes/routes";
import TopNav from "./common/top-nav";
import "../assets/styles/shared.less";
import { SimplifiedProvider, useSimplifiedStore } from "./stores/simplified";
import { Sidebar } from "./sidebar/sidebar";
import classNames from "classnames";
import ModalView from "./modal/modal-view";
import {
  Stores,
  useDataStore,
  useAppStatusStore,
  useFinalizeUserTransactions,
  useUserBalances,
  useRammData,
  useDataStore2,
  PathUtils,
  Constants,
  windowRef,
  Components,
  useUserStore
} from "@augurproject/comps";
import { SimpleFooter } from "./common/simple-footer";
const { MARKET, PORTFOLIO } = Constants;
const { parsePath, parseQuery } = PathUtils;
const {MarketCardProvider} = Components
// const express = require("express");
// const app = express()
// const cors = require("cors");
// app.use(cors(
//   {
//     origin: "*",
//   }));
const AppBody = () => {
  const { markets, cashes, ammExchanges, blocknumber, transactions } = useDataStore();
  const { isMobile, modal, isWalletRpc } = useAppStatusStore();
  const {
    sidebarType,
    showTradingForm,
    actions: { updateMarketsViewSettings },
  } = useSimplifiedStore();
  const modalShowing = Object.keys(modal).length !== 0;
  const location = useLocation();
  const path = parsePath(location.pathname)[0];
  const sidebarOut = sidebarType && isMobile;


  useUserBalances({ ammExchanges, blocknumber, cashes, markets, transactions, isWalletRpc });
  useFinalizeUserTransactions(blocknumber);

  // RAMM
  const { vaults, markets: _markets, instruments } = useDataStore2();

  // useRammData({blocknumber, vaults, markets: _markets, instruments, isWalletRpc});
  // const { ramm } = useUserStore();

  useEffect(() => {
    const parsedQueryString = parseQuery(window.location.search);
    console.log('parsedQueryString', parsedQueryString)

    try {
      if (parsedQueryString && parsedQueryString?.primaryCategory) {
        updateMarketsViewSettings({ primaryCategory: parsedQueryString.primaryCategory });
      }
      if (parsedQueryString && parsedQueryString?.subCategories) {
        updateMarketsViewSettings({ subCategories: parsedQueryString.subCategories.split(",") });
      }
    } catch (error) {
      // shallow bad params error
    }
  }, []);

  useEffect(() => {
    const html: any = windowRef.document.firstElementChild;
    const isHeightUnset = html?.style?.height === "";
    const eitherOr = modalShowing || showTradingForm;
    if (eitherOr && isHeightUnset) {
      html.style.height = "100%";
      html.style.overflow = "hidden";
    } else if (!eitherOr && !isHeightUnset) {
      html.style.height = "";
      html.style.overflow = "";
    }
  }, [modalShowing, showTradingForm]);

  return (
    <div
      id="mainContent"
      className={classNames(Styles.App, {
        [Styles.SidebarOut]: sidebarOut,
        // [Styles.TwoToneContent]: path === MARKET || path === PORTFOLIO,
        [Styles.ModalShowing]: modalShowing || showTradingForm,
      })}
    >
      {modalShowing && <ModalView />}
      {sidebarOut && <Sidebar />}
      <TopNav />
      <Routes />
      <SimpleFooter />
    </div>
  );
};

function App() {
  const {
    AppStatus: { AppStatusProvider },
    ConnectAccount: { ConnectAccountProvider },
    Data: { DataProvider },
    Data2: { DataProvider2 },
    User: { UserProvider },
  } = Stores;
  return (
    <HashRouter hashType="hashbang">
      <ConnectAccountProvider>
        <UserProvider>
          <DataProvider2>
          <DataProvider>
            <AppStatusProvider>
              <SimplifiedProvider>
                <MarketCardProvider>
                  <AppBody />
                </MarketCardProvider>
              </SimplifiedProvider>
            </AppStatusProvider>
          </DataProvider>
          </DataProvider2>
        </UserProvider>
      </ConnectAccountProvider>
    </HashRouter>
  );
}

export default App;