import matrixcs from "matrix-js-sdk";
import {
  Accessor,
  JSX,
  createContext,
  createEffect,
  createMemo,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";

interface IContext {
  data: {
    url: string;
    user: {
      access_token: string;
    };
  };
  createClient: Accessor<matrixcs.MatrixClient>;
}
const Context = createContext<IContext>({} as IContext);

export function ContextProvider(props: { children: JSX.Element }) {
  const [data, setData] = createStore<{
    url: string;
    user: {
      access_token: string;
    };
  }>({
    url: "",
    user: {
      access_token: "",
    },
  });
  const createClient = createMemo(() => {
    const client = matrixcs.createClient({ baseUrl: "https://" + data.url });
    client.setAccessToken(data.user.access_token);
    return client;
  });

  createEffect(() => {
    const user = localStorage.getItem("user");
    const clientUrl = localStorage.getItem("clientUrl");

    if (user && clientUrl) {
      const userObject: {
        access_token: string;
      } = JSON.parse(user);
      setData({
        url: clientUrl,
        user: userObject,
      });
    }
  });
  return (
    <Context.Provider value={{ data, createClient }}>
      {props.children}
    </Context.Provider>
  );
}

export function useContextProvider() {
  return useContext(Context);
}
