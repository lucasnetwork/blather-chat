import matrixcs, { Room } from "matrix-js-sdk";
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

export interface IRoom {
  id: string;
  profileUrl: string;
  name: string;
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
    const findRoom = rooms.rooms.findIndex((room) => room.id === roomId);
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
        const newRooms = currentRooms.map((room) => ({
          name: room.name,
          id: room.roomId,
          profileUrl: room.getAvatarUrl(client.baseUrl, 32, 32),
        }));
        setRooms((e) => ({
          chat: e.chat,
          rooms: newRooms,
        }));

        client.on("Room.timeline", async function (event, toStartOfTimeline) {
          console.log(event.event);
          if (event.event.type === "m.room.encrypted") {
            return;
          }
          if (event.event.type === "m.room.name") {
            const findRoom = rooms.rooms.findIndex(
              (room) => room.id === event.event.room_id,
            );
            const newRooms = [...rooms.rooms];
            newRooms[findRoom] = {
              ...newRooms[findRoom],
              name: event.event.content.name,
            };
            setRooms({
              chat: rooms.chat,
              rooms: newRooms,
            });
            return;
          }
          if (event.event.type === "m.room.create") {
            const findRoom = rooms.rooms.length;
            const chat = [...rooms.chat];
            chat[findRoom] = [event.event];
            const room = await client.getRoomSummary(event.event.room_id);
            console.log(room);
            const newRooms = [
              ...rooms.rooms,
              {
                id: event.event.room_id,
              },
            ];

            setRooms({
              chat: chat,
              rooms: newRooms,
            });
            return;
          }
          if (event.event.type === "m.room.message") {
            const findRoom = rooms.rooms.findIndex(
              (room) => room.id === event.event.room_id,
            );
            const chat = [...rooms.chat];
            chat[findRoom] = [event.event, ...(chat[findRoom] || [])];

            setRooms({
              chat: chat,
              rooms: rooms.rooms,
            });
            return;
          }
          if (event.event.type === "m.room.member") {
            if (event.event.content.membership === "leave") {
              if (event.event.sender === data.user.userId) {
                const findRoom = rooms.rooms.filter(
                  (room) => room.id !== event.event.room_id,
                );
                setRooms({
                  chat: rooms.chat,
                  rooms: findRoom,
                });
              }
            }
            const findRoom = rooms.rooms.findIndex(
              (room) => room.id === event.event.room_id,
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
