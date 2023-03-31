import ReactSlider from "react-slider";
import React, { useState } from "react";

//@ts-ignore;
import Styles from "./slider.styles.less";
import { MarketStage, getMarketStage, round } from "utils/helpers";
import classNames from "classnames";
import { CoreMarketInfo, CreditlineInstrument, Instrument, PoolInstrument } from "@augurproject/comps/build/types";
import { TrancheAmountInputField } from "@augurproject/comps/build/components/common/inputs";
import { generateTooltip } from "@augurproject/comps/build/components/common/labels";


//https://zillow.github.io/react-slider/ -> more attributes to customize
export const BaseSlider = (
    {
        max = 100,
        min = 0,
        onAfterChange = () => { },
        onBeforeChange = () => { },
        onChange = () => { },
        defaultValue = 0,
        disabled = false,
        step = 1,
        value,
        renderMark,
        marks = [],
        markClassName = "",
        renderTrack,
        ariaValuetext
    }: {
        max?: number,
        min?: number,
        onAfterChange?: Function,
        onBeforeChange?: Function,
        onChange?: Function,
        defaultValue?: number,
        disabled?: boolean,
        step?: number,
        value?: number,
        renderMark?: Function,
        marks?: any[],
        markClassName?: string,
        renderTrack?: Function,
        ariaValuetext?: string | Function
    }
) => {
    let props: any = {
        className: Styles.BaseHorizontalSlider,
        thumbClassName: Styles.BaseThumb,
        trackClassName: Styles.BaseTrack,
        disabled,
        onChange,
        step,
        max,
        min,
        defaultValue,
        marks,
        markClassName: markClassName === "" ? Styles.BaseMark : { markClassName }
    }
    if (!isNaN(value)) {
        props = {
            ...props,
            value
        }
    }
    if (!renderMark) {
        props = {
            ...props,
            renderMark
        }
    }
    if (!renderTrack) {
        props = {
            ...props,
            renderTrack
        }
    }

    if (ariaValuetext) {
        props = {
            ...props,
            ariaValuetext
        }
    }

    return (
        <ReactSlider
            {...props}
        />
    )
}

export const InputSlider: React.FC = ({
    value,
    onSetValue,
    max,
    min,
    step,
    label,
    marks
}: {
    value: number,
    onSetValue: Function,
    max: number,
    min: number,
    step: number,
    label: string,
    marks: number[]
}
) => {

    let placeholder = Number(value);
    const [inputValue, setInputValue] = useState(placeholder);
    const [sliderMoved, setSliderMoved] = useState(false);
    return (
        <div className={Styles.InputSlider}>
            <span>
                <input type="number" value={Number(value)} onChange={(e) => {
                    if (Number(e.target.value) > max) {
                        onSetValue(max)
                    }
                    else if (Number(e.target.value) > 0) {
                        onSetValue(Number(e.target.value))
                    } else {
                        onSetValue(0)
                    }
                }} />
                <div>
                    {label}
                </div>

            </span>
            <div>
                <BaseSlider
                    max={Number(max)}
                    min={Number(min)}
                    value={value}
                    step={step}
                    onChange={(val) => {
                        onSetValue(val)
                        setSliderMoved(true);
                    }}
                />
                <div>
                    {marks && marks.map((mark, index) => {
                        return (
                            <div key={index} className={Styles.Mark}>
                                {mark}
                            </div>)
                    }
                    )}
                </div>
            </div>

        </div>
    )
}

export const InstrumentStatusSlider: React.FC = (
    {
        market,
        instrument
    }: {
        market: CoreMarketInfo,
        instrument: Instrument
    }
) => {
    const stage: MarketStage = getMarketStage(market);
    const { totalCollateral, parameters: { alpha } } = market;
    const { principal, instrumentType } = instrument;


    // console.log("alpha: ", alpha)
    // console.log("totalCollateral: ", totalCollateral)
    // console.log("principal: ", principal)

    // console.log("instrumentType: ", instrumentType)
    let props;
    let stages: string[] = [];
    if (Number(instrumentType) === 0) { // fixed instrument
        instrument as CreditlineInstrument;
        let value;
        stages = [
            "Proposal",
            "Approval",
            "Resolution"
        ]
        switch (stage) {
            case MarketStage.ASSESSMENT:
                value = Number(totalCollateral) / (Number(alpha) * Number(principal));
                break;
            case MarketStage.APPROVED:
                value = 1;
                break;
            case MarketStage.RESOLVED:
                value = 2;
                break;
        }
        value = Number(round(String(value), 2));



        console.log("value: ", value)

        props = {
            className: Styles.BaseHorizontalSlider,
            thumbClassName: Styles.BaseThumb,
            trackClassName: Styles.BaseTrack,
            disabled: false,
            max: 2,
            min: 0,
            step: 0.01,
            // marks: [0, 1, 2],
            markClassName: Styles.BaseMark,
            value
        }
    } else if (Number(instrumentType) == 2) { // perpetual instrument
        let value;
        const { saleAmount } = instrument as PoolInstrument;
        stages = [
            "Proposal",
            "Approval"
        ]
        switch (stage) {
            case MarketStage.ASSESSMENT:
                value = Number(totalCollateral) / (Number(saleAmount));
                break;
            case MarketStage.APPROVED:
                value = 1;
                break;
            case MarketStage.RESOLVED:
                value = 2;
                break;
        }

        props = {
            className: Styles.BaseHorizontalSlider,
            thumbClassName: Styles.BaseThumb,
            trackClassName: Styles.BaseTrack,
            disabled: false,
            max: 1,
            min: 0,
            step: 0.01,
            // marks: [0, 1],
            markClassName: Styles.BaseMark,
            value
        }
    }

    console.log("stages: ", stages)

    return (
        <div className={classNames(Styles.InstrumentStatusSlider, {
            [Styles.Fixed]: Number(instrumentType) === 0,
        })}>
            <Stages stages={stages} />
            <ReactSlider {...props} />
        </div>
    )
}

export const VerticalFill = (
    {
        max = 100,
        min = 0
    }
) => {

    let props = {
        max,
        min,
        className: Styles.VerticalFill,
        orientation: "vertical",
        invert: true
    }


    return (
        <ReactSlider {...props} />
    )
}

export const Stages = ({ stages }) => {
    return (
        <div>
            {stages.map((stage, index) => {
                return (
                    <div key={stage}>
                        {stage}
                    </div>
                )
            })}
        </div>
    )
}

export const DualLabelSlider: React.FC = ({
    value,
    onSetValue,
    max,
    min,
    step,
    label1,
    label2,
    append
}: {
    value: number,
    onSetValue: Function,
    max: number,
    min: number,
    step: number,
    label1: string,
    label2: string,
    append?: string
}) => {

    return (
        <div className={Styles.DualLabelSlider}>
            <div>
                <div>
                    <div>
                        <label>
                            {label1}
                        </label>
                        {generateTooltip("senior tranche", "senior")}
                    </div>
                    <div>
                        <TrancheAmountInputField initialAmount={(value)} updateInitialAmount={onSetValue} 
                        append={true} appendSymbol={"%"}
                        onChange={(e) => {
                            if (Number(e.target.value) > max) {
                                onSetValue(max)
                            }
                            else if (Number(e.target.value) > 0) {
                                onSetValue(Number(e.target.value))
                            } else {
                                onSetValue(0)
                            }
                        }}
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <label>
                            {label2}
                        </label>
                        {generateTooltip("junior tranche", "junior")}
                    </div>


                    <div>
                        <TrancheAmountInputField 
                        initialAmount={max - value} updateInitialAmount={(a) => onSetValue(String(max - Number(a)))}
                        append={true} appendSymbol={"%"}
                        onChange={(e) => {
                            if (Number(e.target.value) > max) {
                                onSetValue(0)
                            }
                            else if (Number(e.target.value) > 0) {
                                onSetValue(max - Number(e.target.value))
                            } else {
                                onSetValue(max)
                            }
                        }}
                        />
                    </div>
                </div>
            </div>
            <div>
                <BaseSlider
                    max={max}
                    min={min}
                    value={value}
                    step={step}
                    onChange={(val) => {
                        onSetValue(val)
                    }}
                />
            </div>
        </div>
    )
}

export const SingleLabelSlider: React.FC = ({
    value,
    onSetValue,
    max,
    min,
    step,
    label,
}: {
    value: number,
    onSetValue: Function,
    max: number,
    min: number,
    step: number,
    label: string,
}) => {

    return (
        <div className={Styles.SingleLabelSlider}>
            <div>
                <div>
                    <div>
                        <label>
                            {label}
                        </label>
                        {generateTooltip("exposure percentage", "exposure")}
                    </div>
                    <div>
                        <TrancheAmountInputField initialAmount={(value)} updateInitialAmount={onSetValue} 
                        append={true} appendSymbol={"%"}
                        onChange={(e) => {
                            if (Number(e.target.value) > max) {
                                onSetValue(max)
                            }
                            else if (Number(e.target.value) > 0) {
                                onSetValue(Number(e.target.value))
                            } else {
                                onSetValue(0)
                            }
                        }}
                        />
                    </div>
                </div>
            </div>
            <div>
                <BaseSlider
                    max={max}
                    min={min}
                    value={value}
                    step={step}
                    onChange={(val) => {
                        onSetValue(val)
                    }}
                />
            </div>
        </div>
    )
}