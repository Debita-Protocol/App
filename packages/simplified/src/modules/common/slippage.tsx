import React, { useState, useMemo } from "react";

// @ts-ignore
import ButtonStyles from "./buttons.styles.less";
import classNames from "classnames";
import { LabelComps, ButtonComps, useUserStore } from "@augurproject/comps";

// @ts-ignore
import Styles from "./slippage.styles.less";
import ChevronFlip from "./chevron-flip";
import { useSimplifiedStore } from "../stores/simplified";

const { generateTooltip } = LabelComps;
const { TinyThemeButton } = ButtonComps;

export const Slippage = () => {
  const {
    settings: { slippage },
    actions: { updateSettings },
  } = useSimplifiedStore();
  const { account } = useUserStore();
  const [showSelection, setShowSelection] = useState(false);

  const isSelectedArray = useMemo(() => {
    let output = [false, false, false, false, false];
    switch (slippage) {
      case "0.5": {
        output[0] = true;
        break;
      }
      case "1": {
        output[1] = true;
        break;
      }
      case "2": {
        output[2] = true;
        break;
      }
      case "3": {
        output[3] = true;
        break;
      }
      default: {
        output[4] = true;
        break;
      }
    }
    return output;
  }, [slippage]);
  const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
  const [error, setError] = useState("");

  return (
    <section
      className={classNames(Styles.Slippage, {
        [Styles.showSelection]: showSelection,
        [Styles.HasError]: error,
      })}
    >
      <label onClick={() => setShowSelection(!showSelection)}>
        Slippage Tolerance
        {generateTooltip(
          "The maximum percentage the price can change and still have your transaction succeed.",
          "slippageToleranceInfo"
        )}
        <span>{slippage}%</span>
        <ChevronFlip pointDown={showSelection} />
      </label>
      <ul>
        <div>
          <li>
            <TinyThemeButton
              text="0.5%"
              action={() => {
                updateSettings({ slippage: "0.5" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[0]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="1%"
              action={() => {
                updateSettings({ slippage: "1" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[1]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="2%"
              action={() => {
                updateSettings({ slippage: "2" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[2]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="3%"
              action={() => {
                updateSettings({ slippage: "3" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[3]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <div
            className={classNames({
              [Styles.first]: isSelectedArray[1],
              [Styles.second]: isSelectedArray[2],
              [Styles.third]: isSelectedArray[3],
              [Styles.none]: isSelectedArray[4],
            })}
          ></div>
        </div>
        <li>
          <div
            className={classNames({
              [Styles.Selected]: isSelectedArray[4] === true,
            })}
          >
            <input
              type="number"
              step="0.1"
              value={customVal}
              onChange={(v) => {
                const val = v.target.value;
                setCustomVal(val);
                if (!(val === "" || isNaN(Number(val)) || Number(val) > 1000 || Number(val) <= 0)) {
                  setError("");
                  updateSettings({ slippage: val }, account);
                } else if (val === "") {
                  setError("");
                  updateSettings({ slippage: 0 }, account);
                } else {
                  setError("Enter a valid slippage percentage");
                }
              }}
              placeholder="Custom"
              max="1000"
              min="0.1"
            />
          </div>
        </li>
      </ul>
      {error && <span>{error}</span>}
    </section>
  );
};

export const LimitOrderSelector = ({isLimit, setIsLimit})=> {
  const {
    settings: { slippage },
    actions: { updateSettings },
  } = useSimplifiedStore();
  const { account } = useUserStore();
  const [showSelection, setShowSelection] = useState(false);

  const isSelectedArray = useMemo(() => {
    let output = [false, false];
    switch (slippage) {
      case "Taker": {
        output[0] = true;
        break;
      }
      case "Limit": {
        output[1] = true;
        break;
      }
    }
    return output;
  }, [slippage]);
  const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
  const [error, setError] = useState("");
  return (
    <section
      className={classNames(Styles.Slippage, {
        [Styles.showSelection]: true,
        [Styles.HasError]: error,
      })}
    >
     
      <ul>
        <div>
          <li>
            <TinyThemeButton
              text="Taker"
              action={() => {
                setIsLimit(false); 
                // updateSettings({ slippage: "0.5" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={!isLimit}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="Limit"
              action={() => {
                setIsLimit(true); 
                // updateSettings({ slippage: "1" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isLimit}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>

          <div
            className={classNames({
              [Styles.largefirst]: !isLimit,
              [Styles.largesecond]: isLimit,
              // [Styles.third]: isSelectedArray[3],
              // [Styles.none]: isSelectedArray[4],
            })}
          ></div>
        </div>

      </ul>
      {error && <span>{error}</span>}
    </section>
  );
}

export const Leverage = ({leverageFactor, setLeverageFactor}) => {
  const {
    settings: { slippage },
    actions: { updateSettings },
  } = useSimplifiedStore();
  const { account } = useUserStore();
  const [showSelection, setShowSelection] = useState(false);

  const isSelectedArray = useMemo(() => {
    let output = [false, false, false, false, false];
    switch (leverageFactor) {
      case 0: {
        output[0] = true;
        break;
      }
      case 1: {
        output[1] = true;
        break;
      }
      case 2: {
        output[2] = true;
        break;
      }
      case 3: {
        output[3] = true;
        break;
      }
      default: {
        output[4] = true;
        break;
      }
    }
    return output;
  }, [leverageFactor]);
  const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
  const [error, setError] = useState("");

  return (
    <section
      className={classNames(Styles.Slippage, {
        [Styles.showSelection]: showSelection,
        [Styles.HasError]: error,
      })}
    >
      <label onClick={() => setShowSelection(!showSelection)}>
        Leverage Multiplier
        {generateTooltip(
          "Amount of leveraged exposure to this vault's instruments. Default Leverage is 0. Any large leverage multiplier will mint NFTs instead of ERC20",
          "slippageToleranceInfo"
        )}
        <span>{leverageFactor}x</span>
        <ChevronFlip pointDown={showSelection} />
      </label>
      <ul>
        <div>
          <li>
            <TinyThemeButton
              text=" 0.00"
              action={() => {
                setLeverageFactor(0)
                // updateSettings({ slippage: "0.00" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[0]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="1.0"
              action={() => {
                setLeverageFactor(1)
                // updateSettings({ slippage: "1" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[1]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="2.0"
              action={() => {
                setLeverageFactor(2)
                // updateSettings({ slippage: "2" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[2]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="3.0"
              action={() => {
                setLeverageFactor(3)
                // updateSettings({ slippage: "3" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[3]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <div
            className={classNames({
              [Styles.first]: isSelectedArray[1],
              [Styles.second]: isSelectedArray[2],
              [Styles.third]:isSelectedArray[3]  ,
              [Styles.none]: isSelectedArray[4],
            })}
          ></div>
        </div>
        <li>
          <div
            className={classNames({
              [Styles.Selected]: isSelectedArray[4] === true,
            })}
          >
            <input
              type="number"
              step="0.1"
              value={customVal}
              onChange={(v) => {
                const val = v.target.value;
                setCustomVal(val);
                if (!(val === "" || isNaN(Number(val)) || Number(val) > 10 || Number(val) <= 0)) {
                  setError("");
                  setLeverageFactor(val);
                  // updateSettings({ slippage: val }, account);
                } else if (val === "") {
                  setError("");
                  setLeverageFactor(0); 
                  // updateSettings({ slippage: 0 }, account);
                } else {
                  setError("Enter a valid leverage multiplier");
                }
              }}
              placeholder="Custom"
              max="10"
              min="0.1"
            />
          </div>
        </li>
      </ul>
      {error && <span>{error}</span>}
    </section>
  );
};

export const PoolLeverageFactor = ({leverageFactor, setLeverageFactor}) => {
  const {
    settings: { slippage },
    actions: { updateSettings },
  } = useSimplifiedStore();
  const { account } = useUserStore();
  const [showSelection, setShowSelection] = useState(true);

  const isSelectedArray = useMemo(() => {
    let output = [false, false, false, false, false];
    switch (leverageFactor) {
      case 0: {
        output[0] = true;
        break;
      }
      case 1: {
        output[1] = true;
        break;
      }
      case 2: {
        output[2] = true;
        break;
      }
      case 3: {
        output[3] = true;
        break;
      }
      default: {
        output[4] = true;
        break;
      }
    }
    return output;
  }, [leverageFactor]);
  const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
  const [error, setError] = useState("");

  return (
    <section
      className={classNames(Styles.PoolLeverageFactor, {
        [Styles.showSelection]: showSelection,
        [Styles.HasError]: error,
      })}
    >
      <ul>
        <div>
          <li>
            <TinyThemeButton
              text=" 0.00"
              action={() => {
                setLeverageFactor(0)
                // updateSettings({ slippage: "0.00" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[0]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="1.0"
              action={() => {
                setLeverageFactor(1)
                // updateSettings({ slippage: "1" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[1]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="2.0"
              action={() => {
                setLeverageFactor(2)
                // updateSettings({ slippage: "2" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[2]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="3.0"
              action={() => {
                setLeverageFactor(3)
                // updateSettings({ slippage: "3" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[3]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <div
            className={classNames({
              [Styles.first]: isSelectedArray[1],
              [Styles.second]: isSelectedArray[2],
              [Styles.third]:isSelectedArray[3]  ,
              [Styles.none]: isSelectedArray[4],
            })}
          ></div>
        </div>
        <li>
          <div
            className={classNames({
              [Styles.Selected]: isSelectedArray[4] === true,
            })}
          >
            <input
              type="number"
              step="0.1"
              value={customVal}
              onChange={(v) => {
                const val = v.target.value;
                setCustomVal(val);
                if (!(val === "" || isNaN(Number(val)) || Number(val) > 10 || Number(val) <= 0)) {
                  setError("");
                  setLeverageFactor(val);
                  // updateSettings({ slippage: val }, account);
                } else if (val === "") {
                  setError("");
                  setLeverageFactor(0); 
                  // updateSettings({ slippage: 0 }, account);
                } else {
                  setError("Enter a valid leverage multiplier");
                }
              }}
              placeholder="Custom"
              max="10"
              min="0.1"
            />
          </div>
        </li>
      </ul>
      {error && <span>{error}</span>}
    </section>
  );
};

export const PromisedReturn = ({leverageFactor, setLeverageFactor}) => {
  const {
    settings: { slippage },
    actions: { updateSettings },
  } = useSimplifiedStore();
  const { account } = useUserStore();
  const [showSelection, setShowSelection] = useState(true);

  const isSelectedArray = useMemo(() => {
    let output = [false, false, false, false, false];
    switch (leverageFactor) {
      case 0: {
        output[0] = true;
        break;
      }
      case 1: {
        output[1] = true;
        break;
      }
      case 2: {
        output[2] = true;
        break;
      }
      case 3: {
        output[3] = true;
        break;
      }
      default: {
        output[4] = true;
        break;
      }
    }
    return output;
  }, [leverageFactor]);
  const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
  const [error, setError] = useState("");

  return (
    <section
      className={classNames(Styles.PoolLeverageFactor, {
        [Styles.showSelection]: showSelection,
        [Styles.HasError]: error,
      })}
    >
      <ul>
        <div>
          <li>
            <TinyThemeButton
              text=" 0.00"
              action={() => {
                setLeverageFactor(0)
                // updateSettings({ slippage: "0.00" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[0]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="1.0"
              action={() => {
                setLeverageFactor(1)
                // updateSettings({ slippage: "1" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[1]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="2.0"
              action={() => {
                setLeverageFactor(2)
                // updateSettings({ slippage: "2" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[2]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="3.0"
              action={() => {
                setLeverageFactor(3)
                // updateSettings({ slippage: "3" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[3]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <div
            className={classNames({
              [Styles.first]: isSelectedArray[1],
              [Styles.second]: isSelectedArray[2],
              [Styles.third]:isSelectedArray[3]  ,
              [Styles.none]: isSelectedArray[4],
            })}
          ></div>
        </div>
        <li>
          <div
            className={classNames({
              [Styles.Selected]: isSelectedArray[4] === true,
            })}
          >
            <input
              type="number"
              step="0.1"
              value={customVal}
              onChange={(v) => {
                const val = v.target.value;
                setCustomVal(val);
                if (!(val === "" || isNaN(Number(val)) || Number(val) > 10 || Number(val) <= 0)) {
                  setError("");
                  setLeverageFactor(val);
                  // updateSettings({ slippage: val }, account);
                } else if (val === "") {
                  setError("");
                  setLeverageFactor(0); 
                  // updateSettings({ slippage: 0 }, account);
                } else {
                  setError("Enter a valid leverage multiplier");
                }
              }}
              placeholder="Custom"
              max="10"
              min="0.1"
            />
          </div>
        </li>
      </ul>
      {error && <span>{error}</span>}
    </section>
  );
};

//   const {
//     settings: { slippage },
//     actions: { updateSettings },
//   } = useSimplifiedStore();
//   const { account } = useUserStore();
//   const [showSelection, setShowSelection] = useState(false);

//   const isSelectedArray = useMemo(() => {
//     let output = [false, false, false, false, false];
//     switch (slippage) {
//       case "0.5": {
//         output[0] = true;
//         break;
//       }
//       case "1": {
//         output[1] = true;
//         break;
//       }
//       case "2": {
//         output[2] = true;
//         break;
//       }
//       case "3": {
//         output[3] = true;
//         break;
//       }
//       default: {
//         output[4] = true;
//         break;
//       }
//     }
//     return output;
//   }, [slippage]);
//   const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
//   const [error, setError] = useState("");

//   return (
//     <section
//       className={classNames(Styles.Slippage, {
//         [Styles.showSelection]: showSelection,
//         [Styles.HasError]: error,
//       })}
//     >
//       <label onClick={() => setShowSelection(!showSelection)}>
//         Slippage Tolerance
//         {generateTooltip(
//           "The maximum percentage the price can change and still have your transaction succeed.",
//           "slippageToleranceInfo"
//         )}
//         <span>{slippage}%</span>
//         <ChevronFlip pointDown={showSelection} />
//       </label>
//       <ul>
//         <div>
//           <li>
//             <TinyThemeButton
//               text="0.5%"
//               action={() => {
//                 updateSettings({ slippage: "0.5" }, account);
//                 setCustomVal("");
//                 setError("");
//               }}
//               selected={isSelectedArray[0]}
//               noHighlight
//               customClass={ButtonStyles.TinyTransparentButton}
//             />
//           </li>
//           <li>
//             <TinyThemeButton
//               text="1%"
//               action={() => {
//                 updateSettings({ slippage: "1" }, account);
//                 setCustomVal("");
//                 setError("");
//               }}
//               selected={isSelectedArray[1]}
//               noHighlight
//               customClass={ButtonStyles.TinyTransparentButton}
//             />
//           </li>
//           <li>
//             <TinyThemeButton
//               text="2%"
//               action={() => {
//                 updateSettings({ slippage: "2" }, account);
//                 setCustomVal("");
//                 setError("");
//               }}
//               selected={isSelectedArray[2]}
//               noHighlight
//               customClass={ButtonStyles.TinyTransparentButton}
//             />
//           </li>
//           <li>
//             <TinyThemeButton
//               text="3%"
//               action={() => {
//                 updateSettings({ slippage: "3" }, account);
//                 setCustomVal("");
//                 setError("");
//               }}
//               selected={isSelectedArray[3]}
//               noHighlight
//               customClass={ButtonStyles.TinyTransparentButton}
//             />
//           </li>
//           <div
//             className={classNames({
//               [Styles.first]: isSelectedArray[1],
//               [Styles.second]: isSelectedArray[2],
//               [Styles.third]: isSelectedArray[3],
//               [Styles.none]: isSelectedArray[4],
//             })}
//           ></div>
//         </div>
//         <li>
//           <div
//             className={classNames({
//               [Styles.Selected]: isSelectedArray[4] === true,
//             })}
//           >
//             <input
//               type="number"
//               step="0.1"
//               value={customVal}
//               onChange={(v) => {
//                 const val = v.target.value;
//                 setCustomVal(val);
//                 if (!(val === "" || isNaN(Number(val)) || Number(val) > 1000 || Number(val) <= 0)) {
//                   setError("");
//                   updateSettings({ slippage: val }, account);
//                 } else if (val === "") {
//                   setError("");
//                   updateSettings({ slippage: 0 }, account);
//                 } else {
//                   setError("Enter a valid slippage percentage");
//                 }
//               }}
//               placeholder="Custom"
//               max="1000"
//               min="0.1"
//             />
//           </div>
//         </li>
//       </ul>
//       {error && <span>{error}</span>}
//     </section>
//   );
// };


export const Budget = ({budget, idx}:{budget: string, idx:number  }) => {
  const {
    settings: { slippage },
    actions: { updateSettings },
  } = useSimplifiedStore();
  const { account } = useUserStore();
  const [showSelection, setShowSelection] = useState(false);

  const isSelectedArray = useMemo(() => {
    let output = [false, false, false, false, false];
    switch (slippage) {
      case "0.5": {
        output[0] = true;
        break;
      }
      case "1": {
        output[1] = true;
        break;
      }
      case "2": {
        output[2] = true;
        break;
      }
      case "3": {
        output[3] = true;
        break;
      }
      default: {
        output[4] = true;
        break;
      }
    }
    return output;
  }, [slippage]);
  const [customVal, setCustomVal] = useState(isSelectedArray[4] ? slippage : "");
  const [error, setError] = useState("");
  const title = ["My Budget", "Hedge Quantity"]
  const description = ["Your trading limit depends on your reputation score","Your trading limit depends on your reputation score"]

  return (
    <section
      className={classNames(Styles.Slippage, {
        [Styles.showSelection]: showSelection,
        [Styles.HasError]: error,
      })}
    >
      <label onClick={() => setShowSelection(!showSelection)}>
        {title[idx]} 
        {generateTooltip(
          description[idx], 
          "slippageToleranceInfo"
        )}
        <span>{budget+"dbUSDC"}</span>
      {/*  <ChevronFlip pointDown={showSelection} /> */}
      </label>
      <ul>
        <div>
          <li>
            <TinyThemeButton
              text="0.5%"
              action={() => {
                updateSettings({ slippage: "0.5" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[0]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="1%"
              action={() => {
                updateSettings({ slippage: "1" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[1]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="2%"
              action={() => {
                updateSettings({ slippage: "2" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[2]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <li>
            <TinyThemeButton
              text="3%"
              action={() => {
                updateSettings({ slippage: "3" }, account);
                setCustomVal("");
                setError("");
              }}
              selected={isSelectedArray[3]}
              noHighlight
              customClass={ButtonStyles.TinyTransparentButton}
            />
          </li>
          <div
            className={classNames({
              [Styles.first]: isSelectedArray[1],
              [Styles.second]: isSelectedArray[2],
              [Styles.third]: isSelectedArray[3],
              [Styles.none]: isSelectedArray[4],
            })}
          ></div>
        </div>
        <li>
          <div
            className={classNames({
              [Styles.Selected]: isSelectedArray[4] === true,
            })}
          >
            <input
              type="number"
              step="0.1"
              value={customVal}
              onChange={(v) => {
                const val = v.target.value;
                setCustomVal(val);
                if (!(val === "" || isNaN(Number(val)) || Number(val) > 1000 || Number(val) <= 0)) {
                  setError("");
                  updateSettings({ slippage: val }, account);
                } else if (val === "") {
                  setError("");
                  updateSettings({ slippage: 0 }, account);
                } else {
                  setError("Enter a valid slippage percentage");
                }
              }}
              placeholder="Custom"
              max="1000"
              min="0.1"
            />
          </div>
        </li>
      </ul>
      {error && <span>{error}</span>}
    </section>
  );
};

