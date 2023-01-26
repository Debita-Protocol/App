import ReactSlider from "react-slider";
import React from "react";
import Styles from "./slider.styles.less";


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
        value
    }: {
        max?: number,
        min?: number,
        onAfterChange?: Function,
        onBeforeChange?: Function,
        onChange?: Function,
        defaultValue?: number,
        disabled?: boolean,
        step?: number,
        value?: number
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
        defaultValue
    }
    if (value) {
        props = {
            ...props,
            value
        }
    }
    
    return (
        <ReactSlider
        {...props}
        />
    )
}