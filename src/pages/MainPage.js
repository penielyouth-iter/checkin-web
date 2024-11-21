import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database, ref, get } from "../services/firebase";

function MainPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, "peniel/families_dev"); // Replace "data" with your JSON key in Firebase
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          setData(snapshot.val());
        } else {
          console.error("No data available");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const goToSecondPage = () => {
    navigate("/second");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Main Page</h1>
      <button onClick={goToSecondPage} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Go to Second Page
      </button>
      <div style={{ marginTop: "20px" }}>
        {loading ? (
          <p>Loading data...</p>
        ) : data ? (
          <ul>
            {Object.keys(data).map((key) => (
              <li key={key}>
                <strong>{key}:</strong> {JSON.stringify(data[key])}
              </li>
            ))}
          </ul>
        ) : (
          <p>No data found</p>
        )}
      </div>
    </div>
  );
}

export default MainPage;
