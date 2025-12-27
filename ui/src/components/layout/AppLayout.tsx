import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const AppLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "16px", background: "#f9fafb" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
