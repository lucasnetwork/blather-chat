import matrixcs, { EmittedEvents } from "matrix-js-sdk";
import { IHierarchyRoom } from "matrix-js-sdk/lib/@types/spaces";
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

export interface IRoom extends IHierarchyRoom {
  chat: [];
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
  rooms: Accessor<IRoom[]>;
}
const Context = createContext<IContext>({} as IContext);

export function ContextProvider(props: { children: JSX.Element }) {
  const [rooms, setRooms] = createSignal<IHierarchyRoom[]>([]);
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
      client.once("sync", function (state, prevState, res) {
        console.log(state); // state will be 'PREPARED' when the client is ready to use
        if (state === "PREPARED") {
          client.once("sync", function (state, prevState, res) {
            console.log(state); // state will be 'PREPARED' when the client is ready to use
            if (state === "SYNCING") {
              resolve("SYNCING");
            }
          });
        }
      });
    });
  }
  createEffect(() => {
    async function callback() {
      if (data.url) {
        setInitial(false);
        const client = createClient();
        await client.startClient();
        const getRooms = await client.getJoinedRooms();
        const response = getRooms.joined_rooms.map(async (room) => {
          const response = await client.getRoomSummary(room);
          const avatar = client.mxcUrlToHttp(response.avatar_url);
          response.avatar_url = avatar;
          return {
            ...response,
            chat: [],
          };
        });
        const promises = await Promise.all(response);
        setRooms(promises);
        await prepareSync();

        client.on("Room.timeline", async function (event, toStartOfTimeline) {
          console.log(event.event);
          const currentRooms = rooms();
          if (event.event.type === "m.room.encrypted") {
            return;
            // const get = await client.downloadKeysForUsers(
            //   [data.user.userId],
            //   data.user.access_token,
            // );
            // console.log("keys", get);
            // await client.decryptEventIfNeeded(event);
            // console.log("--->", event);
            // console.log("--->", event.event);
            // console.log("--->", event.getContent());
            // // const response2 = await client.decryptEventIfNeeded(
            // //   event.event,
            // // );
            // // console.log("response2", response2);
          }
          if (event.event.type === "m.room.message") {
            const findRoom = currentRooms.findIndex(
              (room) => room.room_id === event.event.room_id,
            );
            currentRooms[findRoom] = {
              ...currentRooms[findRoom],
              chat: [...currentRooms[findRoom].chat, event.event.content],
            };
            setRooms([...currentRooms]);
          }
          if (event.event.type === "m.room.create") {
            console.log("event.event.type", event.event.type);

            const findRoom = currentRooms.find(
              (room) => room.room_id === event.event.room_id,
            );
            if (findRoom) {
              return;
            }
            currentRooms.push({
              room_id: event.event.room_id,
            });
            setRooms([...currentRooms]);
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
          }
          if (event.event.type === "m.room.name") {
            console.log("event.event.type", event.event.type);
            const findRoom = currentRooms.findIndex(
              (room) => room.room_id === event.event.room_id,
            );
            console.log(event.event.content.name);
            currentRooms[findRoom] = {
              ...currentRooms[findRoom],
              name: event.event.content.name,
            };
            console.log(currentRooms);
            setRooms([...currentRooms]);
          }
        });
      }
    }
    if (initial()) {
      callback();
    }
  });
  const values = { data, createClient, rooms: rooms };
  return <Context.Provider value={values}>{props.children}</Context.Provider>;
}

export function useContextProvider() {
  return useContext(Context);
}
