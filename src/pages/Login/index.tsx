import { For, Show, Switch, Match, createSignal, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import matrixcs from "matrix-js-sdk";
import Input from "../../components/InputWithLabel";
import { useNavigate } from "@solidjs/router";
import Button from "../../components/Button";
type flowType = Array<"m.login.email.identity" | "m.login.recaptcha">;
const options = {
  "m.login.password": {
    label: "Senha",
    type: "m.login.email.identity",
  },
  "m.login.application_service": {
    label: "",
  },
};

const Login = () => {
  const [fields, setFields] = createStore({
    email: "",
    password: "",
    server: "",
  });
  const createClient = createMemo(() => {
    return matrixcs.createClient({ baseUrl: fields.server });
  });
  const [loading, setLoading] = createSignal(false);
  const navigation = useNavigate();
  const [currentStage, setCurrentStage] = createSignal<
    "m.login.email.identity" | "m.login.recaptcha"
  >();
  const onSubmit = async () => {
    const client = createClient();
    const response = await client.login("m.login.password", {
      password: fields.password,
      initial_device_display_name: "app.nitro.chat: Brave em Linux",
      identifier: {
        address: fields.email,
        medium: "email",
        type: "m.id.thirdparty",
      },
    });
    navigation("dashboard");
    console.log(response);
  };
  const [verifyTypesofFlows, setVerifyTypeOfFlows] = createSignal<
    { type: flowType }[]
  >([]);
  return (
    <div class="h-full w-full flex items-center justify-center bg-slate-900">
      <div class="bg-white rounded-md p-8 pb-9 flex flex-col">
        <form
          onSubmit={async (e) => {
            var client = createClient();
            e.preventDefault();
            if (currentStage()) {
              await onSubmit();
              return;
            }
            const response = await client.loginFlows();
            console.log(response);
            setVerifyTypeOfFlows(response.flows);
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
      </div>
    </div>
  );
};

export default Login;
