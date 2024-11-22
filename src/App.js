import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import GroupPage from "./pages/GroupPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/group" element={<GroupPage />} />
    </Routes>
  );
}

export default App;
