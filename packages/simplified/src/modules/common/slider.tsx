import ReactSlider from "react-slider";
import React from "react";

//@ts-ignore;
import Styles from "./slider.styles.less";
import { MarketStage, marketStage } from "utils/helpers";


//https://zillow.github.io/react-slider/ -> more attributes to customize
export const BaseSlider = (
    {
        max=100,
        min=0,
        onAfterChange=()=>{},
        onBeforeChange=()=>{},
        onChange=()=>{},
        defaultValue=0,
        disabled=false,
        step=1,
        value,
        renderMark,
        marks=[],
        markClassName="",
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
    let props: any ={
        className:Styles.BaseHorizontalSlider,
        thumbClassName:Styles.BaseThumb,
        trackClassName:Styles.BaseTrack,
        disabled,
        onChange,
        step,
        max,
        min,
        defaultValue,
        marks,
        markClassName: markClassName === "" ? Styles.BaseMark : {markClassName},
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
        props ={
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
    }
) => {
    const stage: MarketStage = marketStage(market);
    const { totalCollateral, parameters: { alpha }} = market;
    const { principal } = instrument;

    let value;
    switch (stage) {
        case MarketStage.EARLY_ASSESSMENT:
        case MarketStage.LATE_ASSESSMENT:
            value = 1/2; // Number(totalCollateral)/(Number(alpha) * Number(principal));
            break;
        case MarketStage.APPROVED:
            value = 1;
            break;
        case MarketStage.RESOLVED:
            value = 2;
            break;    
    }

    let props: any ={
        className:Styles.BaseHorizontalSlider,
        thumbClassName:Styles.BaseThumb,
        trackClassName:Styles.BaseTrack,
        disabled: false,
        max: 2,
        min: 0,
        step: 0.01,
        marks: [0,1,2],
        markClassName: Styles.BaseMark,
        value
    }
    return (
        <div className={Styles.InstrumentStatusSlider}>
            <Stages />
            <ReactSlider {...props}/>
        </div>
    )
}

export const VerticalFill = (
    {
        max=100,
        min=0
    }
) => {

    let props = {
        max,
        min,
        className:Styles.VerticalFill,
        orientation: "vertical",
        invert: true
    }


    return (
        <ReactSlider {...props}/>
    )
}

export const Stages = () => {
    const stages = [
        "Proposal",
        "Approval",
        "Resolution"
    ]
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