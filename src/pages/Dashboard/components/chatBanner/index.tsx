import { IRoom, useContextProvider } from "../../../../services/context";
import { Show, createSignal, onMount } from "solid-js";

interface IChatBanner {
  room: IRoom;
}

const ChatBanner = (props: IChatBanner) => {
  const { handleCurrentRoom } = useContextProvider();
  const [url, setUrl] = createSignal("");
  onMount(() => {
    const newUrl = props.room.profileUrl;
    if (newUrl) {
      setUrl(newUrl);
    }
  });
  return (
    <button
      onClick={() => handleCurrentRoom(props.room.id)}
      type="button"
      class="flex py-4 pl-2 gap-x-2 pr-2   w-full"
    >
      <div>
        <Show
          when={url()}
          fallback={
            <div class="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
              {props.room?.name && props.room?.name[0]}
            </div>
          }
        >
          <img src={url()} class="object-cover w-8 h-8 rounded-full" />
        </Show>
      </div>
      <div>
        <h2>{props.room?.name}</h2>
      </div>
    </button>
  );
};

export default ChatBanner;
