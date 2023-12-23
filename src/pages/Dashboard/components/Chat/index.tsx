import { For, Show, Switch, Match, createSignal, createEffect } from "solid-js";
import { useContextProvider } from "../../../../services/context";
import { BsImage } from "solid-icons/bs";
import createDropzone from "solid-dzone";
import { AiOutlinePlus } from "solid-icons/ai";
const Chat = () => {
  const { getRootProps, getInputProps, setRefs } =
    createDropzone<HTMLDivElement>();
  let inputRef!: HTMLInputElement;
  let rootRef!: HTMLDivElement;
  const [message, setMessage] = createSignal();
  let divRef: HTMLDivElement | undefined;
  const { rooms, currentRoom, createClient } = useContextProvider();
  const [type, setType] = createSignal<"chat" | "image">("chat");

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
    <div class="flex-1 flex flex-col">
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
        <Switch>
          <Match when={type() === "chat"}>
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
          </Match>
          <Match when={type() === "image"}>
            <div class="w-full h-full p-6">
              <div
                class="w-full border-dashed relative flex items-center justify-center border-[10px] h-full border-darkIII"
                {...getRootProps()}
                ref={rootRef}
              >
                <input
                  class="w-full absolute opacity-0 h-full "
                  {...getInputProps()}
                  ref={inputRef}
                />
                <div class="flex items-center flex-col">
                  <AiOutlinePlus color="#333" size={48} />
                  <p class="text-2xl text-white">Adicione uma imagem</p>
                </div>
              </div>
            </div>
          </Match>
        </Switch>
      </div>
      <form
        class="flex bg-darkI"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (type() === "image") {
              setType("chat");
            } else {
              setType("image");
            }
          }}
        >
          <BsImage color="#fff" />
        </button>
        <input
          class="pr-4 pl-4 py-3 flex-1 bg-transparent"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="digite a mensagem"
        />
        <button>Enviar</button>
      </form>
    </div>
  );
};

export default Chat;
