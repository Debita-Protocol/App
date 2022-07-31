import { ContractCalls, useUserStore} from "@augurproject/comps"
import { SecondaryThemeButton } from "@augurproject/comps/build/components/common/buttons";
import { ValueLabel } from "@augurproject/comps/build/components/common/labels";
import { useWeb3React } from "@web3-react/core";
import React, { useCallback, useEffect } from "react"

const { verifyAddress, getVerificationStatus } = ContractCalls

// need to know verifcation status => 
// if verified then return label that says is verified
// need to create independent store so other ppl can check to see verification status.
export const VerifiedAccount = () => {
    const {
        loginAccount,
        verificationStatus,
        actions: {
            updateVerificationStatus
        }
    } = useUserStore();
    
    const { account } = useWeb3React();

    useEffect(() => {
        if (loginAccount?.library && account) {
            (async () => {
                const status: boolean = await getVerificationStatus(account, loginAccount.library)
                updateVerificationStatus(status);
            })();
        }
    }, [loginAccount, account])

    const verifyAccount = useCallback(async () => {
        if (account && loginAccount) {
            try {
                let tx = await verifyAddress(account, loginAccount.library);
                await tx.wait();
            } catch (err) {
                alert("error verifying account")
            }
        }
    }, [loginAccount, account])


    if (!account) {
        return null;
    } else if (account) {
        return (
            <>
                
                { !verificationStatus &&
                    <SecondaryThemeButton action={ verifyAccount } text={ "Verify Address"} />
                }
                <ValueLabel small={true} light={true} label={verificationStatus ? "Verified" : "Unverified" } value={verificationStatus}/>
            </>
        );
    }
}