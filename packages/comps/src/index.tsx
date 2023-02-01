import "./assets/styles/shared.less";
import * as _ContractCalls from "./utils/contract-calls";
import * as _ContractCalls2 from "./utils/contract-calls-new";
import * as _Calculations from "./utils/calculations";
import * as _DerivedMarketData from "./utils/derived-market-data";
import addCommasToNumber from "./utils/add-commas-to-number";
import * as _Constants from "./utils/constants";
import { createBigNumber } from "./utils/create-big-number";
import * as DateUtils from "./utils/date-utils";
import * as Formatter from "./utils/format-number";
import * as OddsUtils from "./utils/format-odds";
import getPrecision from "./utils/get-number-precision";
import logError from "./utils/log-error";
import { windowRef } from "./utils/window-ref";
import * as _TeamHelpers from "./utils/team-helpers";
import * as _Icons from "./components/common/icons";
import * as _Inputs from "./components/common/inputs";
import * as _MarketCard from "./components/market-card/market-card";
import {LoanCard} from "./components/loan-card/loan-card-view";
import _Logo, { LinkLogo } from "./components/common/logo";
import * as _Labels from "./components/common/labels";
import * as _Buttons from "./components/common/buttons";
import * as _Selections from "./components/common/selection";
import * as _Pagination from "./components/common/pagination";
import { ConnectAccountProvider as _ConnectAccountProvider } from "./components/ConnectAccount/connect-account-provider";
import { ConnectAccount as _ConnectAccount } from "./components/ConnectAccount/index";
import * as _ConnectHooks from "./components/ConnectAccount/hooks";
import * as _ConnectConstants from "./components/ConnectAccount/constants";
import * as _ConnectConnectors from "./components/ConnectAccount/connectors";
import * as _ConnectUtils from "./components/ConnectAccount/utils";
import { Loader as _Loader } from "./components/ConnectAccount/components/Loader/index";
import { AccountDetails as _AccountDetails } from "./components/ConnectAccount/components/AccountDetails/index";
import _SEO from "./components/common/seo";
import * as Links from "./utils/links/links";
import _parsePath from "./utils/links/parse-path";
import _parseQuery from "./utils/links/parse-query";
import _makePath from "./utils/links/make-path";
import _makeQuery from "./utils/links/make-query";
import _parseStringToArray from "./utils/links/parse-string-to-array";
import * as queries from "./apollo-ramm/queries";
import {
  getCategoryIconLabel,
  CATEGORIES_ICON_MAP as _CATEGORIES_ICON_MAP,
} from "./components/common/category-icons-map";
import _DataStore, { useDataStore, DataStore } from "./stores/data";
import _DataStore2, { useDataStore2, DataStore2 } from "./stores/data-2";
import _UserDataStore, { useUserStore, UserStore } from "./stores/user";
import _AppStatusStore, { useAppStatusStore, AppStatusStore } from "./stores/app-status";
import * as _StoreConstants from "./stores/constants";
import * as _ProcessData from "./stores/process-data";
import { useLocalStorage } from "./stores/local-storage";
import {
  useCanExitCashPosition,
  useCanEnterCashPosition,
  useUserBalances,
  useFinalizeUserTransactions,
  useScrollToTopOnMount,
  getSavedUserInfo,
  getRelatedMarkets,
  getCurrentAmms,
  middleware,
  dispatchMiddleware,
  keyedObjToArray,
  keyedObjToKeyArray,
  arrayToKeyedObject,
  arrayToKeyedObjectByProp,
  useApprovalStatus,
  isMarketFinal,
  useHandleTheming,
} from "./stores/utils";
import {
  useRammData
} from "./stores/utils-2";
import * as _ApprovalHooks from "./stores/use-approval-callback";
import * as _GraphClient from "./apollo/client";
import * as _RammGraphClient from "./apollo-ramm/client";
import ModalConnectWallet from "./components/modal/modal-connect-wallet";
import { ToggleSwitch, BuySellToggleSwitch } from "./components/common/toggle-switch";
import { Toasts } from "./components/toasts/toasts";
import {MarketCardProvider, MarketCardContext} from "./components/market-card/market-card-context"; 
import {market_manager_address, leverage_manager_address} from "./data/constants"; 

export const ContractCalls = _ContractCalls;
export const ContractCalls2 = _ContractCalls2;
export const Calculations = _Calculations;
export const DerivedMarketData = _DerivedMarketData;
export const GraphClient = _GraphClient;
export const RammGraphClient = _RammGraphClient;
export const Stores = {
  AppStatus: _AppStatusStore,
  Data: _DataStore,
  Data2: _DataStore2,
  User: _UserDataStore,
  ConnectAccount: {
    ConnectAccountProvider: _ConnectAccountProvider,
  },
  Hooks: {
    useAppStatusStore,
    useUserStore,
    useDataStore,
    useDataStore2,
    useCanExitCashPosition,
    useCanEnterCashPosition,
    useUserBalances,
    useFinalizeUserTransactions,
    useScrollToTopOnMount,
    useLocalStorage,
    useApprovalStatus,
    useRammData,
    ..._ApprovalHooks,
  },
  Utils: {
    ..._ProcessData,
    getSavedUserInfo,
    getRelatedMarkets,
    getCurrentAmms,
    middleware,
    dispatchMiddleware,
    keyedObjToArray,
    keyedObjToKeyArray,
    arrayToKeyedObject,
    arrayToKeyedObjectByProp,
    isMarketFinal,
    useHandleTheming,
  },
  Constants: _StoreConstants,
};

export const GRAPH_QUERIES = queries;

export const leverageManager = leverage_manager_address; 
export const marketManager = market_manager_address; 
export const ConnectAccount = {
  ConnectAccount: _ConnectAccount,
  ConnectAccountProvider: _ConnectAccountProvider,
  hooks: _ConnectHooks,
  constants: _ConnectConstants,
  connectors: _ConnectConnectors,
  Loader: _Loader,
  AccountDetails: _AccountDetails,
  utils: _ConnectUtils,
};
export const PARA_CONFIG = _StoreConstants.PARA_CONFIG;
export const Constants = { ..._Constants, PARA_CONFIG };
const PathUtils = {
  parsePath: _parsePath,
  parseQuery: _parseQuery,
  makePath: _makePath,
  makeQuery: _makeQuery,
  parseStringToArray: _parseStringToArray,
};
export const Utils = {
  addCommasToNumber,
  createBigNumber,
  DateUtils,
  OddsUtils,
  Formatter,
  getPrecision,
  logError,
  PathUtils,
  windowRef,
  getCategoryIconLabel,
  DerivedMarketData,
  Calculations,
  ..._TeamHelpers,
};
export const PaginationComps = _Pagination;
export const MarketCardComps = _MarketCard;
export const LoanCardComps = LoanCard;
export const Logo = _Logo;
export const ButtonComps = _Buttons;
export const LabelComps = _Labels;
export const InputComps = _Inputs;
export const SelectionComps = { ..._Selections, ToggleSwitch, BuySellToggleSwitch };
export const Icons = {
  ..._Icons,
  CATEGORIES_ICON_MAP: _CATEGORIES_ICON_MAP,
};
export const ApprovalHooks = _ApprovalHooks;
export const ProcessData = _ProcessData;
export const SEO = _SEO;
export const TeamHelpers = _TeamHelpers;
// export extremely commonly used functions as top level non-default exports:
export {
  useAppStatusStore,
  AppStatusStore,
  useLocalStorage,
  useUserStore,
  UserStore,
  useCanExitCashPosition,
  useCanEnterCashPosition,
  useUserBalances,
  useRammData,
  useFinalizeUserTransactions,
  useScrollToTopOnMount,
  useApprovalStatus,
  useDataStore,
  useDataStore2,
  useHandleTheming,
  DataStore,
  DataStore2,
  createBigNumber,
  Formatter,
  DateUtils,
  OddsUtils,
  PathUtils,
  Links,
  windowRef,
  LinkLogo,
  Toasts,
  getCategoryIconLabel,
};
export const Components = {
  ButtonComps,
  ConnectAccount,
  InputComps,
  LabelComps,
  Links,
  Logo,
  LinkLogo,
  Toasts,
  Icons,
  MarketCardComps,
  LoanCardComps,
  PaginationComps,
  SEO,
  SelectionComps,
  MarketCardContext, 
  MarketCardProvider
};
export const Modals = {
  ModalConnectWallet,
};
// create default object
const AugurComps = {
  Components,
  Constants,
  ContractCalls,
  ContractCalls2,
  Calculations,
  GraphClient,
  Icons,
  Stores,
  Utils,
  Modals,
  DerivedMarketData,
};

export default AugurComps;
