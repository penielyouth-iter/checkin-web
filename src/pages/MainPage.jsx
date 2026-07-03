import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Banner from '../components/Banner.jsx';
import SectionBlock from '../components/SectionBlock.jsx';
import AdminPanel from '../components/AdminPanel.jsx';

import { get } from 'firebase/database';
import { recordDbRef, structureDbRef } from '../services/firebase';
import { addRuntimeStates, applyAttendanceBuckets, structureToFamilies } from '../utils/structureUtils';
import { JSONS } from '../constants/AssetPaths';
import startGrouping from '../services/grouping';
import uploadWeeklyRecord from '../services/record';
import '../styles/AllStyles.css';
import '../styles/AdminStyles.css';

const today = new Date();
const formatDate = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const openHashRoute = route => {
    const base = `${window.location.origin}${window.location.pathname}`;
    window.open(`${base}#/${route.replace(/^\//, '')}`, '_blank');
};

const buildDisplaySections = (structure, searchTerm) => {
    const query = searchTerm.trim();
    const isSearching = query.length > 0;

    return structure.sections
        .map((section, sectionIdx) => ({
            ...section,
            _sectionIdx: sectionIdx,
            subgroups: section.subgroups
                .map((sg, sgIdx) => ({
                    ...sg,
                    _subgroupIdx: sgIdx,
                    members: sg.members
                        .map((member, memberIdx) => ({ ...member, _memberIdx: memberIdx }))
                        .filter(member => !isSearching || member.name.includes(query)),
                }))
                .filter(sg => !isSearching || sg.members.length > 0),
        }))
        .filter(section => !isSearching || section.subgroups.length > 0);
};

const buildLoadedStateByName = loadedRecord => {
    const byName = new Map();
    for (const family of loadedRecord?.families || []) {
        for (const member of family.members || []) {
            if (!member.name) continue;
            byName.set(member.name, {
                arriveState: !!member.arriveState,
                groupState: !!member.groupState,
                mealState: !!member.mealState,
            });
        }
    }
    return byName;
};

const applyLoadedRecordStates = (structure, loadedRecord) => {
    const byName = buildLoadedStateByName(loadedRecord);
    if (byName.size === 0) return structure;

    return {
        ...structure,
        sections: structure.sections.map(section => ({
            ...section,
            subgroups: section.subgroups.map(sg => ({
                ...sg,
                members: sg.members.map(member => {
                    const loadedState = byName.get(member.name);
                    return loadedState ? { ...member, ...loadedState } : {
                        ...member,
                        arriveState: false,
                        groupState: false,
                        mealState: false,
                    };
                }),
            })),
        })),
    };
};

function MainPage() {
    // ── Data ──────────────────────────────────────────────────────────────────
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sections expanded by default; subgroups collapsed by default
    const [sectionsExpanded, setSectionsExpanded] = useState({});
    const [subgroupsExpanded, setSubgroupsExpanded] = useState({});

    useEffect(() => {
        const load = async () => {
            let raw;
            let records = [];
            try {
                const [structureSnap, recordSnap] = await Promise.all([
                    get(structureDbRef),
                    get(recordDbRef),
                ]);
                const val = structureSnap.exists() ? structureSnap.val() : null;
                raw = val && val.sections ? val : JSONS.STRUCTURE_DEFAULT;
                records = recordSnap.exists() && Array.isArray(recordSnap.val())
                    ? recordSnap.val()
                    : JSONS.RECORD_DEFAULT;
            } catch {
                raw = JSONS.STRUCTURE_DEFAULT;
                records = JSONS.RECORD_DEFAULT;
            }
            let withStates = applyAttendanceBuckets(addRuntimeStates(raw), records);
            const loadedRecordRaw = sessionStorage.getItem('loadedRecordData');
            if (loadedRecordRaw) {
                try {
                    const loadedRecord = JSON.parse(loadedRecordRaw);
                    withStates = applyLoadedRecordStates(withStates, loadedRecord);
                    if (loadedRecord.date) setSelectedDate(loadedRecord.date);
                    const worshipIdx = (withStates.worshipTypes || []).indexOf(loadedRecord.worship);
                    if (worshipIdx >= 0) {
                        setWorshipIdx(worshipIdx);
                        setWorshipOther('');
                    } else if (loadedRecord.worship) {
                        setWorshipIdx((withStates.worshipTypes || []).length);
                        setWorshipOther(loadedRecord.worship);
                    }
                    const speakerIdx = (withStates.speakers || []).indexOf(loadedRecord.speaker);
                    if (speakerIdx >= 0) {
                        setSpeakerIdx(speakerIdx);
                        setSpeakerOther('');
                    } else if (loadedRecord.speaker) {
                        setSpeakerIdx((withStates.speakers || []).length);
                        setSpeakerOther(loadedRecord.speaker);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    sessionStorage.removeItem('loadedRecordData');
                }
            }
            setStructure(withStates);

            // All subgroups start collapsed
            const collapsed = {};
            for (const section of withStates.sections) {
                for (const sg of section.subgroups) {
                    collapsed[sg.id] = false;
                }
            }
            setSubgroupsExpanded(collapsed);
            setLoading(false);
        };
        load();
    }, []);

    // ── Info section ──────────────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState(formatDate(today));
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [worshipIdx, setWorshipIdx] = useState(0);
    const [worshipOther, setWorshipOther] = useState('');
    const [speakerIdx, setSpeakerIdx] = useState(0);
    const [speakerOther, setSpeakerOther] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // ── Collapse toggles ──────────────────────────────────────────────────────
    const toggleSection = useCallback(id => {
        setSectionsExpanded(prev => ({ ...prev, [id]: prev[id] === false }));
    }, []);

    const toggleSubgroup = useCallback(id => {
        setSubgroupsExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // ── Checkbox changes ──────────────────────────────────────────────────────
    const handleCheckboxChange = useCallback((sectionIdx, sgIdx, mIdx, key) => {
        setStructure(prev => ({
            ...prev,
            sections: prev.sections.map((section, si) => {
                if (si !== sectionIdx) return section;
                return {
                    ...section,
                    subgroups: section.subgroups.map((sg, gi) => {
                        if (gi !== sgIdx) return sg;
                        return {
                            ...sg,
                            members: sg.members.map((m, mi) =>
                                mi === mIdx ? { ...m, [key]: !m[key] } : m
                            ),
                        };
                    }),
                };
            }),
        }));
    }, []);

    // ── Quick-add member (no admin required) ──────────────────────────────────
    const handleAddMember = useCallback((sectionIdx, sgIdx, member) => {
        setStructure(prev => ({
            ...prev,
            sections: prev.sections.map((section, si) => {
                if (si !== sectionIdx) return section;
                return {
                    ...section,
                    subgroups: section.subgroups.map((sg, gi) => {
                        if (gi !== sgIdx) return sg;
                        return {
                            ...sg,
                            members: [...sg.members, {
                                ...member,
                                arriveState: false,
                                groupState: false,
                                mealState: false,
                            }],
                        };
                    }),
                };
            }),
        }));
    }, []);

    // ── Grouping ──────────────────────────────────────────────────────────────
    const [groupingRange, setGroupingRange] = useState('4-5');
    const groupingRangeOptions = [
        { label: '3～4人', value: '3-4', groupsize: '4', remainder: 1 },
        { label: '4～5人', value: '4-5', groupsize: '4', remainder: 0 },
    ];

    const uploadCurrentRecord = async () => {
        const worshipTypes = structure.worshipTypes;
        const speakers = structure.speakers;
        const worship = worshipIdx < worshipTypes.length ? worshipTypes[worshipIdx] : worshipOther;
        const speaker = speakerIdx < speakers.length ? speakers[speakerIdx] : speakerOther;
        await uploadWeeklyRecord({
            date: selectedDate,
            worship,
            speaker,
            families: structureToFamilies(structure),
        });
    };

    const handleStartGrouping = async () => {
        setUploading(true);
        try {
            await uploadCurrentRecord();
            const selectedRange = groupingRangeOptions.find(option => option.value === groupingRange) || groupingRangeOptions[0];
            const result = startGrouping({
                families: structureToFamilies(structure),
                groupsize: selectedRange.groupsize,
                remainder: selectedRange.remainder,
            });
            sessionStorage.setItem('groupResult', JSON.stringify(result));
            openHashRoute('group');
        } catch (e) {
            alert('上傳失敗，未進行分組。請檢查網路連線。');
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const handleGoToRecord = () => {
        openHashRoute('record');
    };

    const [uploading, setUploading] = useState(false);

    // ── Admin ─────────────────────────────────────────────────────────────────
    const [adminMode, setAdminMode] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    const handlePasswordKeyDown = e => {
        if (e.key === 'Enter') {
            if (passwordInput === 'admin123') {
                setAdminMode(true);
                setPasswordInput('');
            } else {
                alert('密碼錯誤');
                setPasswordInput('');
            }
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading || !structure) {
        return (
            <div className="container" style={{ paddingTop: 60, textAlign: 'center', color: '#888' }}>
                載入中…
            </div>
        );
    }

    const worshipTypes = structure.worshipTypes;
    const speakers = structure.speakers;
    const isSearching = searchTerm.trim().length > 0;
    const displaySections = buildDisplaySections(structure, searchTerm);

    return (
        <div className="container">
            <Banner />

            {/* ── Info Section ── */}
            <div className="block" style={{ textAlign: 'left' }}>
                <div className="title">今天日期 📅</div>
                <div className="subView">
                    <button className="dateButton" onClick={() => setDatePickerOpen(true)}>
                        {selectedDate}
                    </button>
                    {datePickerOpen && (
                        <DatePicker
                            selected={new Date(selectedDate + 'T00:00:00')}
                            onChange={date => { setSelectedDate(formatDate(date)); setDatePickerOpen(false); }}
                            onClickOutside={() => setDatePickerOpen(false)}
                            inline
                        />
                    )}
                </div>

                <div className="title">聚會形式 ⛪️</div>
                <div className="subView">
                    {worshipTypes.map((t, i) => (
                        <label key={i} className="radioButton">
                            <input type="radio" name="worship" checked={worshipIdx === i}
                                onChange={() => setWorshipIdx(i)} style={{ marginRight: 8 }} />
                            <span>{t}</span>
                        </label>
                    ))}
                    <label className="radioButton">
                        <input type="radio" name="worship" checked={worshipIdx === worshipTypes.length}
                            onChange={() => setWorshipIdx(worshipTypes.length)} style={{ marginRight: 8 }} />
                        <span>其他：</span>
                        <input type="text" value={worshipOther}
                            onChange={e => setWorshipOther(e.target.value)} className="textInput" />
                    </label>
                </div>

                <div className="title">講員 🎤</div>
                <div className="subView">
                    {speakers.map((s, i) => (
                        <label key={i} className="radioButton">
                            <input type="radio" name="speaker" checked={speakerIdx === i}
                                onChange={() => setSpeakerIdx(i)} style={{ marginRight: 8 }} />
                            <span>{s}</span>
                        </label>
                    ))}
                    <label className="radioButton">
                        <input type="radio" name="speaker" checked={speakerIdx === speakers.length}
                            onChange={() => setSpeakerIdx(speakers.length)} style={{ marginRight: 8 }} />
                        <span>其他：</span>
                        <input type="text" value={speakerOther}
                            onChange={e => setSpeakerOther(e.target.value)} className="textInput" />
                    </label>
                </div>
            </div>

            <div className="block searchBlock">
                <input
                    className="searchInput"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="搜尋姓名"
                />
                {isSearching && (
                    <button className="searchClearBtn" onClick={() => setSearchTerm('')}>清除</button>
                )}
            </div>

            {/* ── All Sections ── */}
            {displaySections.map(section => (
                <SectionBlock
                    key={section.id}
                    section={section}
                    sectionIdx={section._sectionIdx}
                    isExpanded={isSearching || sectionsExpanded[section.id] !== false}
                    forceExpand={isSearching}
                    onToggle={() => toggleSection(section.id)}
                    subgroupsExpanded={subgroupsExpanded}
                    onSubgroupToggle={toggleSubgroup}
                    onCheckboxChange={handleCheckboxChange}
                    onAddMember={(sgIdx, member) => handleAddMember(section._sectionIdx, sgIdx, member)}
                />
            ))}

            {/* ── Grouping + Upload Section ── */}
            <div className="block" style={{ textAlign: 'left' }}>
                <div className="title">每組人數</div>
                <div className="formHoriView">
                    <select
                        className="groupRangeSelect"
                        value={groupingRange}
                        onChange={e => setGroupingRange(e.target.value)}
                    >
                        {groupingRangeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button className="button" onClick={handleStartGrouping} disabled={uploading}>
                        <span className="buttonText">{uploading ? '上傳中…' : '上傳&分組'}</span>
                    </button>
                    <button className="button" onClick={handleGoToRecord}>
                        <span className="buttonText">檢視紀錄</span>
                    </button>
                </div>
            </div>

            {/* ── Admin Password Input ── */}
            <div className="adminPasswordSection">
                <label htmlFor="adminPwd">🔒 管理員登入</label>
                <input
                    id="adminPwd"
                    type="password"
                    className="adminPasswordInput"
                    placeholder="輸入密碼後按 Enter"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    onKeyDown={handlePasswordKeyDown}
                />
            </div>

            {/* ── Admin Panel (overlay) ── */}
            {adminMode && (
                <AdminPanel
                    structure={structure}
                    onStructureChange={setStructure}
                    onExit={() => setAdminMode(false)}
                />
            )}
        </div>
    );
}

export default MainPage;
