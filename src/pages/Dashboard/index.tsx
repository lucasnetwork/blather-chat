import { For, Show, createEffect, createSignal } from "solid-js";
import { useContextProvider } from "../../services/context";
import ChatBanner from "./components/chatBanner";

const Dashboard = () => {
  const { rooms, currentRoom, loading, createClient } = useContextProvider();
  const [message, setMessage] = createSignal();
  const sendMessage = () => {
    const client = createClient();
    const roomId = currentRoom();
    console.log("roomId", roomId);
    client.sendMessage(roomId.room_id, {
      msgtype: "m.text",
      body: message(),
    });
  };
  console.log(rooms());
  createEffect(() => {
    console.log(currentRoom());
    console.log(rooms());
    console.log(rooms()[currentRoom() || 0]?.chat);
  });
  return (
    <div class="flex h-full w-full">
      <Show when={!loading()}>
        <aside class="h-full w-full max-w-sm border-r-red-800 border overflow-auto">
          <For each={rooms()}>{(room) => <ChatBanner room={room} />}</For>
        </aside>
        <main class="flex-1 flex flex-col">
          <Show when={currentRoom()}>
            <div
              class="flex-1 overflow-auto"
              onScroll={async (e) => {
                // console.log(e);
                // const client = createClient();
                // const roomId = currentRoom();
                // const room = client.getRoom(roomId.room_id);
                // const responseRoom = await client.scrollback(room, 4);
                // console.log(responseRoom);
              }}
            >
              <For each={rooms()[currentRoom() || 0]?.chat || 0}>
                {(chat) => <p>{chat.content.body}</p>}
              </For>
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
