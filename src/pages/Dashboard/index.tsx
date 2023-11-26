import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { useContextProvider } from "../../services/context";
import ChatBanner from "./components/chatBanner";

const Dashboard = () => {
  const { rooms, currentRoom, loading, createClient } = useContextProvider();

  const [message, setMessage] = createSignal();
  let divRef: HTMLDivElement | undefined;
  const sendMessage = () => {
    const client = createClient();
    const roomId = currentRoom();
    console.log("roomId", roomId);
    client.sendMessage(roomId.room_id, {
      msgtype: "m.text",
      body: message(),
    });
  };
  // console.log(rooms());
  createEffect(() => {
    console.log("rooms", rooms);
  });
  createEffect(() => {
    if (currentRoom() !== undefined) {
      divRef.scrollTop = divRef.scrollHeight;
    }
    console.log("cuttentRoom", currentRoom());
  });
  return (
    <div class="flex h-full w-full">
      <Show when={!loading()}>
        <aside class="h-full w-full max-w-sm border-r-red-800 border overflow-auto">
          <For each={rooms.rooms}>{(room) => <ChatBanner room={room} />}</For>
        </aside>
        <main class="flex-1 flex flex-col overflow-auto ">
          <Show when={currentRoom() !== undefined}>
            <div
              class="flex-1  overflow-auto"
              ref={divRef}
              onScroll={async (e) => {
                try {
                  if (e.target.scrollTop == 0) {
                    const client = createClient();

                    const room = rooms.rooms[currentRoom()];
                    await client.scrollback(room, 10);
                    divRef.scrollTop = 20;
                  }
                } catch (e) {
                  console.log("er", e);
                }
              }}
            >
              <div class=" h-[110%]">
                <For each={rooms.chat[currentRoom() || 0]}>
                  {(chat) => {
                    if (chat.type === "m.room.member") {
                      return (
                        <p>
                          {chat.content.displayname}{" "}
                          <Switch>
                            <Match when={chat.content.membership === "join"}>
                              Entrou no chat
                            </Match>
                            <Match when={chat.content.membership === "leave"}>
                              Saiu do Chat
                            </Match>
                          </Switch>
                        </p>
                      );
                    }
                    return <p>{chat.content.body}</p>;
                  }}
                </For>
              </div>
            </div>
            <form
              class="flex "
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                class="pr-4 pl-4 py-3 flex-1"
                onChange={(e) => setMessage(e.target.value)}
                placeholder="digite a mensagem"
              />
              <button>Enviar</button>
            </form>
          </Show>
        </main>
      </Show>
    </div>
  );
};

export default Dashboard;
