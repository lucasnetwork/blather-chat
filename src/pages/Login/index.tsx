import {
  For,
  createSignal,
  createMemo,
  createEffect,
  onMount,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import matrixcs, { LoginFlow } from "matrix-js-sdk";
import Input from "../../components/InputWithLabel";
import { useNavigate, useSearchParams } from "@solidjs/router";
import Button from "../../components/Button";
import {
  IdentityProvider,
  getLoginFlows,
  loginPassword,
  typePasswordLogin,
} from "../../lib/login";

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
    return matrixcs.createClient({ baseUrl: "https://" + fields.server });
  });
  const [loading, setLoading] = createSignal(false);
  const [arrayTypePasswordLogin] = createSignal(arrayCurrentTypePasswordLogin);
  const navigation = useNavigate();
  const [currentType, setCurrentType] =
    createSignal<typePasswordLogin>("m.id.user");
  const [searchParams] = useSearchParams();
  const [oauthAuthenticates, setOAuthAuthenticates] = createSignal<
    IdentityProvider[]
  >([]);
  const onSubmit = async () => {
    const client = createClient();
    const response = await loginPassword(client, {
      password: fields.password,
      type: currentType(),
      email: fields.value,
      user: fields.value,
    });
    localStorage.setItem("user", JSON.stringify(response));
    localStorage.setItem("clientUrl", fields.server);
    navigation("dashboard");
  };
  const [verifyTypesofFlows, setVerifyTypeOfFlows] = createSignal<LoginFlow[]>(
    [],
  );
  // createEffect(() => {
  //   const url = localStorage.getItem("clientUrl");
  //   if (url) {
  //     setFields("server", url);
  //   }
  // });

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
  onMount(() => {
    async function callback() {
      const user = localStorage.getItem("user");
      if (user) {
        navigation("dashboard");
      }
    }
    callback();
  });
  onMount(() => {
    const url = localStorage.getItem("clientUrl");
    setFields("server", url);
  });
  createEffect(() => {
    if (!fields.server) {
      return;
    }
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
  const existPasswordLogin = createMemo(() => {
    const values = verifyTypesofFlows();
    return values.find((value) => value.type === "m.login.password");
  });
  return (
    <div class="h-full w-full flex items-center justify-center bg-slate-900">
      <div class="bg-white rounded-md p-8 pb-9 flex flex-col">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (fields.server) {
              await onSubmit();
            }
          }}
        >
          <div class="mb-5">
            <Input
              label="servidor url"
              value={fields.server}
              onInput={(e) => {
                setFields("server", e.target.value.replace("https://", ""));
              }}
              onBlur={() => {
                async function callback() {
                  try {
                    var client = createClient();
                    const response = await getLoginFlows(client);
                    localStorage.setItem("clientUrl", fields.server);
                    response.forEach((flow) => {
                      if (flow.type === "m.login.sso") {
                        console.log(flow.type);
                        setOAuthAuthenticates(flow.identity_providers);
                      }
                    });
                    setVerifyTypeOfFlows(response);
                  } catch (e) {
                    console.log("erre", e);
                  }
                }
                callback();
              }}
            />
          </div>

          <Show when={fields.server && existPasswordLogin()}>
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
                  <option value={options[cat].type}>
                    {options[cat].label}
                  </option>
                )}
              </For>
            </select>
            <div class="flex flex-col gap-y-5">
              <div class="flex gap-x-2">
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
          </Show>
          <div class="pt-5">
            <Button label="logar" loading={loading()}>
              {/* <Switch fallback="">
                  <Match when={!currentStage()}>Verificar servidor</Match>
                  <Match when={currentStage() === "m.login.email.identity"}>
                  </Match>
                </Switch> */}
              Logar
            </Button>
          </div>
          <For each={oauthAuthenticates()}>
            {(auth) => (
              <button
                type="button"
                onClick={() => {
                  const client = createClient();
                  const responsesso = client.getSsoLoginUrl(
                    "http://localhost:3000/",
                    "sso",
                    auth.id,
                  );
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
