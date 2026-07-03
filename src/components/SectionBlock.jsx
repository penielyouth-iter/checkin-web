import React from 'react';
import SubgroupBlock from './SubgroupBlock';

function SectionBlock({ section, sectionIdx, isExpanded, forceExpand = false, onToggle, subgroupsExpanded, onSubgroupToggle, onCheckboxChange, onAddMember }) {
    const totalMembers = section.subgroups.reduce((sum, sg) => sum + sg.members.length, 0);
    const arrivedMembers = section.subgroups.reduce(
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
                    <span className="title">{section.title}</span>
                </div>
                <span className="sectionCount">{arrivedMembers}/{totalMembers}</span>
            </div>

            {isExpanded && (
                <div style={{ padding: '0 20px 16px 20px' }}>
                    {section.subgroups.map((sg, sgIdx) => {
                        const originalSgIdx = sg._subgroupIdx ?? sgIdx;
                        return (
                            <SubgroupBlock
                                key={sg.id}
                                subgroup={sg}
                                sectionIdx={sectionIdx}
                                sgIndex={originalSgIdx}
                                isExpanded={forceExpand || subgroupsExpanded[sg.id] === true}
                                onToggle={() => onSubgroupToggle(sg.id)}
                                onCheckboxChange={onCheckboxChange}
                                onAddMember={member => onAddMember(originalSgIdx, member)}
                                allowQuickAdd={sg.allowQuickAdd !== false}
                                disableGrouping={sg.id === 'sg_children' || sg.title === '兒童'}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SectionBlock;
