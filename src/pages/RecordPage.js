import React, { useState, useEffect } from 'react';
import { get, set } from 'firebase/database';
import { recordDbRef } from "../services/firebase";
import { IMAGES, JSONS } from '../constants/AssetPaths';
import '../styles/RecordPage.css';

const RecordPage = () => {
    const multiSelect = false;
    const [records, setRecords] = useState([]);

    useEffect(() => {
        fetchWeeklyData();
    }, []);

    const fetchWeeklyData = () => {
        get(recordDbRef).then((snapshot) => {
            let weeklyRecord;
            if (snapshot.exists()) {
                console.log("Record data snapshot loaded.");
                weeklyRecord = snapshot.val();
            } else {
                console.log("No data available, use default local data.");
                weeklyRecord = JSONS.RECORD_DEFAULT
            }
            setRecords(weeklyRecord);
        }).catch((error) => {
            console.error(error);
        });
    };

    const ExpandableComponent = ({ rowId, item, onClickFunction }) => {
        const [isExpanded, setIsExpanded] = useState(item.isExpanded);

        useEffect(() => {
            setIsExpanded(item.isExpanded);
        }, [item.isExpanded]);

        return (
            <div className="expandable-item">
                <div className="item-header" onClick={onClickFunction}>
                    <span>{item.title}</span>
                </div>

                <div className="item-content" style={{ display: isExpanded ? 'block' : 'none' }}>
                    {item.field.map((fieldData, key) => (
                        <div key={key} className="field">
                            <hr className="separator" />
                            <span>{fieldData.key} : {fieldData.value}</span>
                            {/* <hr className="separator" /> */}
                        </div>
                    ))}

                    <hr className="separator" />

                    <div className="actions">
                        {/* {item.fullData && (
                            <button
                                className="action-button"
                                onClick={() => {
                                    if (window.confirm('確定載入紀錄？')) {
                                        console.log("loading ok");
                                        handleGoBack(item.fullData);
                                    }
                                }}
                            >
                                <img src={IMAGES.DOWNLOAD_RECORD} alt="Download" />
                            </button>
                        )} */}

                        <button
                            className="action-button"
                            onClick={() => {
                                if (window.confirm('確定刪除紀錄？')) {
                                    const newRecords = [...records];
                                    newRecords.splice(rowId, 1);
                                    setRecords(newRecords);
                                    set(recordDbRef, newRecords);
                                }
                            }}
                        >
                            <img src={IMAGES.DEL_RECORD} alt="Delete" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const updateLayout = (index) => {
        const updatedRecords = [...records];
        if (multiSelect) {
            updatedRecords[index].isExpanded = !updatedRecords[index].isExpanded;
        } else {
            updatedRecords.forEach((record, i) => {
                record.isExpanded = i === index ? !record.isExpanded : false;
            });
        }
        setRecords(updatedRecords);
    };

    return (
        <div className="container">
            {records.map((item, key) => (
                <ExpandableComponent
                    key={key}
                    rowId={key}
                    item={item}
                    onClickFunction={() => updateLayout(key)}
                />
            ))}
        </div>
    );
};

export default RecordPage;
