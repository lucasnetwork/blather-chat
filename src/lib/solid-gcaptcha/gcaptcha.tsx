import { Component, createEffect } from "solid-js"
import { createScriptLoader } from "@solid-primitives/script-loader";
import { generateScriptUrl } from "./utils";
import { ConfigRender } from "./types";
interface GCaptchaProps{
    siteKey:string
    theme?:"dark" | "light"
    size?:"compact" | "normal",
    config?:ConfigRender,
    tabindex?:number
    onVerify?:(response:string)=>void
    handleIdCaptch?:(id:string)=> void
}
const GCAPTCHA_ONLOAD_FUNCTION_NAME = "__gCaptchaOnLoad__";
declare global {
    interface Window {
      [GCAPTCHA_ONLOAD_FUNCTION_NAME]: () => void;
    }
  }
  
declare var grecaptcha: {
    render:(HTMLDivElement,params:ConfigRender)=>string
};

const GCaptch:Component<GCaptchaProps> =(props)=>{
    let captcha_ref = HTMLDivElement | undefined
    const isApiReady = () => typeof window.grecaptcha !== "undefined";
    const script_url = () => generateScriptUrl(GCAPTCHA_ONLOAD_FUNCTION_NAME);
    const handleSubmit = (response:string)=>{
        props.onVerify && props.onVerify(response)
    }
    const handleExpire = () =>{
        console.log("handleExpire")
    }
    const handleError = () =>{
        console.log("handleError")
    }

    const renderCaptcha = () => {
        if (!captcha_ref ||!props.siteKey) return;
    
        /** Parameters for the greCaptcha widget. */
        const renderParams: ConfigRender = Object.assign({
          "error-callback"       : handleError,
          "expired-callback"     : handleExpire,
          callback             : handleSubmit,
        }, props.config, {
          "sitekey"              : props.siteKey,
          "tabindex"             : props.tabindex || 0,
          "theme"                : props.theme    || "light",
          "size"                 : props.size     || "normal",
        });
    
        /**
         * Render greCaptcha widget and provide necessary callbacks
         * and get the captcha ID from the returned value.
         */
        const captchaId = grecaptcha.render(captcha_ref, renderParams) as string;
        props.handleIdCaptch && props.handleIdCaptch(captchaId)
      };
    const handleOnLoad = () =>{
        renderCaptcha()
    }
    createEffect(()=>{
        if(!isApiReady()){
            console.log("oio")
            window[GCAPTCHA_ONLOAD_FUNCTION_NAME] = handleOnLoad;
            createScriptLoader({ src: script_url() });
        }
    })
    return (
        <form action="?" method="POST">
        <div ref={captcha_ref} id="html_element" />
        <br />
        <input type="submit" value="Submit" />
      </form> 
    )
}

export default GCaptch