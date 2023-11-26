import { makeEventListener } from "@solid-primitives/event-listener";
import matrixcs, { Room, EventType } from "matrix-js-sdk";
import {
  Accessor,
  JSX,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";

export interface IRoom extends Room {
  chat: {
    content: {
      message?: string;
      displayname: string;
      membership: "join" | "leave";
    };
    type: "m.room.member";
  }[];
}

interface IContext {
  data: {
    url: string;
    user: {
      access_token: string;
      userId: string;
    };
  };
  createClient: Accessor<matrixcs.MatrixClient>;
  rooms: {
    rooms: IRoom[];
    chat: any[];
  };
  currentRoom: Accessor<number>;
  handleCurrentRoom: (roomId: string) => void;
  loading: Accessor<boolean>;
}
const Context = createContext<IContext>({} as IContext);

export function ContextProvider(props: { children: JSX.Element }) {
  const [rooms, setRooms] = createStore<{
    rooms: IRoom[];
    chat: any[];
  }>({
    rooms: [],
    chat: [],
  });
  const [currentRoom, setCurrentRoom] = createSignal<number>();
  const [initial, setInitial] = createSignal(true);
  const [data, setData] = createStore<{
    url: string;
    user: {
      access_token: string;
      userId: string;
    };
  }>({
    url: "",
    user: {
      access_token: "",
      userId: "",
    },
  });
  const createClient = createMemo(() => {
    const client = matrixcs.createClient({
      baseUrl: "https://" + data.url,
      userId: data.user.userId,
    });
    client.setAccessToken(data.user.access_token);
    return client;
  });

  async function handleCurrentRoom(roomId: string) {
    const client = createClient();
    const findRoom = rooms.rooms.findIndex((room) => room.roomId === roomId);
    client.roomInitialSync(roomId, 10);
    if (findRoom > -1) {
      try {
        setCurrentRoom(findRoom);
      } catch (e) {
        console.log("error", e);
      }
      return;
    }
  }

  createEffect(() => {
    const user = localStorage.getItem("user");
    const clientUrl = localStorage.getItem("clientUrl");

    if (user && clientUrl) {
      const userObject: {
        access_token: string;
        user_id: string;
      } = JSON.parse(user);
      setData({
        url: clientUrl,
        user: {
          ...userObject,
          userId: userObject.user_id,
        },
      });
    }
  });

  async function prepareSync() {
    return new Promise((resolve, reject) => {
      const client = createClient();
      client.on("sync", function (state, prevState, res) {
        console.log("sync", state); // state will be 'PREPARED' when the client is ready to use
        if (state === "PREPARED") {
          resolve("SYNCING");
        }
      });
    });
  }
  createEffect(() => {
    async function callback() {
      if (data.url) {
        const client = createClient();
        await client.startClient();
        await prepareSync();

        setInitial(false);
        var currentRooms = client.getRooms();
        setRooms((e) => ({
          chat: e.chat,
          rooms: currentRooms || [],
        }));

        client.on("Room.timeline", function (event, toStartOfTimeline) {
          console.log(event.event);
          if (event.event.type === "m.room.encrypted") {
            return;
          }
          if (event.event.type === "m.room.message") {
            const findRoom = rooms.rooms.findIndex(
              (room) => room.roomId === event.event.room_id,
            );
            const chat = [...rooms.chat];
            chat[findRoom] = [event.event, ...(chat[findRoom] || [])];

            setRooms({
              chat: chat,
              rooms: rooms.rooms,
            });
          }
          if (event.event.type === "m.room.member") {
            if (event.event.content.membership === "leave") {
              if (event.event.sender === data.user.userId) {
                const findRoom = currentRooms.filter(
                  (room) => room.room_id !== event.event.room_id,
                );
                setRooms([...findRoom]);
              }
            }
            const findRoom = rooms.rooms.findIndex(
              (room) => room.roomId === event.event.room_id,
            );
            const chat = [...rooms.chat];
            chat[findRoom] = [event.event, ...(chat[findRoom] || [])];

            setRooms({
              chat: chat,
              rooms: rooms.rooms,
            });
          }
        });
      }
    }
    if (initial()) {
      callback();
    }
  });
  return (
    <Context.Provider
      value={{
        data,
        createClient,
        rooms: rooms,
        currentRoom,
        handleCurrentRoom,
        loading: initial,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}

export function useContextProvider() {
  return useContext(Context);
}
