import type { Component } from "solid-js";
import matrixcs from "matrix-js-sdk";
// import {} from "solid-start"
const App: Component = () => {
  // matrixcs.
  // var client = matrixcs.createClient({ baseUrl: "https://matrix-client.matrix.org" });
  // client.publicRooms().then(function (data) {
  //   // console.log("data ", data);
  //   // console.log("Congratulations! The SDK is working on the browser!");
  // });

  return (
    <div class="items-center flex justify-center min-h-screen">
      <button
        onClick={() => {
          // const session = client.getSessionId()
          // client.isUsernameAvailable("teste-lucas")
          // client.register(
          //   "lucas-teste-matrix-clien",
          //   "lucas123jmfdsa@$KJ",
          //   null
          // );
          // client
          //   .login("m.login.password", {
          //     password: "lucas123jmfdsa@$KJ",
          //     initial_device_display_name: "app.nitro.chat: Brave em Linux",
          //     identifier: {
          //       user: "lucas-teste-matrix-clien",
          //       type: "m.id.user",
          //     },
          //   })
          //   .then((e) => {
          //     console.log("result", e);
          //   })
          //   .catch((e) => {
          //     console.log(e);
          //   });
        }}
      >
        Register
      </button>
    </div>
  );
};

export default App;
