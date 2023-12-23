import matrixcs from "matrix-js-sdk";
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

interface IMensage {
  msgType: "m.image" | "m.text";
}
interface IMensageText extends IMensage {
  msgType: "m.text";
  text: string;
}
interface IMensageImage extends IMensage {
  msgType: "m.image";
  image: string;
}

type UnknowMessageType = IMensageImage | IMensageText;
export interface IChat {
  message: UnknowMessageType;
  sender: string;
  displayName: string;
  membership: string;
  type: "m.room.member" | "m.room.message";
  image?: string;
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
    chat: IChat[][];
    invites: IRoom[];
  };
  currentRoom: Accessor<number>;
  // eslint-disable-next-line no-unused-vars
  handleCurrentRoom: (roomId: string) => void;
  loading: Accessor<boolean>;
  initCreateRoom: () => void;
}
const Context = createContext<IContext>({} as IContext);

export function ContextProvider(props: { children: JSX.Element }) {
  const [rooms, setRooms] = createStore<{
    rooms: IRoom[];
    chat: IChat[];
    invites: IRoom[];
  }>({
    rooms: [],
    chat: [],
    invites: [],
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

  async function initCreateRoom() {
    setCurrentRoom("create");
  }

  const handleEvent = async (event, toStartOfTimeline) => {
    const client = createClient();
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
      console.log(event.event);
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
      const user = client.getUser(event.event.user_id);
      const image = client.mxcUrlToHttp(user?.avatarUrl);
      const chat = [...rooms.chat];
      let mensage: UnknowMessageType = {
        type: "m.text",
        text: event.event.content.body,
      };
      if (event.event.content.msgtype === "m.image") {
        const image = client.mxcUrlToHttp(event.event.content.url);
        console.log("image", image);
        mensage = {
          msgType: "m.image",
          image: image,
        };
      }
      chat[findRoom] = [
        {
          message: mensage,
          sender: event.event.sender,
          displayName: user?.displayName,
          membership: event.event.content.membership,
          type: event.event.type,
          image,
        },
        ...(chat[findRoom] || []),
      ];
      console.log(chat);
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
      const user = client.getUser(event.event.user_id);
      const findRoom = rooms.rooms.findIndex(
        (room) => room.id === event.event.room_id,
      );
      const image = client.mxcUrlToHttp(user.avatar_url);
      const chat = [...rooms.chat];
      chat[findRoom] = [
        {
          type: event.event.type,
          displayName: user?.displayName,
          membership: event.event.content.membership,
          message: "",
          sender: event.event.sender,
          image,
        },
        ...(chat[findRoom] || []),
      ];

      setRooms({
        chat: chat,
        rooms: rooms.rooms,
      });
    }
  };

  async function handleCurrentRoom(roomId: string) {
    const client = createClient();
    const findRoom = rooms.rooms.findIndex((room) => room.id === roomId);
    const response = await client.roomInitialSync(roomId, 10);
    response.messages?.chunk.forEach((e) => handleEvent({ event: e }));
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
    // eslint-disable-next-line solid/reactivity
    return new Promise((resolve) => {
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
        const newRooms: IRoom[] = [];
        const newRoomsInvited: IRoom[] = [];
        currentRooms.forEach((room) => {
          const newRoom = {
            name: room.name,
            id: room.roomId,
            profileUrl: room.getAvatarUrl(client.baseUrl, 32, 32, "scale"),
          };
          if (room.selfMembership === "invite") {
            newRoomsInvited.push(newRoom);
            return;
          }
          newRooms.push(newRoom);
        });
        setRooms((e) => ({
          chat: e.chat,
          rooms: newRooms,
          invites: newRoomsInvited,
        }));

        client.on("Room.timeline", handleEvent);
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
        initCreateRoom,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}

export function useContextProvider() {
  return useContext(Context);
}
