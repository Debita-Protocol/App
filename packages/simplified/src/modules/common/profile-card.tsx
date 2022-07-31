import React from "react"
import { Passport } from "@gitcoinco/passport-sdk-types"
import Styles from "./profile-card.styles.less"

const ProfileCard = ({ passport }: { passport: Passport }) => {
    return (
        <section className={Styles.ProfileCard}>
                <h4>Gitcoin Passport</h4>
                <div>
                    <span>
                        Issuance Date:
                    </span>
                    { passport.issuanceDate }
                </div>
                <div>
                    <span>
                        Expiration Date
                    </span>
                    { passport.expiryDate }
                </div>
                {passport.stamps.length > 0 &&
                    passport.stamps.map(({ provider, credential, verified }, index) => {
                        return (
                            <li key={index}>
                                Credential 
                                <br />
                                <span>{ provider }</span>
                                { verified ? "verified" : "unverified"}
                                <div>
                                    Issuance Date : {credential.issuanceDate}
                                </div>
                            </li>
                        )
                    })
                }
                </section>
    )
}

export default ProfileCard;