import React from 'react';

function CounselorBlock({ counselors, onCheckboxChange }) {
    return (
        <div className="block">
            <div className="sectionHeader">
                <span className="title">輔導</span>
            </div>

            <div className="familyRow">
                <div className="familyNameCol" style={{ flex: 2 }} />
                <div className="familyCheckboxCol"><span className="text">簽到</span></div>
                <div className="familyCheckboxCol"><span className="text">分組</span></div>
                <div className="familyCheckboxCol"><span className="text">用餐</span></div>
            </div>

            {counselors.map((member, idx) => (
                <div key={member.name} className="familyRow familyRowBackgound">
                    <div className="familyNameCol">
                        <div className="text">{member.name}</div>
                    </div>
                    <div className="familyCheckboxCol">
                        <input type="checkbox" className="checkbox" checked={member.arriveState}
                            onChange={() => onCheckboxChange('counselors', idx, 'arriveState')} />
                    </div>
                    <div className="familyCheckboxCol">
                        <input type="checkbox" className="checkbox" checked={member.groupState}
                            onChange={() => onCheckboxChange('counselors', idx, 'groupState')} />
                    </div>
                    <div className="familyCheckboxCol">
                        <input type="checkbox" className="checkbox" checked={member.mealState}
                            onChange={() => onCheckboxChange('counselors', idx, 'mealState')} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default CounselorBlock;
