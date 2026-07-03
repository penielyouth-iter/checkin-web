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

// ── Drag handle sortable wrapper ──────────────────────────────────────────────
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
                alignItems: 'center',
                background: isDragging ? '#f0f4ff' : 'transparent',
            }}
        >
            <span
                {...attributes}
                {...listeners}
                className="dragHandle"
                title="拖曳排序"
            >⠿</span>
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
            <input
                className="adminInput"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="姓名"
            />
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

// ── Member add form ───────────────────────────────────────────────────────────
function AddMemberForm({ onAdd }) {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('F');
    const [leader, setLeader] = useState(0);

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd({ name: name.trim(), gender, leader });
        setName('');
        setGender('F');
        setLeader(0);
    };

    return (
        <div className="adminInlineForm" style={{ marginTop: 6 }}>
            <input
                className="adminInput"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="新成員姓名"
            />
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

// ── Sortable member list inside a subgroup ────────────────────────────────────
function MemberList({ members, onReorder, onEdit, onDelete }) {
    const [editingIdx, setEditingIdx] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    // Use index-based IDs to handle members with the same name
    const itemIds = members.map((_, i) => String(i));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = Number(active.id);
        const newIdx = Number(over.id);
        onReorder(arrayMove(members, oldIdx, newIdx));
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

// ── Single subgroup editor ────────────────────────────────────────────────────
function SubgroupEditor({ subgroup, onUpdate, onDelete }) {
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
                        onReorder={members => updateMembers(members)}
                        onEdit={(idx, data) => {
                            const next = [...subgroup.members];
                            next[idx] = { ...next[idx], ...data };
                            updateMembers(next);
                        }}
                        onDelete={idx => {
                            const next = subgroup.members.filter((_, i) => i !== idx);
                            updateMembers(next);
                        }}
                    />
                    <AddMemberForm onAdd={m => updateMembers([...subgroup.members, m])} />
                </div>
            )}
        </div>
    );
}

// ── Sortable subgroup list ────────────────────────────────────────────────────
function SubgroupList({ subgroups, onReorder, onUpdateSubgroup, onDeleteSubgroup }) {
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
                            onUpdate={updated => onUpdateSubgroup(idx, updated)}
                            onDelete={() => onDeleteSubgroup(idx)}
                        />
                    </SortableRow>
                ))}
            </SortableContext>
        </DndContext>
    );
}

// ── Simple non-sortable member list (for 非青宣) ──────────────────────────────
function SimpleMemberList({ members, onAdd, onDelete, defaultGender }) {
    const [name, setName] = useState('');

    return (
        <div>
            {members.map((m, idx) => (
                <div key={m.name} className="adminMemberRow">
                    <span className="adminMemberName">{m.name}</span>
                    <button className="adminIconBtn" onClick={() => {
                        if (window.confirm(`確定刪除「${m.name}」？`)) onDelete(idx);
                    }}>🗑️</button>
                </div>
            ))}
            <div className="adminInlineForm" style={{ marginTop: 6 }}>
                <input
                    className="adminInput"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="新成員姓名"
                />
                <button className="adminBtn adminBtnSave" onClick={() => {
                    if (!name.trim()) return;
                    onAdd({ name: name.trim(), gender: defaultGender, leader: 0 });
                    setName('');
                }}>+ 新增</button>
            </div>
        </div>
    );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
function AdminPanel({ structure, onStructureChange, onExit }) {
    const [saving, setSaving] = useState(false);

    // Counselors
    const updateCounselorMember = (idx, data) => {
        const next = [...structure.counselors];
        next[idx] = { ...next[idx], ...data };
        onStructureChange({ ...structure, counselors: next });
    };
    const deleteCounselor = idx => {
        onStructureChange({ ...structure, counselors: structure.counselors.filter((_, i) => i !== idx) });
    };
    const addCounselor = m => {
        onStructureChange({ ...structure, counselors: [...structure.counselors, m] });
    };

    // Qinxuan subgroups
    const updateSubgroups = subgroups =>
        onStructureChange({ ...structure, qinxuan: { subgroups } });

    const addSubgroup = () => {
        const title = prompt('新小家名稱：');
        if (!title || !title.trim()) return;
        updateSubgroups([...structure.qinxuan.subgroups, { id: genId(), title: title.trim(), members: [] }]);
    };

    // NonQinxuan
    const updateNQ = (gender, members) =>
        onStructureChange({ ...structure, nonQinxuan: { ...structure.nonQinxuan, [gender]: members } });

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
                        <button
                            className="adminBtn adminBtnSave"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? '儲存中…' : '☁️ 儲存到雲端'}
                        </button>
                        <button className="adminBtn adminBtnCancel" onClick={onExit}>退出管理員</button>
                    </div>
                </div>

                <div className="adminPanelBody">
                    {/* ── Counselors ── */}
                    <div className="adminSection">
                        <div className="adminSectionTitle">輔導</div>
                        <MemberList
                            members={structure.counselors}
                            onReorder={members => onStructureChange({ ...structure, counselors: members })}
                            onEdit={updateCounselorMember}
                            onDelete={deleteCounselor}
                        />
                        <AddMemberForm onAdd={addCounselor} />
                    </div>

                    {/* ── Qinxuan ── */}
                    <div className="adminSection">
                        <div className="adminSectionTitle">青宣小組</div>
                        <SubgroupList
                            subgroups={structure.qinxuan.subgroups}
                            onReorder={updateSubgroups}
                            onUpdateSubgroup={(idx, updated) => {
                                const next = [...structure.qinxuan.subgroups];
                                next[idx] = updated;
                                updateSubgroups(next);
                            }}
                            onDeleteSubgroup={idx => {
                                updateSubgroups(structure.qinxuan.subgroups.filter((_, i) => i !== idx));
                            }}
                        />
                        <button className="adminBtn adminBtnAdd" style={{ marginTop: 10 }} onClick={addSubgroup}>
                            + 新增小家
                        </button>
                    </div>

                    {/* ── NonQinxuan ── */}
                    <div className="adminSection">
                        <div className="adminSectionTitle">非青宣小組</div>
                        <div className="adminSubgroup">
                            <div className="adminSubgroupHeader">
                                <span className="adminSubgroupTitle">弟兄</span>
                                <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>(依出席次數自動排序)</span>
                            </div>
                            <div className="adminSubgroupBody">
                                <SimpleMemberList
                                    members={structure.nonQinxuan.brothers}
                                    defaultGender="M"
                                    onAdd={m => updateNQ('brothers', [...structure.nonQinxuan.brothers, m])}
                                    onDelete={idx => updateNQ('brothers', structure.nonQinxuan.brothers.filter((_, i) => i !== idx))}
                                />
                            </div>
                        </div>
                        <div className="adminSubgroup" style={{ marginTop: 10 }}>
                            <div className="adminSubgroupHeader">
                                <span className="adminSubgroupTitle">姊妹</span>
                                <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>(依出席次數自動排序)</span>
                            </div>
                            <div className="adminSubgroupBody">
                                <SimpleMemberList
                                    members={structure.nonQinxuan.sisters}
                                    defaultGender="F"
                                    onAdd={m => updateNQ('sisters', [...structure.nonQinxuan.sisters, m])}
                                    onDelete={idx => updateNQ('sisters', structure.nonQinxuan.sisters.filter((_, i) => i !== idx))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
