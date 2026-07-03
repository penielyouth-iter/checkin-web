import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import GroupPage from "./pages/GroupPage";
import RecordPage from "./pages/RecordPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/group" element={<GroupPage />} />
      <Route path="/record" element={<RecordPage />} />
    </Routes>
  );
}

export default App;
