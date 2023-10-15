import matrixcs from "matrix-js-sdk";
import crypto from "crypto";

export type RegisterFlowStage = "m.login.recaptcha" | "m.login.email.identity";

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

export const initialRegister = async (
  client: matrixcs.MatrixClient,
  options: {
    username: string;
    password: string;
  },
) => {
  try {
    await (client as any).register(options.username, options.password, null);
  } catch (e: any) {
    const error: ErrorMatrixInitialEmailRegister = e;
    if (error.data.flows) {
      return error.data;
    }
    throw e;
  }
};

export const registerWithRecaptcha = async (
  client: matrixcs.MatrixClient,
  data: {
    responseCaptch: string;
    username: string;
    password: string;
    session: string;
    email: string;
  },
) => {
  try {
    await (client as any).register(data.username, data.password, null, {
      type: "m.login.recaptcha",
      session: data.session,
      response: data.responseCaptch,
    });
  } catch (e: any) {
    const error: ErrorMatrixRegister = e;
    if (!error?.data?.completed?.find((err) => err === "m.login.recaptcha")) {
      throw e;
    }
  }
  const randomString = crypto.randomBytes(8).toString("hex");
  const response = await client.requestRegisterEmailToken(
    data.email,
    randomString,
    1,
  );

  try {
    const responseRegister = await client.register(
      data.username,
      data.password,
      data.session,
      {
        type: "m.login.email.identity",
        email: data.email,
        threepidCreds: {
          sid: response.sid,
          client_secret: randomString,
          id_server: "",
        },
        threepid_creds: {
          sid: response.sid,
          client_secret: randomString,
        },
      },
      {
        sid: response.sid,
        client_secret: randomString,
        initial_device_display_name: "app.nitro",
      },
    );
    return responseRegister;
  } catch (e: any) {
    const error: ErrorMatrixRegister = e;
    if (error.data.errcode === "M_UNAUTHORIZED") {
      return;
    }
  }
};
