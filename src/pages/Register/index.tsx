import { createStore } from "solid-js/store";
import matrixcs, { LoginFlow } from "matrix-js-sdk";
import { Match, Show, Switch, createMemo, createSignal, For } from "solid-js";
import GReCaptch from "solid-grecaptcha";
import Button from "../../components/Button";
import Input from "../../components/InputWithLabel";
import { getLoginFlows } from "../../lib/login";
import {
  RegisterFlowStage,
  initialRegister,
  registerWithRecaptcha,
} from "../../lib/register";
import { useNavigate } from "@solidjs/router";

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
  const [currentStage, setCurrentStage] = createSignal<RegisterFlowStage>();
  const [stagesCompleted, setStagesCompleted] = createSignal<
    Array<"m.login.email.identity" | "m.login.recaptcha">
  >([]);
  const navigation = useNavigate();
  const [loading, setLoading] = createSignal(false);
  const [recaptchat, setrecaptchat] = createSignal("");
  const createClient = createMemo(() => {
    return matrixcs.createClient({ baseUrl: fields.server });
  });

  const existPasswordLogin = createMemo(() => {
    const values = verifyTypesofFlows();
    console.log(values);
    return values.find((value) => value.type === "m.login.password");
  });

  const onSubmit = async () => {
    const stage = currentStage();
    if (stage === "m.login.email.identity") {
      const client = createClient();
      const response = await initialRegister(client, {
        password: fields.password,
        username: fields.userName,
      });
      if (!response) {
        return;
      }
      let nextStage = "";
      response.flows.forEach((flow) => {
        if (
          flow.stages.includes("m.login.email.identity") &&
          flow.stages.includes("m.login.recaptcha")
        ) {
          nextStage = "m.login.recaptcha";
        }
      });
      switch (nextStage) {
        case "m.login.recaptcha": {
          setFields("session", response.session);
          setCurrentStage("m.login.recaptcha");
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
        const response = await registerWithRecaptcha(client, {
          email: fields.email,
          password: fields.password,
          responseCaptch: responseCaptch,
          session: fields.session,
          username: fields.userName,
        });
        setStagesCompleted([...stagesCompleted(), "m.login.recaptcha"]);
        if (!response) {
          navigation("/");
        }
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
              if (currentStage()) {
                await onSubmit();
                return;
              }
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
              onBlur={() => {
                async function callback() {
                  try {
                    var client = createClient();
                    const response = await getLoginFlows(client);
                    localStorage.setItem("clientUrl", fields.server);
                    console.log(response);
                    setVerifyTypeOfFlows(response);
                    setCurrentStage("m.login.email.identity");
                  } catch (e) {
                    console.log("erre", e);
                  }
                }
                callback();
              }}
            />
          </div>

          <Show
            when={
              fields.server &&
              existPasswordLogin() &&
              currentStage() !== "m.login.recaptcha"
            }
          >
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
          </Show>
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
        <Show when={currentStage() === "m.login.recaptcha"}>
          <GReCaptch siteKey={recaptchat()} onVerify={onVerify} />
        </Show>
      </div>
    </div>
  );
};

export default Register;
