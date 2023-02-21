import { CoreMarketInfo, Instrument } from "@augurproject/comps/build/types";
import { CASH_LABEL_FORMATS } from "@augurproject/comps/build/utils/constants";
import { BigNumber as BN } from "bignumber.js";

// rounding

export const round = (value: string, decimals: number): string => {
    return new BN(value).decimalPlaces(decimals).toString();
}


//export type MarketStage = "EARLY_ASSESSMENT" | "LATE_ASSESSMENT" |  "APPROVED" | "RESOLVED" | "DENIED";

export enum MarketStage {
    ASSESSMENT,
    APPROVED,
    RESOLVED,
    DENIED
  }

export enum InstrumentType {
    FIXED,
    PERPETUAL
}

export const getInstrumentType = (instrument: Instrument): InstrumentType => {
    if (Number(instrument.duration) === 0 ) {
        return InstrumentType.PERPETUAL;
    } 
    return InstrumentType.FIXED;
}

export const getMarketStage = (market: CoreMarketInfo): MarketStage => {
    const { alive, duringAssessment, resolved, onlyReputable } = market;
    if (alive) {
        if (duringAssessment) {
            return MarketStage.ASSESSMENT;
        }
        return MarketStage.APPROVED;
    } else if (!alive && resolved) {
        return MarketStage.RESOLVED;
    } else {
        return MarketStage.DENIED;
    }
}

export const getMarketStageLabel = (market: CoreMarketInfo): string => {
    const stage = getMarketStage(market);
    switch (stage) {
        case MarketStage.ASSESSMENT:
            return "Assessment";
        case MarketStage.APPROVED:
            return "Approved";
        case MarketStage.RESOLVED:
            return "Resolved";
        case MarketStage.DENIED:
            return "Denied";
    }
}