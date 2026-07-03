import React, { useState } from 'react';

function SubgroupBlock({ subgroup, sectionIdx, sgIndex, isExpanded, onToggle, onCheckboxChange, onAddMember, allowQuickAdd = true, disableGrouping = false }) {
    const memberCount = subgroup.members.length;
    const arrivedCount = subgroup.members.filter(m => m.arriveState).length;

    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newGender, setNewGender] = useState('F');

    const handleQuickAdd = () => {
        if (!newName.trim()) return;
        onAddMember({ name: newName.trim(), gender: newGender, leader: 0 });
        setNewName('');
        setShowAdd(false);
    };

    return (
        <div className="subgroupBlock">
            <div className="subgroupHeader" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <span className="collapseIcon">{isExpanded ? '▼' : '▶'}</span>
                <span className="subgroupTitle">{subgroup.title}</span>
                <span className="subgroupCount">{arrivedCount}/{memberCount}</span>
                {allowQuickAdd && (
                    <button
                        className="quickAddBtn"
                        onClick={e => { e.stopPropagation(); setShowAdd(s => !s); }}
                        title="快速新增成員"
                    >＋</button>
                )}
            </div>

            {allowQuickAdd && showAdd && (
                <div className="quickAddForm">
                    <input
                        className="quickAddInput"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="姓名"
                        onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                        autoFocus
                    />
                    <select
                        className="quickAddSelect"
                        value={newGender}
                        onChange={e => setNewGender(e.target.value)}
                    >
                        <option value="F">姊妹</option>
                        <option value="M">弟兄</option>
                    </select>
                    <button className="quickAddConfirm" onClick={handleQuickAdd}>新增</button>
                    <button className="quickAddCancel" onClick={() => { setShowAdd(false); setNewName(''); }}>取消</button>
                </div>
            )}

            {isExpanded && (
                <div className="subgroupContent">
                    <div className="familyRow">
                        <div className="familyNameCol" style={{ flex: 2 }} />
                        <div className="familyCheckboxCol"><span className="text">簽到</span></div>
                        <div className="familyCheckboxCol"><span className="text">分組</span></div>
                        <div className="familyCheckboxCol"><span className="text">用餐</span></div>
                    </div>
                    {subgroup.members.map((member, mIdx) => {
                        const originalMemberIdx = member._memberIdx ?? mIdx;
                        return (
                        <div key={member.name} className="familyRow familyRowBackgound">
                            <div className="familyNameCol">
                                <div className="text">
                                    {member.name}
                                </div>
                            </div>
                            <div className="familyCheckboxCol">
                                <input type="checkbox" className="checkbox" checked={member.arriveState}
                                    onChange={() => onCheckboxChange(sectionIdx, sgIndex, originalMemberIdx, 'arriveState')} />
                            </div>
                            <div className="familyCheckboxCol">
                                <input type="checkbox" className="checkbox" checked={member.groupState}
                                    disabled={disableGrouping}
                                    onChange={() => onCheckboxChange(sectionIdx, sgIndex, originalMemberIdx, 'groupState')} />
                            </div>
                            <div className="familyCheckboxCol">
                                <input type="checkbox" className="checkbox" checked={member.mealState}
                                    onChange={() => onCheckboxChange(sectionIdx, sgIndex, originalMemberIdx, 'mealState')} />
                            </div>
                        </div>
                    );
                    })}
                </div>
            )}
        </div>
    );
}

export default SubgroupBlock;
