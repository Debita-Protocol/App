// This file is updated by deployer.
import { AddressMapping } from "./constants";
export const n = "0x0000000000000000000000000000000000000000";
const emptyMapping = {
    reputationToken: n,
    controller: n,
    marketManager: n,
    vaultFactory: n,
    syntheticZCBFactory: n,
    fetcher: n
}
export const addresses: AddressMapping = {
    137: {
        ...emptyMapping
    },
    80001: {
        ...emptyMapping
    }
};

