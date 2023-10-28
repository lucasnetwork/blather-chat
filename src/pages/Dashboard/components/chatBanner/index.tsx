import { IRoom } from "../../../../services/context";

interface IChatBanner {
  room: IRoom;
}

const ChatBanner = (props: IChatBanner) => {
  console.log(props);
  return (
    <button
      type="button"
      class="flex py-4 pl-2 gap-x-2 pr-2 border-b-blue-50 border"
    >
      <div>
        <img src={props.room.avatar_url} class="max-w-[2rem]" />
      </div>
      <div>
        <h2>{props.room.name}</h2>
      </div>
    </button>
  );
};

export default ChatBanner;
