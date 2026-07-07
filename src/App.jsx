import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainPage from "./pages/MainPage";
import GroupPage from "./pages/GroupPage";
import RecordPage from "./pages/RecordPage";
import WeeklyReportEditPage from "./pages/WeeklyReportEditPage";
import WeeklyReportViewPage from "./pages/WeeklyReportViewPage";
import { ADMIN_SESSION_KEY } from "./constants/AdminAuth";

function App() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');

  useEffect(() => {
    if (isAdmin) sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }, [isAdmin]);

  return (
    <Routes>
      <Route path="/" element={<HomePage isAdmin={isAdmin} onAdminChange={setIsAdmin} />} />
      <Route path="/checkin" element={<MainPage isAdmin={isAdmin} />} />
      <Route path="/group" element={<GroupPage />} />
      <Route path="/record" element={<RecordPage isAdmin={isAdmin} />} />
      <Route path="/weekly/edit" element={<WeeklyReportEditPage isAdmin={isAdmin} />} />
      <Route path="/weekly/view" element={<WeeklyReportViewPage />} />
    </Routes>
  );
}

export default App;
