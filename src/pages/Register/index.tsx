import { createStore } from "solid-js/store";
import matrixcs from "matrix-js-sdk";
import { createMemo, createSignal } from "solid-js";
import crypto from "crypto"
interface ErrorMatrixRegister {
  data: {
    errcode: "M_MISSING_PARAM";
    flows: { stages: Array<"m.login.email.identity" | "m.login.recaptcha"> }[];
    params: {
      "m.login.recaptcha"?: {
        public_key: string;
      };
    };
    session: string;
  };
}
const Register = () => {
  const [fields, setFields] = createStore({
    userName: "",
    password: "",
    server: "",
  });
  const [verifyTypesofFlows, setVerifyTypeOfFlows] =
    createSignal<{ type: string }[]>();
  const [currentStage, setCurrentStage] = createSignal<
    "m.login.email.identity" | "m.login.recaptcha"
  >();
  const [stagesCompleted, setStagesCompleted] = createSignal<
    Array<"m.login.email.identity" | "m.login.recaptcha">
  >([]);
  const [session, setSession] = createSignal("");
  const createClient = createMemo(() => {
    return matrixcs.createClient({ baseUrl: fields.server });
  });
  const onSubmit = async () => {
    var client = createClient();
    try {
      const stage = currentStage();
      if (stage === "m.login.email.identity") {
        const response = await client.register(
          fields.userName,
          fields.password,null
        );
       
      } else if (stage === "m.login.recaptcha") {
        try{
            const response = await client.register(
              fields.userName,
              fields.password,
              null,
              {
                type: "m.login.recaptcha",
                session: session(),
              }
            );
            
        }catch{
            console.log("oioio")
            setStagesCompleted([...stagesCompleted(), "m.login.recaptcha"]);
            await client.register(
                fields.userName,
                fields.password,
                session() || null,
                {
                  type: "m.login.email.identity",
                  email: "",
                }
              );
        }
      }
    } catch (e: any) {
      const error: ErrorMatrixRegister = e;
      if (error.data.flows) {
        const findRegisterType = error.data.flows.find((flow) =>
          flow.stages.find((stage) => stage === "m.login.email.identity")
        );
        const getFirstStateThatNotCompleted = findRegisterType?.stages.find(
          (stage) => {
            const findIfStageCompleted = stagesCompleted().find(
              (stageCompleted) => stageCompleted === stage
            );
            return !findIfStageCompleted;
          }
        );
        switch (getFirstStateThatNotCompleted) {
          case "m.login.recaptcha": {
          
            setSession(error.data.session);
            setCurrentStage(() => "m.login.recaptcha");
            grecaptcha.render("html_element", {
              sitekey: error.data.params["m.login.recaptcha"]?.public_key,
              callback: async (responseCaptch) => {
                console.log("response", responseCaptch);
                try{

                    const response = await client.register(
                      fields.userName,
                      fields.password,
                      null,
                      {
                        type: "m.login.recaptcha",
                        session: session(),
                        response: responseCaptch,
                      }
                    );
                }catch{
                    const randomString = crypto.randomBytes(8).toString("hex");
                    const response = await client.requestRegisterEmailToken("",randomString,1)
                    setStagesCompleted([...stagesCompleted(), "m.login.recaptcha"]);
                    await client.register(
                        fields.userName,
                        fields.password,
                        session() || null,
                        {
                          type: "m.login.email.identity",
                          email: "",
                          threepidCreds:{

                            "sid":response.sid,
                            "client_secret":randomString
                          },
                          threepid_creds:{

                            "sid":response.sid,
                            "client_secret":randomString
                          }
                        },
                        
                      );
                }
              },
            });
          }
        }
      }
      console.log("erroir", e.data);
    }
  };

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          if (verifyTypesofFlows()) {
            onSubmit();
            return;
          }
          const client = createClient();
          const response = await client.loginFlows();
          setVerifyTypeOfFlows(response.flows);
          setCurrentStage(() => "m.login.email.identity");
        }}
      >
        <fieldset>
          <label>servidor url</label>
          <input
            value={fields.server}
            onInput={(e) => setFields("server", e.target.value)}
          />
        </fieldset>
        {currentStage() === "m.login.email.identity" && (
          <div>
            <fieldset>
              <label>username</label>
              <input onInput={(e) => setFields("userName", e.target.value)} />
            </fieldset>
            <fieldset>
              <label>password</label>
              <input onInput={(e) => setFields("password", e.target.value)} />
            </fieldset>
          </div>
        )}
        {/* {
            currentStage() === "m.login.recaptcha" &&    <HCaptcha
            sitekey={recaptcha()}

            config={{
                host:"http://test.mydomain.com/",

                
            }}
            onVerify={token => console.log(token)}
          />
        } */}

        <button>Logar</button>
      </form>

      <form action="?" method="POST">
        <div id="html_element" />
        <br />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

export default Register;
