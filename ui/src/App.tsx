import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import StatementsList from "./pages/Statements/StatementsList";
import UploadStatement from "./pages/Upload/UploadStatement";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/statements" element={<StatementsList />} />
        <Route path="/upload" element={<UploadStatement />} />
      </Route>
    </Routes>
  );
}

export default App;
