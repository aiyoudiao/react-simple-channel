import React from "react";
import ReactDOM from "react-dom/client";
import { PermissionTree } from "@/components/PermissionTree";

import "@/index.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PermissionTree />
    </div>
  );
}

const container = document.getElementById("root")!;
const root = ReactDOM.createRoot(container);
root.render(<App />);
