import { For, Show } from "solid-js";
import { useContextProvider } from "../../services/context";
import ChatBanner from "./components/chatBanner";

const Dashboard = () => {
  const { rooms, currentRoom, loading } = useContextProvider();

  return (
    <div class="flex h-full w-full">
      <Show when={!loading()}>
        <aside class="h-full w-full max-w-sm border-r-red-800 border">
          <For each={rooms()}>{(room) => <ChatBanner room={room} />}</For>
        </aside>
        <main class="flex-1 flex flex-col">
          <Show when={currentRoom()}>
            <div class="flex-1">
              <For each={currentRoom().chat}>
                {(chat) => <p>{chat.content.body}</p>}
              </For>
            </div>
            <form class="flex ">
              <input
                class="pr-4 pl-4 py-3 flex-1"
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
