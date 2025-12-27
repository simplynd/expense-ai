import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside
      style={{
        width: "220px",
        background: "#111827",
        color: "#fff",
        padding: "16px",
      }}
    >
      <h2 style={{ marginBottom: "24px" }}>Expense AI</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <NavLink to="/" style={{ color: "#fff", textDecoration: "none" }}>
          Dashboard
        </NavLink>
        <NavLink to="/statements" style={{ color: "#fff", textDecoration: "none" }}>
          Statements
        </NavLink>
        <NavLink to="/upload" style={{ color: "#fff", textDecoration: "none" }}>
          Upload Statement
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
