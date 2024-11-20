import React from "react";
import { useNavigate } from "react-router-dom";

function MainPage() {
  const navigate = useNavigate();

  const goToSecondPage = () => {
    navigate("/second");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Main Page</h1>
      <button onClick={goToSecondPage} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Go to Second Page
      </button>
    </div>
  );
}

export default MainPage;
