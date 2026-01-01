import "./App.css";
import {Badge} from "./ui-components"
import { useThemeClasses } from "./hooks/useThemeClasses";
import AttendancePage from "./pages/Attendance";
import Layout from "./ui-components/layout/Layout";
import BroadcastNotification from "./pages/BroadcastNotification";
// import { routes } from "./utils/routes/Routes";
// import { useRoutes } from "react-router-dom";
function App() {
  // const [count, setCount] = useState(0)
  // const element = useRoutes(routes)
  return (
    <>
      {/* <div className="bg-primary-600 p-4">
        Teacher Button
      </div>
      <div className="bg-red-500 text-white p-8 text-2xl">
      Tailwind Test
    </div> */}
    {/* <Badge>Badge</Badge> */}
    {/* <Button> </Button> */}
    {/* <AttendancePage /> */}
    {/* <Layout >
    </Layout> */}
    <BroadcastNotification />
    
    </>
  );
}

export default App;
