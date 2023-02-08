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
        market
    }
) => {
    const stage: MarketStage = marketStage(market);

    // let props: any ={
    //     className:Styles.BaseHorizontalSlider,
    //     thumbClassName:Styles.BaseThumb,
    //     trackClassName:Styles.BaseTrack,
    //     disabled: true,
    //     onChange,
    //     step,
    //     max,
    //     min,
    //     defaultValue,
    //     marks,
    //     markClassName: markClassName === "" ? Styles.BaseMark : {markClassName},
    // }
    return (
        <ReactSlider />
    )
}