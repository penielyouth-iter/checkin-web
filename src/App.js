import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import SecondPage from "./SecondPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/second" element={<SecondPage />} />
    </Routes>
  );
}

export default App;
