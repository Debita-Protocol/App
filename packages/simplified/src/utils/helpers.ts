import { CoreMarketInfo } from "@augurproject/comps/build/types";
import { BigNumber as BN } from "bignumber.js";

// rounding

export const round = (value: string, decimals: number): string => {
    return new BN(value).decimalPlaces(decimals).toString();
}


//export type MarketStage = "EARLY_ASSESSMENT" | "LATE_ASSESSMENT" |  "APPROVED" | "RESOLVED" | "DENIED";

export enum MarketStage {
    EARLY_ASSESSMENT,
    LATE_ASSESSMENT,
    APPROVED,
    RESOLVED,
    DENIED
  }

export const marketStage = (market: CoreMarketInfo): MarketStage => {
    const { alive, duringAssessment, resolved, onlyReputable } = market;
    if (alive) {
        if (duringAssessment && onlyReputable) {
            return MarketStage.EARLY_ASSESSMENT;
        } else if (duringAssessment && !onlyReputable) {
            return MarketStage.LATE_ASSESSMENT;
        }
        return MarketStage.APPROVED;
    } else if (!alive && resolved) {
        return MarketStage.RESOLVED;
    } else {
        return MarketStage.DENIED;
    }
}