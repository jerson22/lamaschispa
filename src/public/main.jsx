import React from "react";
import reactDom from "react-dom/client";
import App from "./route";
import "./index.css";

reactDom.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>
);