import { createStore } from "solid-js/store";
import matrixcs from "matrix-js-sdk";
import { Match, Show, Switch, createMemo, createSignal } from "solid-js";
import crypto from "crypto";
import GReCaptch from "solid-grecaptcha";
import Button from "../../components/Button";
import Input from "../../components/InputWithLabel";
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
    session:"",
    confirmPassword:"",
    email:""
  });
  const [verifyTypesofFlows, setVerifyTypeOfFlows] =
    createSignal<{ type: string }[]>();
  const [currentStage, setCurrentStage] = createSignal<
    "m.login.email.identity" | "m.login.recaptcha"
  >();
  const [stagesCompleted, setStagesCompleted] = createSignal<
    Array<"m.login.email.identity" | "m.login.recaptcha">
  >([]);
  const [loading, setLoading] = createSignal(false);
  const [recaptchat, setrecaptchat] = createSignal("");
  const createClient = createMemo(() => {
    return matrixcs.createClient({ baseUrl: fields.server });
  });
  const onSubmit = async () => {
    var client = createClient();
    try {
      const stage = currentStage();
      if (stage === "m.login.email.identity") {
        await client.register(fields.userName, fields.password, null);
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
            setFields("session",error.data.session);
            setCurrentStage(() => "m.login.recaptcha");
            setrecaptchat(
              () => error.data.params["m.login.recaptcha"]?.public_key
            );
          }
        }
      }
    }
  };

  const onVerify = (responseCaptch: string) => {
    async function callback() {
      var client = createClient();
      try {
        await client.register(fields.userName, fields.password, null, {
          type: "m.login.recaptcha",
          session: fields.session,
          response: responseCaptch,
        });
      } catch {
        const randomString = crypto.randomBytes(8).toString("hex");
        const response = await client.requestRegisterEmailToken(
          "",
          randomString,
          1
        );
        setStagesCompleted([...stagesCompleted(), "m.login.recaptcha"]);
        await client.register(
          fields.userName,
          fields.password,
          fields.session || null,
          {
            type: "m.login.email.identity",
            email: fields.email,
            threepidCreds: {
              sid: response.sid,
              client_secret: randomString,
            },
            threepid_creds: {
              sid: response.sid,
              client_secret: randomString,
            },
          }
        );
      }
    }
    callback();
  };

  return (
    <div class="h-full w-full flex items-center justify-center bg-slate-900">
      <div  class="bg-white rounded-md p-8 pb-9 flex flex-col">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          if (verifyTypesofFlows()) {
            await onSubmit();
            return;
          }
          const client = createClient();
          const response = await client.loginFlows();
          setVerifyTypeOfFlows(response.flows);
          setCurrentStage(() => "m.login.email.identity");

          setLoading(false);
        }}
      >
        <div class="mb-5">

        <Input
          label="servidor url"
          value={fields.server}
          onInput={(e) => setFields("server", e.target.value)}
        />
        </div>

        {currentStage() === "m.login.email.identity" && (
          <div class="flex flex-col gap-y-5">
            <div class="flex  gap-x-2">
              <Input
                label="username"
                value={fields.userName}
                onInput={(e) => setFields("userName", e.target.value)}
              />
              <Input
                label="E-mail"
                value={fields.email}
                onInput={(e) => setFields("email", e.target.value)}
              />
            </div>
            <div class="flex gap-x-2">
              <Input
                label="password"
                value={fields.password}
                onInput={(e) => setFields("password", e.target.value)}
              />
              <Input
                label="confirmPassword"
                value={fields.confirmPassword}
                onInput={(e) => setFields("confirmPassword", e.target.value)}
              />
            </div>
          </div>
        )}
        <div class="pt-5">
          <Show when={currentStage() !== "m.login.recaptcha"}>
            <Button label="logar" loading={loading()}>
              <Switch fallback="">
                <Match when={!currentStage()}>Verificar servidor</Match>
                <Match when={currentStage() === "m.login.email.identity"}>
                  Logar
                </Match>
              </Switch>
            </Button>
          </Show>
        </div>
      </form>
      {currentStage() === "m.login.recaptcha" && (
        <GReCaptch siteKey={recaptchat()} onVerify={onVerify} />
      )}
      </div>
    </div>
  );
};

export default Register;
