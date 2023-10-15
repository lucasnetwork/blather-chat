import { createEffect } from "solid-js";
import { useContextProvider } from "../../services/context";

const Dashboard = () => {
  const { createClient, data } = useContextProvider();
  createEffect(() => {
    async function callback() {
      try {
        const client = createClient();
        const response = await client.getJoinedRooms();
        console.log(response);
        const test = await client.getRoomHierarchy(response.joined_rooms[0]);
        console.log(test);
      } catch (e) {
        console.log(e);
      }
    }
    callback();
  });
  return <div>Dashboard</div>;
};

export default Dashboard;
