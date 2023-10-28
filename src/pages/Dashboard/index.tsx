import { For, createEffect, createSignal } from "solid-js";
import { useContextProvider } from "../../services/context";
import ChatBanner from "./components/chatBanner";

const Dashboard = () => {
  const { _, createClient, rooms } = useContextProvider();
  // const [rooms, setRooms] = createSignal<string[]>([]);
  createEffect(() => {
    async function callback() {
      try {
        const client = createClient();
        const response = await client.getJoinedRooms();
        // setRooms(response.joined_rooms);
      } catch (e) {
        console.log(e);
      }
    }
    // callback();
  });
  return (
    <div class="flex h-full w-full">
      <aside class="h-full">
        <For each={rooms()}>{(room, i) => <ChatBanner room={room} />}</For>
      </aside>
    </div>
  );
};

export default Dashboard;
