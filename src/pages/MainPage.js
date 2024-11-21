import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database, ref, get } from "../services/firebase";

import Banner from '../components/Banner'
import '../styles/AllStyles.css'

function MainPage() {
    const navigate = useNavigate();
    const [families, setFamilies] = useState([]);

    const [isDialogVisible, setIsDialogVisible] = useState(null);
    const [dialogType, setDialogType] = useState("");


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

    const handleFamilyCheckboxChange = (familyIndex, memberIndex, stateKey) => {
        const updatedFamily = [...families];
        updatedFamily[familyIndex]["members"][memberIndex][stateKey] = !updatedFamily[familyIndex]["members"][memberIndex][stateKey];
        console.log(updatedFamily[familyIndex]["members"][memberIndex][stateKey])
        setFamilies(updatedFamily);
    };

    const onCancelDialog = () => {
        setIsDialogVisible(null);
        setDialogType("");
    }

    const onConfirmDialog = (inputName, familyTitle, selectedGender, selectPopupType) => {
        setIsDialogVisible(null);
        setDialogType("");

        if (selectPopupType === "Add") {
            console.log("Add " + inputName + " " + familyTitle + " " + selectedGender)
        }
        else if (selectPopupType === "Del") {
            console.log("Del " + inputName + " " + familyTitle + " " + selectedGender)
        }
    }

    return (
        <div style={{ textAlign: "center", marginTop: "50px", backgroundColor: '#fdf1df'}}>

            <Banner/>

            <div>
                {families.map((familyData, familyIndex) => (
                    // Family Block
                    <div>
                        {/* Family Name Block */}
                        <div className="block" style={{ flexDirection: 'row', display: 'flex' }} >
                            <div className="title">{familyData.title}</div>
                            <div className="iconContainer">
                                <button 
                                    className="iconButton"
                                    onClick={() => { setIsDialogVisible(familyIndex); setDialogType("Add"); console.log("Add Clicked!"); }}
                                >
                                <img
                                    src={require('../assets/images/addMember.png')}
                                    alt="Add Member"
                                    className="iconImage"
                                />
                                </button>

                                <button 
                                    className="iconButton"
                                    onClick={() => { setIsDialogVisible(familyIndex); setDialogType("Del"); console.log("Del Clicked!"); }}
                                >
                                <img
                                    src={require('../assets/images/delMember.png')}
                                    alt="Delete Member"
                                    className="iconImage"
                                />
                                </button>
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
                                            <div className="text">{member.name}</div>
                                        </div>
                                        <div className="familyCheckboxCol">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={member.arriveState}
                                                onChange={() => handleFamilyCheckboxChange(familyIndex, memberIndex, "arriveState")}
                                            />
                                        </div>
                                        <div className="familyCheckboxCol">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={member.groupState}
                                                onChange={() => handleFamilyCheckboxChange(familyIndex, memberIndex, "groupState")}
                                            />
                                        </div>
                                        <div className="familyCheckboxCol">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={member.mealState}
                                                onChange={() => handleFamilyCheckboxChange(familyIndex, memberIndex, "mealState")}
                                            />
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
