import matrixcs from "matrix-js-sdk";
export type typePasswordLogin = "m.id.phone" | "m.id.thirdparty" | "m.id.user";

interface Options {
  type: typePasswordLogin;
  user?: string;
  email?: string;
  password: string;
  phone?: {
    country: string;
    phone: string;
  };
}

export interface IdentityProvider {
  name: string;
  icon: string;
  id: string;
}

type ResponseLoginFlows =
  | {
      type: "m.login.sso" | "m.login.cas";
      identity_providers: IdentityProvider[];
    }
  | {
      type: "m.login.password";
    }
  | {
      type: "m.login.token";
    };

export const getLoginFlows = async (
  client: matrixcs.MatrixClient,
): Promise<ResponseLoginFlows[]> => {
  const response: any = await client.loginFlows();
  return response.flows;
};

const verifyOptions = (options: Options) => {
  let identifier:
    | { type: "m.id.user"; user: string }
    | { type: "m.id.phone"; country: string; phone: string }
    | { type: "m.id.thirdparty"; medium: string; address: string }
    | undefined = undefined;
  if (options.type === "m.id.user") {
    if (!options.user) {
      throw new Error("User not have empty");
    }
    identifier = {
      type: "m.id.user",
      user: options.user,
    };
  }
  if (options.type === "m.id.phone") {
    if (!options.phone?.country || !options.phone?.phone) {
      throw new Error("Phone not have empty");
    }
    identifier = {
      type: "m.id.phone",
      country: options.phone.country,
      phone: options.phone.phone,
    };
  }
  if (options.type === "m.id.thirdparty") {
    if (!options.email) {
      throw new Error("Email not have empty");
    }
    identifier = {
      type: "m.id.thirdparty",
      medium: "email",
      address: options.email,
    };
  }
  if (!identifier) {
    throw new Error("Option not exist");
  }
  return identifier;
};

export const loginPassword = (
  client: matrixcs.MatrixClient,
  options: Options,
) => {
  const identify = verifyOptions(options);
  return client.login("m.login.password", {
    password: options.password,
    initial_device_display_name: "Brave em Linux",
    identifier: identify,
  });
};
