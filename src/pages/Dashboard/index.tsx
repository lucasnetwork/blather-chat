import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { useContextProvider } from "../../services/context";
import ChatBanner from "./components/chatBanner";
import ChatInvited from "./components/chatInvited";
import { Visibility } from "matrix-js-sdk";

const Dashboard = () => {
  const { rooms, currentRoom, loading, createClient, initCreateRoom } =
    useContextProvider();
  const [currentTypeAsideBar, setCurrentTypeAsideBar] = createSignal("join");
  const [message, setMessage] = createSignal();
  let divRef: HTMLDivElement | undefined;
  const sendMessage = () => {
    const client = createClient();
    const roomId = currentRoom();

    client.sendMessage(rooms.rooms[roomId].id, {
      msgtype: "m.text",
      body: message(),
    });
  };

  createEffect(() => {
    if (!divRef) {
      return;
    }
    if (currentRoom() !== undefined) {
      divRef.scrollTop = divRef.scrollHeight;
    }
  });
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
              <div
                class="flex-1  overflow-auto"
                ref={divRef}
                onScroll={async (e) => {
                  try {
                    if (e.target.scrollTop !== 0 || !divRef) {
                      return;
                    }
                    const client = createClient();
                    const room = rooms.rooms[currentRoom()];
                    const roomData = client.getRoom(room.id);
                    if (!roomData) {
                      return;
                    }
                    await client.scrollback(roomData, 10);
                    divRef.scrollTop = 20;
                  } catch (e) {
                    console.log("er", e);
                  }
                }}
              >
                <div
                  class="pt-9 flex flex-col gap-y-4 bg-dark px-4 pb-4"
                  style={{
                    height: "calc(100% + 5rem)",
                  }}
                >
                  <For each={rooms.chat[currentRoom() || 0]}>
                    {(chat) => {
                      const client = createClient();
                      if (chat.type === "m.room.member") {
                        return (
                          <div class="flex  self-center gap-x-4">
                            <Show
                              when={chat.image}
                              fallback={
                                <div class="w-4 h-4 rounded-full bg-darkI  text-white flex items-center justify-center">
                                  {chat?.displayName[0]}
                                </div>
                              }
                            >
                              <img
                                src={chat.image}
                                class="object-cover w-4 h-4 rounded-full"
                              />
                            </Show>
                            <p class="text-white text-xs text-slate-200">
                              {chat.displayName}{" "}
                              <Switch>
                                <Match when={chat.membership === "join"}>
                                  Entrou no chat
                                </Match>
                                <Match when={chat.membership === "leave"}>
                                  Saiu do Chat
                                </Match>
                              </Switch>
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div
                          class={`flex flex-col gap-y-2 ${
                            chat.sender === client.credentials.userId
                              ? "self-end"
                              : ""
                          }`}
                        >
                          <div class="flex gap-x-4">
                            <Show
                              when={chat.image}
                              fallback={
                                <div class="w-8 h-8 rounded-full bg-darkII text-white flex items-center justify-center">
                                  {chat.displayName[0]}
                                </div>
                              }
                            >
                              <img
                                src={chat.image}
                                class="object-cover w-8 h-8 rounded-full"
                              />
                            </Show>
                            <p class="text-white">{chat.displayName}</p>
                          </div>
                          <p class="text-white">{chat.message}</p>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
              <form
                class="flex bg-darkI"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <input
                  class="pr-4 pl-4 py-3 flex-1 bg-transparent"
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="digite a mensagem"
                />
                <button>Enviar</button>
              </form>
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
