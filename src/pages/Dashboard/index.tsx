import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { useContextProvider } from "../../services/context";
import ChatBanner from "./components/chatBanner";
import ChatInvited from "./components/chatInvited";
import { Visibility } from "matrix-js-sdk";
import Chat from "./components/Chat";

const Dashboard = () => {
  const { rooms, currentRoom, loading, createClient, initCreateRoom } =
    useContextProvider();
  const [currentTypeAsideBar, setCurrentTypeAsideBar] = createSignal("join");

  return (
    <div class="flex h-full w-full">
      <Show when={!loading()}>
        <aside class="h-full w-full max-w-sm flex flex-col ">
          <div class="bg-darkIII pl-3 py-3 flex justify-between px-4">
            <h1 class="text-white text-2xl">Chat</h1>
            <button
              type="button"
              class="text-white text-3xl"
              onClick={initCreateRoom}
            >
              +
            </button>
          </div>
          <div class="flex">
            <button
              type="button"
              class={`${
                currentTypeAsideBar() === "join" ? "bg-darkIII" : "bg-darkII"
              } pl-3 py-3 flex-1 text-xl text-white`}
              onClick={() => {
                setCurrentTypeAsideBar("join");
              }}
            >
              Chats
            </button>
            <button
              class={`${
                currentTypeAsideBar() === "invite" ? "bg-darkIII" : "bg-darkII"
              } pl-3 py-3 flex-1 text-xl text-white`}
              type="button"
              onClick={() => {
                setCurrentTypeAsideBar("invite");
              }}
            >
              Convites
            </button>
          </div>
          <div class="overflow-auto bg-darkI flex-1 scroll-smooth scrollbar-hide">
            <Switch>
              <Match when={currentTypeAsideBar() === "join"}>
                <For each={rooms.rooms}>
                  {(room) => <ChatBanner room={room} />}
                </For>
              </Match>
              <Match when={currentTypeAsideBar() === "invite"}>
                <For each={rooms.invites}>
                  {(room) => <ChatInvited room={room} />}
                </For>
              </Match>
            </Switch>
          </div>
        </aside>
        <main class="flex-1 flex flex-col overflow-auto ">
          <Switch>
            <Match when={typeof currentRoom() === "number"}>
              <Chat />
            </Match>
            <Match when={currentRoom() === "create"}>
              <div>Criar</div>
              <button
                type="button"
                onClick={() => {
                  const client = createClient();
                  client.createRoom({
                    name: "teste content",
                    visibility: Visibility.Private,
                  });
                }}
              >
                create
              </button>
            </Match>
          </Switch>
        </main>
      </Show>
    </div>
  );
};

export default Dashboard;
