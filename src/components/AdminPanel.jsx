import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { genId, stripRuntimeStates } from '../utils/structureUtils';
import { set } from 'firebase/database';
import { structureDbRef } from '../services/firebase';
import '../styles/AdminStyles.css';

// ── Build move-to destinations from all subgroups ─────────────────────────────
function buildDestinations(structure) {
    const dests = [];
    for (const section of structure.sections) {
        for (const sg of section.subgroups) {
            dests.push({ key: sg.id, label: `${section.title} ▸ ${sg.title}` });
        }
    }
    return dests;
}

// ── Editable list (worship types / speakers) ──────────────────────────────────
function ListEditor({ title, items, onUpdate }) {
    const [input, setInput] = useState('');

    const handleAdd = () => {
        if (!input.trim()) return;
        onUpdate([...items, input.trim()]);
        setInput('');
    };

    return (
        <div style={{ flex: 1, minWidth: 180 }}>
            <div className="adminSubgroupTitle" style={{ marginBottom: 8 }}>{title}</div>
            {items.map((item, idx) => (
                <div key={idx} className="adminMemberRow">
                    <input
                        className="adminInput"
                        value={item}
                        onChange={e => onUpdate(items.map((current, i) => i === idx ? e.target.value : current))}
                        onBlur={e => onUpdate(items.map((current, i) => i === idx ? e.target.value.trim() : current))}
                    />
                    <button className="adminIconBtn" onClick={() => onUpdate(items.filter((_, i) => i !== idx))}>🗑️</button>
                </div>
            ))}
            <div className="adminInlineForm" style={{ marginTop: 6 }}>
                <input
                    className="adminInput"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="新增選項"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <button className="adminBtn adminBtnSave" onClick={handleAdd}>+</button>
            </div>
        </div>
    );
}

// ── Move-to dropdown ──────────────────────────────────────────────────────────
function MoveSelect({ destinations, currentKey, onMoveTo }) {
    const options = destinations.filter(d => d.key !== currentKey);
    return (
        <select
            className="adminMoveSelect"
            value=""
            onChange={e => { if (e.target.value) onMoveTo(e.target.value); }}
            title="移動到其他小家"
        >
            <option value="">↪ 移至</option>
            {options.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
            ))}
        </select>
    );
}

// ── Drag handle wrapper ───────────────────────────────────────────────────────
function SortableRow({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.45 : 1,
                display: 'flex',
                alignItems: 'flex-start',
                background: isDragging ? '#f0f4ff' : 'transparent',
            }}
        >
            <span {...attributes} {...listeners} className="dragHandle" title="拖曳排序">⠿</span>
            <div style={{ flex: 1 }}>{children}</div>
        </div>
    );
}

// ── Inline member editor ──────────────────────────────────────────────────────
function MemberEditor({ member, onSave, onCancel }) {
    const [name, setName] = useState(member.name);
    const [gender, setGender] = useState(member.gender);
    const [leader, setLeader] = useState(member.leader);

    return (
        <div className="adminInlineForm">
            <input className="adminInput" value={name} onChange={e => setName(e.target.value)} placeholder="姓名" />
            <select className="adminSelect" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="M">弟兄</option>
                <option value="F">姊妹</option>
            </select>
            <select className="adminSelect" value={leader} onChange={e => setLeader(Number(e.target.value))}>
                <option value={0}>一般</option>
                <option value={1}>領袖</option>
            </select>
            <button className="adminBtn adminBtnSave" onClick={() => onSave({ name: name.trim(), gender, leader })}>儲存</button>
            <button className="adminBtn adminBtnCancel" onClick={onCancel}>取消</button>
        </div>
    );
}

// ── Add member form ───────────────────────────────────────────────────────────
function AddMemberForm({ onAdd }) {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('F');
    const [leader, setLeader] = useState(0);

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd({ name: name.trim(), gender, leader });
        setName(''); setGender('F'); setLeader(0);
    };

    return (
        <div className="adminInlineForm" style={{ marginTop: 6 }}>
            <input className="adminInput" value={name} onChange={e => setName(e.target.value)} placeholder="新成員姓名" />
            <select className="adminSelect" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="M">弟兄</option>
                <option value="F">姊妹</option>
            </select>
            <select className="adminSelect" value={leader} onChange={e => setLeader(Number(e.target.value))}>
                <option value={0}>一般</option>
                <option value={1}>領袖</option>
            </select>
            <button className="adminBtn adminBtnSave" onClick={handleAdd}>+ 新增</button>
        </div>
    );
}

// ── Sortable member list ──────────────────────────────────────────────────────
function MemberList({ members, subgroupId, destinations, onReorder, onEdit, onDelete, onMoveTo }) {
    const [editingIdx, setEditingIdx] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
    const itemIds = members.map((_, i) => String(i));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        onReorder(arrayMove(members, Number(active.id), Number(over.id)));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {members.map((member, idx) => (
                    <SortableRow key={idx} id={String(idx)}>
                        {editingIdx === idx ? (
                            <MemberEditor
                                member={member}
                                onSave={data => { onEdit(idx, data); setEditingIdx(null); }}
                                onCancel={() => setEditingIdx(null)}
                            />
                        ) : (
                            <div className="adminMemberRow">
                                <span className="adminMemberName">
                                    {member.name}
                                    <span className="adminMemberTag">{member.gender === 'M' ? '弟' : '妹'}</span>
                                    {member.leader === 1 && <span className="adminMemberTagLeader">領</span>}
                                </span>
                                <div className="adminRowActions">
                                    <MoveSelect
                                        destinations={destinations}
                                        currentKey={subgroupId}
                                        onMoveTo={destKey => onMoveTo(idx, destKey)}
                                    />
                                    <button className="adminIconBtn" onClick={() => setEditingIdx(idx)}>✏️</button>
                                    <button className="adminIconBtn" onClick={() => {
                                        if (window.confirm(`確定刪除「${member.name}」？`)) onDelete(idx);
                                    }}>🗑️</button>
                                </div>
                            </div>
                        )}
                    </SortableRow>
                ))}
            </SortableContext>
        </DndContext>
    );
}

// ── Subgroup editor ───────────────────────────────────────────────────────────
function SubgroupEditor({ subgroup, destinations, onUpdate, onDelete, onMoveMember }) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(subgroup.title);
    const [expanded, setExpanded] = useState(true);

    const updateMembers = members => onUpdate({ ...subgroup, members });

    return (
        <div className="adminSubgroup">
            <div className="adminSubgroupHeader">
                <button className="adminCollapseBtn" onClick={() => setExpanded(e => !e)}>
                    {expanded ? '▼' : '▶'}
                </button>
                {editingTitle ? (
                    <>
                        <input
                            className="adminInput"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            style={{ width: 140 }}
                        />
                        <button className="adminBtn adminBtnSave" onClick={() => {
                            onUpdate({ ...subgroup, title: titleInput.trim() });
                            setEditingTitle(false);
                        }}>OK</button>
                        <button className="adminBtn adminBtnCancel" onClick={() => setEditingTitle(false)}>✕</button>
                    </>
                ) : (
                    <span className="adminSubgroupTitle">{subgroup.title}</span>
                )}
                <div className="adminRowActions" style={{ marginLeft: 'auto' }}>
                    {!editingTitle && (
                        <button className="adminIconBtn" onClick={() => setEditingTitle(true)}>✏️</button>
                    )}
                    <button className="adminIconBtn" onClick={() => {
                        if (window.confirm(`確定刪除「${subgroup.title}」小家？`)) onDelete();
                    }}>🗑️</button>
                </div>
            </div>

            {expanded && (
                <div className="adminSubgroupBody">
                    <MemberList
                        members={subgroup.members}
                        subgroupId={subgroup.id}
                        destinations={destinations}
                        onReorder={updateMembers}
                        onEdit={(idx, data) => {
                            const next = [...subgroup.members];
                            next[idx] = { ...next[idx], ...data };
                            updateMembers(next);
                        }}
                        onDelete={idx => updateMembers(subgroup.members.filter((_, i) => i !== idx))}
                        onMoveTo={(memberIdx, destKey) => onMoveMember(subgroup.id, memberIdx, destKey)}
                    />
                    <AddMemberForm onAdd={m => updateMembers([...subgroup.members, m])} />
                </div>
            )}
        </div>
    );
}

// ── Sortable subgroup list ────────────────────────────────────────────────────
function SubgroupList({ subgroups, destinations, onReorder, onUpdateSubgroup, onDeleteSubgroup, onMoveMember }) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = subgroups.findIndex(sg => sg.id === active.id);
        const newIdx = subgroups.findIndex(sg => sg.id === over.id);
        onReorder(arrayMove(subgroups, oldIdx, newIdx));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={subgroups.map(sg => sg.id)} strategy={verticalListSortingStrategy}>
                {subgroups.map((sg, idx) => (
                    <SortableRow key={sg.id} id={sg.id}>
                        <SubgroupEditor
                            subgroup={sg}
                            destinations={destinations}
                            onUpdate={updated => onUpdateSubgroup(idx, updated)}
                            onDelete={() => onDeleteSubgroup(idx)}
                            onMoveMember={onMoveMember}
                        />
                    </SortableRow>
                ))}
            </SortableContext>
        </DndContext>
    );
}

// ── Section editor ────────────────────────────────────────────────────────────
function SectionEditor({ section, destinations, onUpdate, onDelete, onMoveMember }) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(section.title);
    const [expanded, setExpanded] = useState(true);

    const updateSubgroups = subgroups => onUpdate({ ...section, subgroups });

    const addSubgroup = () => {
        const title = prompt('新小家名稱：');
        if (!title || !title.trim()) return;
        updateSubgroups([...section.subgroups, { id: genId(), title: title.trim(), members: [] }]);
    };

    return (
        <div className="adminSection">
            <div className="adminSectionHeader">
                <button className="adminCollapseBtn" onClick={() => setExpanded(e => !e)}>
                    {expanded ? '▼' : '▶'}
                </button>
                {editingTitle ? (
                    <>
                        <input
                            className="adminInput"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            style={{ width: 140 }}
                        />
                        <button className="adminBtn adminBtnSave" onClick={() => {
                            onUpdate({ ...section, title: titleInput.trim() });
                            setEditingTitle(false);
                        }}>OK</button>
                        <button className="adminBtn adminBtnCancel" onClick={() => setEditingTitle(false)}>✕</button>
                    </>
                ) : (
                    <span className="adminSectionTitle">{section.title}</span>
                )}
                <div className="adminRowActions" style={{ marginLeft: 'auto' }}>
                    {!editingTitle && (
                        <button className="adminIconBtn" onClick={() => setEditingTitle(true)}>✏️</button>
                    )}
                    <button className="adminIconBtn" onClick={() => {
                        if (window.confirm(`確定刪除整個「${section.title}」小組？所有小家和成員都會一起刪除。`)) onDelete();
                    }}>🗑️</button>
                </div>
            </div>

            {expanded && (
                <div style={{ paddingLeft: 8 }}>
                    <SubgroupList
                        subgroups={section.subgroups}
                        destinations={destinations}
                        onReorder={updateSubgroups}
                        onUpdateSubgroup={(idx, updated) => {
                            const next = [...section.subgroups];
                            next[idx] = updated;
                            updateSubgroups(next);
                        }}
                        onDeleteSubgroup={idx => updateSubgroups(section.subgroups.filter((_, i) => i !== idx))}
                        onMoveMember={onMoveMember}
                    />
                    <button className="adminBtn adminBtnAdd" style={{ marginTop: 8, marginBottom: 4 }} onClick={addSubgroup}>
                        + 新增小家
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Sortable section list ─────────────────────────────────────────────────────
function SectionList({ sections, destinations, onReorder, onUpdateSection, onDeleteSection, onMoveMember }) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = sections.findIndex(s => s.id === active.id);
        const newIdx = sections.findIndex(s => s.id === over.id);
        onReorder(arrayMove(sections, oldIdx, newIdx));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((section, idx) => (
                    <SortableRow key={section.id} id={section.id}>
                        <SectionEditor
                            section={section}
                            destinations={destinations}
                            onUpdate={updated => onUpdateSection(idx, updated)}
                            onDelete={() => onDeleteSection(idx)}
                            onMoveMember={onMoveMember}
                        />
                    </SortableRow>
                ))}
            </SortableContext>
        </DndContext>
    );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
function AdminPanel({ structure, onStructureChange, onExit }) {
    const [saving, setSaving] = useState(false);

    const destinations = buildDestinations(structure);

    // Move member from one subgroup to another (by subgroup ID)
    const handleMoveMember = (sourceSubgroupId, memberIdx, destSubgroupId) => {
        let member = null;

        const afterRemove = {
            ...structure,
            sections: structure.sections.map(section => ({
                ...section,
                subgroups: section.subgroups.map(sg => {
                    if (sg.id !== sourceSubgroupId) return sg;
                    const m = sg.members[memberIdx];
                    const { arriveState, groupState, mealState, _attendanceCount, _lastAttendanceDate, _sourceSectionId, _sourceSubgroupId, _generated, isChild, ...cleanMember } = m;
                    member = cleanMember;
                    return { ...sg, members: sg.members.filter((_, i) => i !== memberIdx) };
                }),
            })),
        };

        if (!member) return;

        const afterAdd = {
            ...afterRemove,
            sections: afterRemove.sections.map(section => ({
                ...section,
                subgroups: section.subgroups.map(sg => {
                    if (sg.id !== destSubgroupId) return sg;
                    return { ...sg, members: [...sg.members, member] };
                }),
            })),
        };

        onStructureChange(afterAdd);
    };

    const updateSections = sections => onStructureChange({ ...structure, sections });

    const addSection = () => {
        const title = prompt('新小組名稱：');
        if (!title || !title.trim()) return;
        updateSections([...structure.sections, { id: genId(), title: title.trim(), subgroups: [] }]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await set(structureDbRef, stripRuntimeStates(structure));
            alert('已儲存到雲端 ✓');
        } catch (e) {
            alert('儲存失敗：' + e.message);
        }
        setSaving(false);
    };

    return (
        <div className="adminOverlay">
            <div className="adminPanel">
                <div className="adminPanelHeader">
                    <span className="adminPanelTitle">🔧 管理員模式</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="adminBtn adminBtnSave" onClick={handleSave} disabled={saving}>
                            {saving ? '儲存中…' : '☁️ 儲存到雲端'}
                        </button>
                        <button className="adminBtn adminBtnCancel" onClick={onExit}>退出管理員</button>
                    </div>
                </div>

                <div className="adminPanelBody">
                    {/* ── Settings ── */}
                    <div className="adminSection">
                        <div className="adminSectionHeader">
                            <span className="adminSectionTitle">⚙️ 聚會設定</span>
                        </div>
                        <div style={{ padding: '12px 14px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <ListEditor
                                title="聚會形式"
                                items={structure.worshipTypes || []}
                                onUpdate={worshipTypes => onStructureChange({ ...structure, worshipTypes })}
                            />
                            <ListEditor
                                title="講員"
                                items={structure.speakers || []}
                                onUpdate={speakers => onStructureChange({ ...structure, speakers })}
                            />
                        </div>
                    </div>

                    <SectionList
                        sections={structure.sections}
                        destinations={destinations}
                        onReorder={updateSections}
                        onUpdateSection={(idx, updated) => {
                            const next = [...structure.sections];
                            next[idx] = updated;
                            updateSections(next);
                        }}
                        onDeleteSection={idx => updateSections(structure.sections.filter((_, i) => i !== idx))}
                        onMoveMember={handleMoveMember}
                    />
                    <button className="adminBtn adminBtnAdd" style={{ marginTop: 10 }} onClick={addSection}>
                        + 新增小組
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
