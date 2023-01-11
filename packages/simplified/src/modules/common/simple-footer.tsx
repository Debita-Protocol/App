import React from "react";

// @ts-ignore
import Styles from "./simple-footer.styles.less";
import { Logo, LabelComps } from "@augurproject/comps";
import { ExternalLink } from "@augurproject/comps/build/utils/links/links";
const { VersionLabel } = LabelComps;

export const SimpleFooter = () => (
  <footer className={Styles.SimpleFooter}>
    <div>
      {/*<Logo isMobile />*/}
      <ExternalLink label="Home" URL="https://ramm.finance" />
      <ExternalLink label="Help Docs" URL="https://www.google.com" />
      <ExternalLink label="Discord" URL="https://www.google.com/" />
      <VersionLabel />
    </div>
    <div />
  </footer>
);
