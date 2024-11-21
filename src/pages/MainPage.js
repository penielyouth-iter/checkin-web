import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database, ref, get } from "../services/firebase";

import Banner from '../components/Banner'
import '../styles/AllStyles.css'

function MainPage() {
    const navigate = useNavigate();
    const [families, setFamilies] = useState([]);

    // Fetch data from Firebase
    useEffect(() => {
        const fetchData = async () => {
            try {
                const dbRef = ref(database, "peniel/families_dev"); // Replace "data" with your JSON key in Firebase
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    console.log("Data snapshot loaded.");
                    setFamilies(snapshot.val());
                } else {
                    console.error("No data available");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const goToSecondPage = () => {
        navigate("/second");
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px", backgroundColor: '#fdf1df'}}>

            <Banner/>

            <div>
                {families.map((familyData, familyIndex) => (
                    // Family Block
                    <div>
                        {/* Family Name Block */}
                        <div className="block">
                            <div>
                                <div className="title">{familyData.title}</div>
                            </div>
                        </div>

                        {/* Member Block */}
                        <div className="block">
                            {/* Header Row */}
                            <div className="familyRow">
                                <div className="familyNameCol" style={{ flex: 2 }} /> {/* Flex adjustment for nameCell */}
                                <div className="familyCheckboxCol">
                                    <span className="text">簽到</span>
                                </div>
                                <div className="familyCheckboxCol">
                                    <span className="text">分組</span>
                                </div>
                                <div className="familyCheckboxCol">
                                    <span className="text">用餐</span>
                                </div>
                            </div>

                            <div>
                                {familyData.members.map((member, memberIndex) => (
                                    <div className="familyRow familyRowBackgound">
                                        <div className="familyNameCol">
                                            <text className="text">{member.name}</text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>



            <button onClick={goToSecondPage} style={{ padding: "10px 20px", fontSize: "16px" }}>
                Go to Second Page
            </button>

        </div>
    );
}

export default MainPage;
