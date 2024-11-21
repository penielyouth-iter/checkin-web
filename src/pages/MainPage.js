import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database, ref, get } from "../services/firebase";

import Banner from '../components/Banner'
import DatePicker from "react-datepicker";  // Import the date picker component
import "react-datepicker/dist/react-datepicker.css";
import '../styles/AllStyles.css'

function MainPage() {
    const navigate = useNavigate();

    // ========== Firebase ==========
    useEffect(() => {       // Fetch data from Firebase
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


    // ========== Info Section ==========
    const worshipTypeList = ["青年崇拜", "團契美好時光"]
    const speakerTypeList = ["洪英正 教授", "錢玉芬 教授", "劉信優 牧師", "董倫賢 牧師", "楊雅莉 牧師", "蔡孟佳 牧師"]

    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [worshipRadioBtnIdx, setWorshipRadioBtnIdx] = React.useState(0);
    const [speakerRadioBtnIdx, setSpeakerRadioBtnIdx] = React.useState(0);
    const [worshipInputText, setWorshipInputText] = React.useState('');
    const [speakerInputText, setSpeakerInputText] = React.useState('');

    const [isDialogVisible, setIsDialogVisible] = useState(null);
    const [dialogType, setDialogType] = useState("");


    // ========== Family List Section ==========
    const [families, setFamilies] = useState([]);

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


    // ========== Grouping Section ==========
    const [groupsize, setGroupsize] = useState("4");
    const [remainder, setRemainder] = useState(0);
    const remainderType = [
        { label: '允許多人', value: 0 },
        { label: '允許少人', value: 1 }
    ];

    const startGrouping = (groupingData) => {
        // Function to handle grouping logic, replace with your actual logic
        console.log(groupingData);
        return { table: "Group Data", data: groupingData }; // Example return data
    };

    const handleStartGrouping = () => {
        let raw_grouping_data = {
            families: families,
            groupsize: groupsize,
            remainder: remainder,
        };
        let table_data = startGrouping(raw_grouping_data);
        console.log(table_data);  // Or navigate as needed, depending on your routing solution
    };

    const uploadWeeklyRecord = (data) => {
        console.log("Uploaded data:", data);
        // Handle upload logic
    };

    const handleGoToRecrodScreen = () => {
        console.log("Navigating to record screen");
        // Handle navigation logic
    };


    const goToSecondPage = () => {
        navigate("/second");
    };




    // ========== Layout ==========
    return (
        <div className="container">

            <Banner />

            {/* ========== Info Section =========== */}
            <div className="block" style={{ textAlign: 'left' }}>
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
            </div> {/* End of Info section */}


            {/* ========== Family List Section =========== */}
            {families.map((familyData, familyIndex) => (
                // Family Block
                <div>
                    {/* Family Title Block */}
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
                    </div>  {/* End of Family Title Block */}

                    {/* Member List Block */}
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
                    </div>  {/* End of Member List Block */}
                </div>
            ))} {/* End of Family List section */}


            {/* ========== Grouping Section =========== */}
            <div className="block" style={{ textAlign: 'left', }}>
                {/* Group size, Remainder type */}
                <div className="title">每組人數</div>
                <div className="formHoriView">
                    {/* Input for group size */}
                    <input
                        type="number"
                        className="input"
                        style={{ marginRight: '10px', textAlign: 'center', fontSize: 16 }}
                        value={groupsize}
                        onChange={(e) => setGroupsize(e.target.value)}
                        placeholder="Enter group size"
                    />

                    {/* Remainder type radio buttons */}
                    <div style={{ flexDirection: 'row', display: 'flex' }}>
                        {remainderType.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setRemainder(type.value)}
                                className="radioBox"
                                style={{
                                    borderColor: remainder === type.value ? '#f05c38' : '#bfbfbf',
                                    backgroundColor: remainder === type.value ? '#f05c38' : '',
                                    color: remainder === type.value ? '#ffffff' : '#bfbfbf',
                                }}
                            >

                                <span className="buttonText" style={{ color: remainder === type.value ? '#ffffff' : '#bfbfbf', fontSize: 12 }}>{type.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Start button */}
                    <button
                        className="button"
                        onClick={handleStartGrouping}
                    >
                        <span className="buttonText">分組！</span>
                    </button>
                </div>

                {/* Checkin result */}
                <div className="title">簽到結果</div>

                <div className="formHoriView" style={{ marginVertical: '10px' }}>
                    {/* Upload button */}
                    <button
                        className="button"
                        onClick={() => {
                            const data = {
                                date: selectedDate,
                                worship: worshipRadioBtnIdx < worshipTypeList.length ? worshipTypeList[worshipRadioBtnIdx] : worshipInputText,
                                speaker: speakerRadioBtnIdx < speakerTypeList.length ? speakerTypeList[speakerRadioBtnIdx] : speakerInputText,
                                families: families,
                            };
                            uploadWeeklyRecord(data);
                            alert('上傳完成');
                        }}
                    >
                        <span className="buttonText">上傳</span>
                    </button>

                    {/* View record button */}
                    <button
                        className="button"
                        onClick={handleGoToRecrodScreen}
                    >
                        <span className="buttonText">檢視紀錄</span>
                    </button>
                </div>
            </div> {/* End of Grouping section */}

            <button onClick={goToSecondPage} style={{ padding: "10px 20px", fontSize: "16px" }}>
                Go to Second Page
            </button>

        </div>
    );
}

export default MainPage;
