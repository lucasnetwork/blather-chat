import {
  For,
  Show,
  Switch,
  Match,
  createSignal,
  createMemo,
  createEffect,
} from "solid-js";
import { createStore } from "solid-js/store";
import matrixcs, { LoginFlow } from "matrix-js-sdk";
import Input from "../../components/InputWithLabel";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import Button from "../../components/Button";
import GRECaptch from "solid-grecaptcha";
import { createScriptLoader } from "@solid-primitives/script-loader";
type typePasswordLogin = "m.id.phone" | "m.id.thirdparty" | "m.id.user";

const options: {
  [key: string]: {
    label: string;
    type: typePasswordLogin;
  };
} = {
  "m.id.phone": {
    label: "Telephone",
    type: "m.id.phone",
  },
  "m.id.thirdparty": {
    label: "Email",
    type: "m.id.thirdparty",
  },
  "m.id.user": {
    label: "Nome de usuário",
    type: "m.id.user",
  },
};

const arrayCurrentTypePasswordLogin: Array<typePasswordLogin> = [
  "m.id.phone",
  "m.id.thirdparty",
  "m.id.user",
];

const Login = () => {
  const [fields, setFields] = createStore({
    value: "",
    password: "",
    server: "",
  });
  const createClient = createMemo(() => {
    return matrixcs.createClient({ baseUrl: fields.server });
  });
  const [loading, setLoading] = createSignal(false);
  const [arrayTypePasswordLogin] = createSignal(arrayCurrentTypePasswordLogin);
  const navigation = useNavigate();
  const [currentType, setCurrentType] =
    createSignal<typePasswordLogin>("m.id.user");
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthAuthenticates, setOAuthAuthenticates] = createSignal([]);
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
  const [verifyTypesofFlows, setVerifyTypeOfFlows] = createSignal<LoginFlow[]>(
    [],
  );
  createEffect(() => {
    const url = localStorage.getItem("clientUrl");
    if (url) {
      setFields("server", url);
    }
  });

  const label = createMemo(() => {
    switch (currentType()) {
      case "m.id.phone":
        return "Telephone";
      case "m.id.thirdparty":
        return "Email";
      case "m.id.user":
        return "username";
    }
  });
  createEffect(() => {
    if (!fields.server) {
      return;
    }
    console.log(searchParams.loginToken);
    async function callback() {
      const client = createClient();
      const response = await client.login("m.login.token", {
        token: searchParams.loginToken,
      });
      localStorage.setItem("user", JSON.stringify(response));

      navigation("dashboard");
    }
    callback();
  });
  return (
    <div class="h-full w-full flex items-center justify-center bg-slate-900">
      <div class="bg-white rounded-md p-8 pb-9 flex flex-col">
        <form
          onSubmit={async (e) => {
            var client = createClient();
            e.preventDefault();
            // if (currentStage()) {
            //   await onSubmit();
            //   return;
            // }
          }}
        >
          <div class="mb-5">
            <Input
              label="servidor url"
              value={fields.server}
              onInput={(e) => setFields("server", e.target.value)}
              onBlur={async () => {
                try {
                  var client = createClient();
                  const response = await client.loginFlows();
                  localStorage.setItem("clientUrl", fields.server);
                  console.log(response);
                  response.flows.forEach((flow) => {
                    if (flow.type === "m.login.sso") {
                      console.log(flow.type);
                      setOAuthAuthenticates(flow.identity_providers);
                    }
                  });
                  setVerifyTypeOfFlows(response.flows);
                } catch (e) {
                  console.log("erre", e);
                }
              }}
            />
          </div>
          <select
            onChange={(e) => {
              setCurrentType(() => e.target.value as typePasswordLogin);
              setFields("value", "");
            }}
          >
            <option>selecione uma opção</option>
            <For
              each={arrayTypePasswordLogin()}
              fallback={<div>Loading...</div>}
            >
              {(cat) => (
                <option value={options[cat].type}>{options[cat].label}</option>
              )}
            </For>
          </select>

          <div class="flex flex-col gap-y-5">
            <div class="flex  gap-x-2">
              <Input
                label={label()}
                value={fields.value}
                onInput={(e) => setFields("value", e.target.value)}
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
          <div class="pt-5">
            {/* <Show when={currentStage() !== "m.login.recaptcha"}> */}
            <Button label="logar" loading={loading()}>
              {/* <Switch fallback="">
                  <Match when={!currentStage()}>Verificar servidor</Match>
                  <Match when={currentStage() === "m.login.email.identity"}>
                  </Match>
                </Switch> */}
              Logar
            </Button>
            {/* </Show> */}
          </div>
          <For each={oauthAuthenticates()}>
            {(auth) => (
              <button
                type="button"
                onClick={() => {
                  console.log(auth);
                  const client = createClient();
                  const responsesso = client.getSsoLoginUrl(
                    "http://localhost:3000/",
                    "sso",
                    auth.id,
                  );
                  console.log(responsesso);
                  window.location.href = responsesso;
                }}
              >
                <p>{auth.name}</p>
                <img src={auth.icon} />
              </button>
            )}
          </For>
        </form>
      </div>
    </div>
  );
};

export default Login;
