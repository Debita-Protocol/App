import ReactSlider from "react-slider";
import React from "react";

//@ts-ignore;
import Styles from "./slider.styles.less";
import { MarketStage, marketStage, round } from "utils/helpers";
import classNames from "classnames";
import { CoreMarketInfo, CreditlineInstrument, Instrument, PoolInstrument } from "@augurproject/comps/build/types";


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
        renderTrack
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
        renderTrack?: Function
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
        markClassName: markClassName === "" ? Styles.BaseMark : { markClassName },
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

    return (
        <ReactSlider
            {...props}
        />
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
    const stage: MarketStage = marketStage(market);
    const { totalCollateral, parameters: { alpha } } = market;
    const { principal, instrumentType } = instrument;


    console.log("alpha: ", alpha)
    console.log("totalCollateral: ", totalCollateral)
    console.log("principal: ", principal)

    console.log("instrumentType: ", instrumentType)
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
            case MarketStage.EARLY_ASSESSMENT:
            case MarketStage.LATE_ASSESSMENT:
                value = Number(totalCollateral)/(Number(alpha) * Number(principal));
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
    } else if (Number(instrumentType) == 2){ // perpetual instrument
        let value;
        const {saleAmount} = instrument as PoolInstrument;
        stages = [
            "Proposal",
            "Approval"
        ]
        switch (stage) {
            case MarketStage.EARLY_ASSESSMENT:
            case MarketStage.LATE_ASSESSMENT:
                value = Number(totalCollateral)/( Number(saleAmount));
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
            <Stages stages={stages}/>
            <ReactSlider {...props}/>
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

export const Stages = ({stages }) => {
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