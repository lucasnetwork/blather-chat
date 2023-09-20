import { createStore } from "solid-js/store";
import matrixcs, { LoginFlow } from "matrix-js-sdk";
import { Match, Show, Switch, createMemo, createSignal, For } from "solid-js";
import crypto from "crypto";
import GReCaptch from "solid-grecaptcha";
import Button from "../../components/Button";
import Input from "../../components/InputWithLabel";

const options = {
  "m.login.password": {
    label: "Senha",
    type: "m.login.email.identity",
  },
  "m.login.application_service": {
    label: "",
  },
};

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
    completed?: ["m.login.recaptcha"];
  };
}
interface ErrorMatrixInitialEmailRegister {
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
    session: "",
    confirmPassword: "",
    email: "",
  });
  const [verifyTypesofFlows, setVerifyTypeOfFlows] = createSignal<LoginFlow[]>(
    [],
  );
  const [currentStage, setCurrentStage] = createSignal<LoginFlow>();
  const [stagesCompleted, setStagesCompleted] = createSignal<
    Array<"m.login.email.identity" | "m.login.recaptcha">
  >([]);
  const [loading, setLoading] = createSignal(false);
  const [recaptchat, setrecaptchat] = createSignal("");
  const createClient = createMemo(() => {
    return matrixcs.createClient({ baseUrl: fields.server });
  });

  const initialRegisterEmail = async () => {
    var client = createClient();
    try {
      await client.register(fields.userName, fields.password, null);
    } catch (e: any) {
      const error: ErrorMatrixInitialEmailRegister = e;
      if (error.data.flows) {
        return error.data;
      }
    }
  };
  const registerRecaptcha = async (responseCaptch: string) => {
    var client = createClient();
    try {
      await client.register(fields.userName, fields.password, null, {
        type: "m.login.recaptcha",
        session: fields.session,
        response: responseCaptch,
      });
    } catch (e: any) {
      const error: ErrorMatrixRegister = e;
      if (error?.data?.completed?.find((err) => err === "m.login.recaptcha")) {
        return;
      } else {
        throw e;
      }
    }
  };

  const onSubmit = async () => {
    const stage = currentStage();
    if (stage === "m.login.email.identity") {
      const response = await initialRegisterEmail();
      if (!response) {
        return;
      }
      const findRegisterType = response.flows.find((flow) =>
        flow.stages.find((stage) => stage === "m.login.email.identity"),
      );
      const getFirstStateThatNotCompleted = findRegisterType?.stages.find(
        (stage) => {
          const findIfStageCompleted = stagesCompleted().find(
            (stageCompleted) => stageCompleted === stage,
          );
          return !findIfStageCompleted;
        },
      );
      switch (getFirstStateThatNotCompleted) {
        case "m.login.recaptcha": {
          setFields("session", response.session);
          setCurrentStage(() => "m.login.recaptcha");
          setVerifyTypeOfFlows([]);
          setrecaptchat(
            () => response.params["m.login.recaptcha"]?.public_key || "",
          );
        }
      }
    }
  };

  const onVerify = (responseCaptch: string) => {
    async function callback() {
      var client = createClient();
      try {
        await registerRecaptcha(responseCaptch);
        const randomString = crypto.randomBytes(8).toString("hex");
        const response = await client.requestRegisterEmailToken(
          fields.email,
          randomString,
          1,
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
          },
          {
            sid: response.sid,
            client_secret: randomString,
          },
        );
      } catch (e) {
        console.log(e);
      }
    }
    callback();
  };

  return (
    <div class="h-full w-full flex items-center justify-center bg-slate-900">
      <div class="bg-white rounded-md p-8 pb-9 flex flex-col">
        <form
          onSubmit={async (e) => {
            try {
              e.preventDefault();
              if (loading()) {
                return;
              }
              setLoading(true);
              if (currentStage()) {
                await onSubmit();
                return;
              }
              const client = createClient();
              const response = await client.loginFlows();
              setVerifyTypeOfFlows(response.flows);

              setLoading(false);
            } catch {
              setLoading(false);
            }
          }}
        >
          <div class="mb-5">
            <Input
              label="servidor url"
              value={fields.server}
              onInput={(e) => setFields("server", e.target.value)}
            />
          </div>
          {verifyTypesofFlows()?.length > 0 && (
            <select
              onChange={(e) => {
                console.log(e.target.value);
                setCurrentStage(() => e.target.value);
              }}
            >
              <option>selecione uma opção</option>
              <For each={verifyTypesofFlows()}>
                {(cat, i) => (
                  <option value={options[cat.type].type}>
                    {options[cat.type].label}{" "}
                  </option>
                )}
              </For>
            </select>
          )}

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
