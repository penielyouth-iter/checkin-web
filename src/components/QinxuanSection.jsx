import React from 'react';
import SubgroupBlock from './SubgroupBlock';

function QinxuanSection({ qinxuan, isExpanded, onToggle, subgroupsExpanded, onSubgroupToggle, onCheckboxChange }) {
    const totalMembers = qinxuan.subgroups.reduce((sum, sg) => sum + sg.members.length, 0);
    const arrivedMembers = qinxuan.subgroups.reduce(
        (sum, sg) => sum + sg.members.filter(m => m.arriveState).length, 0
    );

    return (
        <div className="block" style={{ padding: 0 }}>
            <div
                className="sectionHeaderCollapsible"
                onClick={onToggle}
                style={{ cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="collapseIcon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="title">青宣小組</span>
                </div>
                <span className="sectionCount">{arrivedMembers}/{totalMembers}</span>
            </div>

            {isExpanded && (
                <div style={{ padding: '0 20px 16px 20px' }}>
                    {qinxuan.subgroups.map((sg, sgIdx) => (
                        <SubgroupBlock
                            key={sg.id}
                            subgroup={sg}
                            sgIndex={sgIdx}
                            isExpanded={subgroupsExpanded[sg.id] !== false}
                            onToggle={() => onSubgroupToggle(sg.id)}
                            onCheckboxChange={onCheckboxChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default QinxuanSection;
