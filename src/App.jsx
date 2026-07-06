import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainPage from "./pages/MainPage";
import GroupPage from "./pages/GroupPage";
import RecordPage from "./pages/RecordPage";
import WeeklyReportEditPage from "./pages/WeeklyReportEditPage";
import WeeklyReportViewPage from "./pages/WeeklyReportViewPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/checkin" element={<MainPage />} />
      <Route path="/group" element={<GroupPage />} />
      <Route path="/record" element={<RecordPage />} />
      <Route path="/weekly/edit" element={<WeeklyReportEditPage />} />
      <Route path="/weekly/view" element={<WeeklyReportViewPage />} />
    </Routes>
  );
}

export default App;
