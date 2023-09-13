import { splitProps } from "solid-js";

const Input = (_props) =>{
      const [props, rest] = splitProps(_props, ["label"]);
return <fieldset>
        <label>{props.label}</label>
        <input {...rest}/>
    </fieldset>
}

export default Input