import { splitProps } from "solid-js";

const Input = (_props) =>{
      const [props, rest] = splitProps(_props, ["label"]);
return <fieldset class="flex flex-col">
        <label class="mb-2">{props.label}</label>
        <input class="border-b-black border-b-2 outline-none" {...rest}/>
    </fieldset>
}

export default Input