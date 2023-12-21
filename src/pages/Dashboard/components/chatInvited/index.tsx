import { IRoom, useContextProvider } from "../../../../services/context";
import { Show, createSignal, onMount } from "solid-js";

interface IChatInvited {
  room: IRoom;
}

const ChatInvited = (props: IChatInvited) => {
  const { handleCurrentRoom, createClient } = useContextProvider();
  const [url, setUrl] = createSignal("");
  onMount(() => {
    const newUrl = props.room.profileUrl;
    if (newUrl) {
      setUrl(newUrl);
    }
  });
  return (
    <div
      onClick={() => handleCurrentRoom(props.room.id)}
      class="flex flex-col py-4 pl-2 gap-x-2 pr-2   w-full"
    >
      <div class="flex">
        <div>
          <Show
            when={url()}
            fallback={
              <div class="w-8 h-8 rounded-full bg-darkII text-white flex items-center justify-center">
                {props.room?.name && props.room?.name[0]}
              </div>
            }
          >
            <img src={url()} class="object-cover w-8 h-8 rounded-full" />
          </Show>
        </div>
        <div>
          <h2 class="text-white">{props.room?.name}</h2>
        </div>
      </div>
      <div class="flex gap-x-4 mt-2">
        <button
          type="button"
          class="bg-green-600 py-2 flex-1"
          onClick={() => {
            const client = createClient();
            client.joinRoom(props.room.id);
          }}
        >
          Aceitar
        </button>
        <button
          onClick={() => {
            const client = createClient();
            client.leave(props.room.id);
          }}
          type="button"
          class="flex-1 bg-red-600 py-2"
        >
          Recusar
        </button>
      </div>
    </div>
  );
};

export default ChatInvited;
