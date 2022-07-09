import BigNumber, { BigNumber as BN } from "bignumber.js";

export const calculateTotalDebt = (P: string, I: string, t: string): string => {
    let _P = new BN(P);
    let _I = new BN(I);
    let _t = new BN(t);

    // fixed interest rate

    let totalDebt = _P.plus( _t.dividedBy(365).multipliedBy(_I).multipliedBy(_P) );
    return totalDebt.toString();
}