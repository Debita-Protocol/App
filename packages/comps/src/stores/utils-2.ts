import {useEffect} from "react";
import {useUserStore} from "./user";
import { getRammData } from "../utils/contract-calls-new";
import { getDefaultProvider } from "../components/ConnectAccount/utils";

export const useRammData = ({markets, blocknumber, vaults, isWalletRpc}) => {
    const {
        loginAccount,
        actions: { updateRammData },
      } = useUserStore();

      useEffect(() => {
        const fetchRammData = async (library, account, vaults, markets) => {
            const provider = isWalletRpc ? library : getDefaultProvider() || library;
            const currentBlockNumber = library ? await library.getBlockNumber() : 0;
            return getRammData(account, provider, vaults, markets, currentBlockNumber);
        }
        

        if (loginAccount?.library && loginAccount?.account) {
            fetchRammData(loginAccount.library, loginAccount.account, vaults, markets)
              .then((ramm) => updateRammData(ramm))
              .catch((e) => console.error(e, "error fetching user balances, will try again"));
          }
          console.log('blocknumber', blocknumber); 
      }, [loginAccount?.account, loginAccount?.library, blocknumber]);
}