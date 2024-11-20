import React from "react";
import { useNavigate } from "react-router-dom";

function SecondPage() {
  const navigate = useNavigate();

  const goToMainPage = () => {
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Second Page</h1>
      <button onClick={goToMainPage} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Go back to Main Page
      </button>
    </div>
  );
}

export default SecondPage;
