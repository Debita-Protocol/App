import { CoreMarketInfo, Instrument } from "@augurproject/comps/build/types";
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

export const marketStageLabel = (market: CoreMarketInfo): string => {
    const stage = getMarketStage(market);
    switch (stage) {
        case MarketStage.EARLY_ASSESSMENT:
            return "Early Assessment";
        case MarketStage.LATE_ASSESSMENT:
            return "Late Assessment";
        case MarketStage.APPROVED:
            return "Approved";
        case MarketStage.RESOLVED:
            return "Resolved";
        case MarketStage.DENIED:
            return "Denied";
    }
}
