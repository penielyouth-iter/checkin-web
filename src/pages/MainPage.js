import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database, ref, get } from "../services/firebase";

import Banner from '../components/Banner'
import DatePicker from "react-datepicker";  // Import the date picker component
import "react-datepicker/dist/react-datepicker.css";
import '../styles/AllStyles.css'

function MainPage() {
    const navigate = useNavigate();
    const [families, setFamilies] = useState([]);

    // Date, worship type and speaker selection
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [worshipRadioBtnIdx, setWorshipRadioBtnIdx] = React.useState(0);
    const [speakerRadioBtnIdx, setSpeakerRadioBtnIdx] = React.useState(0);
    const [worshipInputText, setWorshipInputText] = React.useState('');
    const [speakerInputText, setSpeakerInputText] = React.useState('');

    const [isDialogVisible, setIsDialogVisible] = useState(null);
    const [dialogType, setDialogType] = useState("");

    const worshipTypeList = ["青年崇拜", "團契美好時光"]
    const speakerTypeList = ["洪英正 教授", "錢玉芬 教授", "劉信優 牧師", "董倫賢 牧師", "楊雅莉 牧師", "蔡孟佳 牧師"]


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

            <div className="block" style={{textAlign: 'left'}}>
                {/* Select date */}
                <div className="title">今天日期 📅</div>
                <div className="subView">
                    <button
                        onClick={() => setDatePickerVisibility(true)}
                        className="dateButton"
                    >
                        {selectedDate ? selectedDate.toISOString().split('T')[0] : 'Please Select Date'}
                    </button>
                    
                    {/* Date Picker visibility toggle */}
                    {isDatePickerVisible && (
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => {
                                setSelectedDate(date);  // Update the selected date
                                setDatePickerVisibility(false);  // Close the date picker
                            }}
                            onClickOutside={() => setDatePickerVisibility(false)}  // Close the date picker if clicked outside
                            inline  // Render the date picker inline
                        />
                    )}
                </div> {/* End of Date div */}

                {/* Select worship type */}
                <div className="title">聚會形式 ⛪️</div>
                <div className="subView" style={{ alignItems: 'stretch' }}>
                    <div>
                        {worshipTypeList.map((worshipType, index) => (
                            <label key={index} className="radioButton">
                                <input
                                    type="radio"
                                    name="worshipType"
                                    value={worshipType}
                                    checked={worshipRadioBtnIdx === index}
                                    onChange={() => setWorshipRadioBtnIdx(index)}  // Update selected index
                                    style={{ marginRight: '8px' }}
                                />
                                <span>{worshipType}</span>
                            </label>
                        ))}
                        
                        {/* "Other" Option */}
                        <label className="radioButton">
                            <input
                                type="radio"
                                name="worshipType"
                                value="Other"
                                checked={worshipRadioBtnIdx === worshipTypeList.length}
                                onChange={() => setWorshipRadioBtnIdx(worshipTypeList.length)}  // Mark the "Other" option
                                style={{ marginRight: '8px' }}
                            />
                            <span>其他：</span>
                            <input
                                type="text"
                                value={worshipInputText}
                                onChange={(e) => setWorshipInputText(e.target.value)}
                                className="textInput"
                            />
                        </label>
                    </div>
                </div> {/* End of Worship div */}

                {/* Select speaker */}
                <div className="title">講員 🎤</div>
                <div className="subView" style={{ alignItems: 'stretch' }}>
                    <div>
                    {speakerTypeList.map((speakerType, index) => (
                        <label key={index} className="radioButton">
                        <input
                            type="radio"
                            name="speakerType"
                            value={speakerType}
                            checked={speakerRadioBtnIdx === index}
                            onChange={() => setSpeakerRadioBtnIdx(index)}  // Update selected index
                            style={{ marginRight: '8px' }}
                        />
                        <span>{speakerType}</span>
                        </label>
                    ))}
                    
                    {/* "Other" Option */}
                    <label className="radioButton">
                        <input
                            type="radio"
                            name="speakerType"
                            value="Other"
                            checked={speakerRadioBtnIdx === speakerTypeList.length}
                            onChange={() => setSpeakerRadioBtnIdx(speakerTypeList.length)}  // Mark the "Other" option
                            style={{ marginRight: '8px' }}
                        />
                        <span>其他：</span>
                        <input
                            type="text"
                            value={speakerInputText}
                            onChange={(e) => setSpeakerInputText(e.target.value)}
                            className="textInput"
                        />
                    </label>
                    </div>
                </div> {/* End of Speaker div */}
            </div> {/* End of info block */}

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
