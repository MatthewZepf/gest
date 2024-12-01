import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App";
import InProgress from "./In_Progress";

export default function AppWrapper() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/inprogress" element={<InProgress />} />
      </Routes>
    </Router>
  );
}