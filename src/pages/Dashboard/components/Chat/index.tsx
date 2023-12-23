import { For, Show, Switch, Match, createSignal, createEffect } from "solid-js";
import { useContextProvider } from "../../../../services/context";
import { BsImage } from "solid-icons/bs";
import createDropzone from "solid-dzone";
import { AiOutlinePlus, AiOutlineSend, AiOutlineClose } from "solid-icons/ai";
import { EventTimeline } from "matrix-js-sdk";
const Chat = () => {
  const { getRootProps, getInputProps, files, clearFiles } =
    createDropzone<HTMLDivElement>();
  let inputRef!: HTMLInputElement;
  let rootRef!: HTMLDivElement;
  const [message, setMessage] = createSignal();
  let divRef: HTMLDivElement | undefined;
  const [fileUrl, setFileUrl] = createSignal<string>();
  const { rooms, currentRoom, createClient } = useContextProvider();
  const [type, setType] = createSignal<"chat" | "image">("chat");
  const [icon] = createSignal({
    image: <BsImage color="#fff" size={24} />,
    close: <AiOutlineClose color="#fff" size={24} />,
    plus: <AiOutlinePlus color="#333" size={48} />,
  });

  const sendMessage = async () => {
    const client = createClient();
    const roomId = currentRoom();
    let body: any = {
      body: message(),
    };
    let msgtype = "m.text";
    if (fileUrl()) {
      const file = files()[0];
      const image = await client.uploadContent(file.file);
      console.log(image);
      body = {
        body: file.name,
        info: {
          h: 398,
          mimetype: file.file.type,
          size: file.size,
          w: 394,
        },
        url: image.content_uri,
      };
      msgtype = "m.image";
    }

    client.sendMessage(rooms.rooms[roomId].id, {
      msgtype: msgtype,
      ...body,
    });
    setType("chat");
  };
  createEffect(() => {
    const file = files()[0];
    if (file) {
      const url = URL.createObjectURL(file.file);
      setFileUrl(url);
    }
  });
  createEffect(() => {
    if (!divRef) {
      return;
    }
    if (currentRoom() !== undefined) {
      divRef.scrollTop = divRef.scrollHeight;
    }
  });
  return (
    <div class="flex-1 flex flex-col overflow-auto">
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

            await client.scrollback(roomData, 100);

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
                      <Switch>
                        <Match when={chat.message.msgType === "m.text"}>
                          <p class="text-white">{chat.message.text}</p>
                        </Match>
                        <Match when={chat.message.msgType === "m.image"}>
                          <img src={chat.message.image} class="max-w-[10rem]" />
                          ;
                        </Match>
                      </Switch>
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
                {...getRootProps({})}
                ref={rootRef}
              >
                <input
                  class="w-full absolute opacity-0 h-full "
                  {...getInputProps()}
                  ref={inputRef}
                />
                <Show
                  when={fileUrl()}
                  fallback={
                    <div class="flex items-center flex-col">
                      {icon().plus}
                      <p class="text-2xl text-white">Adicione uma imagem</p>
                    </div>
                  }
                >
                  <div class="max-w-xs w-full object-cover">
                    <img src={fileUrl()} />
                  </div>
                </Show>
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
          class="ml-4"
          onClick={() => {
            if (type() === "image") {
              setType("chat");
              clearFiles();
              setFileUrl(undefined);
            } else {
              setType("image");
            }
          }}
        >
          <Switch>
            <Match when={type() === "image"}>{icon().close}</Match>
            <Match when={type() === "chat"}>{icon().image}</Match>
          </Switch>
        </button>
        <input
          class="pr-4 pl-4 py-3 flex-1 bg-transparent text-white"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="digite a mensagem"
        />
        <button class="text-white mr-4">
          <AiOutlineSend size={24} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
