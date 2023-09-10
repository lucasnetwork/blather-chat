
import { createStore } from "solid-js/store";
import matrixcs from "matrix-js-sdk";
const Login = () => {
    const [fields,setFields] = createStore({
        userName:"",
        password:"",
        server:""
    })
    const onSubmit = async() =>{
        var client = matrixcs.createClient({ baseUrl: fields.server });
        const response = await client
            .login("m.login.password", {
              password: "lucas123jmfdsa@$KJ",
              initial_device_display_name: "app.nitro.chat: Brave em Linux",
              identifier: {
                user: "lucas-teste-matrix-clien",
                type: "m.id.user",
              },
            })
            console.log(response)
    }
    return <form onSubmit={(e)=>{
        e.preventDefault()
        onSubmit()
    }}>
        <fieldset>
            <label>servidor url</label>
            <input onInput={(e)=>setFields("server",e.target.value)}/>
        </fieldset>
        <fieldset>
            <label>username</label>
            <input onInput={(e)=>setFields("userName",e.target.value)}/>
        </fieldset>
        <fieldset>
            <label>password</label>
            <input onInput={(e)=>setFields("password",e.target.value)}/>
        </fieldset>
        <button>Logar</button>
    </form>
}

export default Login