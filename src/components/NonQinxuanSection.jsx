import React from 'react';

function GenderBlock({ title, members, gender, onCheckboxChange }) {
    const arrivedCount = members.filter(m => m.arriveState).length;

    return (
        <div className="subgroupBlock">
            <div className="subgroupHeader" style={{ cursor: 'default' }}>
                <span className="subgroupTitle">{title}</span>
                <span className="subgroupCount">{arrivedCount}/{members.length}</span>
            </div>
            <div className="subgroupContent">
                <div className="familyRow">
                    <div className="familyNameCol" style={{ flex: 2 }} />
                    <div className="familyCheckboxCol"><span className="text">簽到</span></div>
                    <div className="familyCheckboxCol"><span className="text">分組</span></div>
                    <div className="familyCheckboxCol"><span className="text">用餐</span></div>
                </div>
                {members.map((member, mIdx) => (
                    <div key={member.name} className="familyRow familyRowBackgound">
                        <div className="familyNameCol">
                            <div className="text">{member.name}</div>
                            {member._attendanceCount !== undefined && (
                                <div style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>
                                    {member._attendanceCount}次
                                </div>
                            )}
                        </div>
                        <div className="familyCheckboxCol">
                            <input type="checkbox" className="checkbox" checked={member.arriveState}
                                onChange={() => onCheckboxChange('nonQinxuan', gender, mIdx, 'arriveState')} />
                        </div>
                        <div className="familyCheckboxCol">
                            <input type="checkbox" className="checkbox" checked={member.groupState}
                                onChange={() => onCheckboxChange('nonQinxuan', gender, mIdx, 'groupState')} />
                        </div>
                        <div className="familyCheckboxCol">
                            <input type="checkbox" className="checkbox" checked={member.mealState}
                                onChange={() => onCheckboxChange('nonQinxuan', gender, mIdx, 'mealState')} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NonQinxuanSection({ nonQinxuan, onCheckboxChange }) {
    const total = nonQinxuan.brothers.length + nonQinxuan.sisters.length;
    const arrived = nonQinxuan.brothers.filter(m => m.arriveState).length
        + nonQinxuan.sisters.filter(m => m.arriveState).length;

    return (
        <div className="block" style={{ padding: 0 }}>
            <div className="sectionHeaderCollapsible" style={{ cursor: 'default' }}>
                <span className="title">非青宣小組</span>
                <span className="sectionCount">{arrived}/{total}</span>
            </div>
            <div style={{ padding: '0 20px 16px 20px' }}>
                <GenderBlock
                    title="弟兄"
                    members={nonQinxuan.brothers}
                    gender="brothers"
                    onCheckboxChange={onCheckboxChange}
                />
                <GenderBlock
                    title="姊妹"
                    members={nonQinxuan.sisters}
                    gender="sisters"
                    onCheckboxChange={onCheckboxChange}
                />
            </div>
        </div>
    );
}

export default NonQinxuanSection;
