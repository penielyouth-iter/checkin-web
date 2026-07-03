import React from 'react';

function SubgroupBlock({ subgroup, sgIndex, isExpanded, onToggle, onCheckboxChange }) {
    const memberCount = subgroup.members.length;
    const arrivedCount = subgroup.members.filter(m => m.arriveState).length;

    return (
        <div className="subgroupBlock">
            <div
                className="subgroupHeader"
                onClick={onToggle}
                style={{ cursor: 'pointer' }}
            >
                <span className="collapseIcon">{isExpanded ? '▼' : '▶'}</span>
                <span className="subgroupTitle">{subgroup.title}</span>
                <span className="subgroupCount">
                    {arrivedCount}/{memberCount}
                </span>
            </div>

            {isExpanded && (
                <div className="subgroupContent">
                    <div className="familyRow">
                        <div className="familyNameCol" style={{ flex: 2 }} />
                        <div className="familyCheckboxCol"><span className="text">簽到</span></div>
                        <div className="familyCheckboxCol"><span className="text">分組</span></div>
                        <div className="familyCheckboxCol"><span className="text">用餐</span></div>
                    </div>
                    {subgroup.members.map((member, mIdx) => (
                        <div key={member.name} className="familyRow familyRowBackgound">
                            <div className="familyNameCol">
                                <div className="text">{member.name}</div>
                            </div>
                            <div className="familyCheckboxCol">
                                <input type="checkbox" className="checkbox" checked={member.arriveState}
                                    onChange={() => onCheckboxChange('qinxuan', sgIndex, mIdx, 'arriveState')} />
                            </div>
                            <div className="familyCheckboxCol">
                                <input type="checkbox" className="checkbox" checked={member.groupState}
                                    onChange={() => onCheckboxChange('qinxuan', sgIndex, mIdx, 'groupState')} />
                            </div>
                            <div className="familyCheckboxCol">
                                <input type="checkbox" className="checkbox" checked={member.mealState}
                                    onChange={() => onCheckboxChange('qinxuan', sgIndex, mIdx, 'mealState')} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SubgroupBlock;
