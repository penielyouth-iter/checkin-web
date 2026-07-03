import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Banner from '../components/Banner';
import CounselorBlock from '../components/CounselorBlock';
import QinxuanSection from '../components/QinxuanSection';
import NonQinxuanSection from '../components/NonQinxuanSection';
import AdminPanel from '../components/AdminPanel';

import { get } from 'firebase/database';
import { structureDbRef, recordDbRef } from '../services/firebase';
import { addRuntimeStates, structureToFamilies } from '../utils/structureUtils';
import { sortByAttendance } from '../utils/attendanceUtils';
import { JSONS } from '../constants/AssetPaths';
import startGrouping from '../services/grouping';
import uploadWeeklyRecord from '../services/record';
import '../styles/AllStyles.css';
import '../styles/AdminStyles.css';

const WORSHIP_TYPES = ['青年崇拜', '團契美好時光'];
const SPEAKERS = ['洪英正 教授', '錢玉芬 教授', '劉信優 牧師', '董倫賢 牧師', '楊雅莉 牧師', '蔡孟佳 牧師'];

const today = new Date();
const formatDate = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

function MainPage() {
    // ── Data ──────────────────────────────────────────────────────────────────
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // Fetch structure and records in parallel to reduce load time
            const [snapStructure, snapRecords] = await Promise.allSettled([
                get(structureDbRef),
                get(recordDbRef),
            ]);

            const raw = snapStructure.status === 'fulfilled' && snapStructure.value.exists()
                ? snapStructure.value.val()
                : JSONS.STRUCTURE_DEFAULT;

            const records = snapRecords.status === 'fulfilled' && snapRecords.value.exists()
                ? snapRecords.value.val()
                : [];

            const withStates = addRuntimeStates(raw);
            withStates.nonQinxuan.brothers = sortByAttendance(withStates.nonQinxuan.brothers, records);
            withStates.nonQinxuan.sisters = sortByAttendance(withStates.nonQinxuan.sisters, records);
            setStructure(withStates);
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

    // ── Collapse state ────────────────────────────────────────────────────────
    const [qinxuanExpanded, setQinxuanExpanded] = useState(true);
    const [subgroupsExpanded, setSubgroupsExpanded] = useState({});

    const toggleSubgroup = useCallback(id => {
        setSubgroupsExpanded(prev => ({ ...prev, [id]: prev[id] === false }));
    }, []);

    // ── Checkbox changes ──────────────────────────────────────────────────────
    const handleCheckboxChange = useCallback((section, ...args) => {
        setStructure(prev => {
            const next = { ...prev };
            if (section === 'counselors') {
                const [idx, key] = args;
                const arr = [...prev.counselors];
                arr[idx] = { ...arr[idx], [key]: !arr[idx][key] };
                return { ...next, counselors: arr };
            }
            if (section === 'qinxuan') {
                const [sgIdx, mIdx, key] = args;
                const sgs = prev.qinxuan.subgroups.map((sg, i) => {
                    if (i !== sgIdx) return sg;
                    const members = sg.members.map((m, j) =>
                        j === mIdx ? { ...m, [key]: !m[key] } : m
                    );
                    return { ...sg, members };
                });
                return { ...next, qinxuan: { subgroups: sgs } };
            }
            if (section === 'nonQinxuan') {
                const [gender, mIdx, key] = args;
                const arr = prev.nonQinxuan[gender].map((m, i) =>
                    i === mIdx ? { ...m, [key]: !m[key] } : m
                );
                return { ...next, nonQinxuan: { ...prev.nonQinxuan, [gender]: arr } };
            }
            return prev;
        });
    }, []);

    // ── Grouping ──────────────────────────────────────────────────────────────
    const [groupsize, setGroupsize] = useState('4');
    const [remainder, setRemainder] = useState(0);
    const remainderTypes = [
        { label: '允許多人', value: 0 },
        { label: '允許少人', value: 1 },
    ];

    const handleStartGrouping = () => {
        const result = startGrouping({
            families: structureToFamilies(structure),
            groupsize,
            remainder,
        });
        sessionStorage.setItem('groupResult', JSON.stringify(result));
        const base = window.location.href.replace(/\/$/, '');
        window.open(`${base}/#group`, '_blank');
    };

    const handleGoToRecord = () => {
        const base = window.location.href.replace(/\/$/, '');
        window.open(`${base}/#record`, '_blank');
    };

    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        setUploading(true);
        try {
            const worship = worshipIdx < WORSHIP_TYPES.length ? WORSHIP_TYPES[worshipIdx] : worshipOther;
            const speaker = speakerIdx < SPEAKERS.length ? SPEAKERS[speakerIdx] : speakerOther;
            await uploadWeeklyRecord({
                date: selectedDate,
                worship,
                speaker,
                families: structureToFamilies(structure),
            });
            alert('上傳完成 ✓');
        } catch (e) {
            alert('上傳失敗，請檢查網路連線。');
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

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
    if (loading) {
        return (
            <div className="container" style={{ paddingTop: 60, textAlign: 'center', color: '#888' }}>
                載入中…
            </div>
        );
    }

    return (
        <div className="container">
            <Banner />

            {/* ── Info Section ── */}
            <div className="block" style={{ textAlign: 'left' }}>
                {/* Date */}
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

                {/* Worship type */}
                <div className="title">聚會形式 ⛪️</div>
                <div className="subView">
                    {WORSHIP_TYPES.map((t, i) => (
                        <label key={i} className="radioButton">
                            <input type="radio" name="worship" checked={worshipIdx === i}
                                onChange={() => setWorshipIdx(i)} style={{ marginRight: 8 }} />
                            <span>{t}</span>
                        </label>
                    ))}
                    <label className="radioButton">
                        <input type="radio" name="worship" checked={worshipIdx === WORSHIP_TYPES.length}
                            onChange={() => setWorshipIdx(WORSHIP_TYPES.length)} style={{ marginRight: 8 }} />
                        <span>其他：</span>
                        <input type="text" value={worshipOther}
                            onChange={e => setWorshipOther(e.target.value)} className="textInput" />
                    </label>
                </div>

                {/* Speaker */}
                <div className="title">講員 🎤</div>
                <div className="subView">
                    {SPEAKERS.map((s, i) => (
                        <label key={i} className="radioButton">
                            <input type="radio" name="speaker" checked={speakerIdx === i}
                                onChange={() => setSpeakerIdx(i)} style={{ marginRight: 8 }} />
                            <span>{s}</span>
                        </label>
                    ))}
                    <label className="radioButton">
                        <input type="radio" name="speaker" checked={speakerIdx === SPEAKERS.length}
                            onChange={() => setSpeakerIdx(SPEAKERS.length)} style={{ marginRight: 8 }} />
                        <span>其他：</span>
                        <input type="text" value={speakerOther}
                            onChange={e => setSpeakerOther(e.target.value)} className="textInput" />
                    </label>
                </div>
            </div>

            {/* ── Counselor Block ── */}
            <CounselorBlock
                counselors={structure.counselors}
                onCheckboxChange={handleCheckboxChange}
            />

            {/* ── Qinxuan Section ── */}
            <QinxuanSection
                qinxuan={structure.qinxuan}
                isExpanded={qinxuanExpanded}
                onToggle={() => setQinxuanExpanded(e => !e)}
                subgroupsExpanded={subgroupsExpanded}
                onSubgroupToggle={toggleSubgroup}
                onCheckboxChange={handleCheckboxChange}
            />

            {/* ── NonQinxuan Section ── */}
            <NonQinxuanSection
                nonQinxuan={structure.nonQinxuan}
                onCheckboxChange={handleCheckboxChange}
            />

            {/* ── Grouping + Upload Section ── */}
            <div className="block" style={{ textAlign: 'left' }}>
                <div className="title">每組人數</div>
                <div className="formHoriView">
                    <input
                        type="number"
                        className="input"
                        style={{ marginRight: 8, textAlign: 'center', fontSize: 16 }}
                        value={groupsize}
                        onChange={e => setGroupsize(e.target.value)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {remainderTypes.map(t => (
                            <button
                                key={t.value}
                                className="radioBox"
                                onClick={() => setRemainder(t.value)}
                                style={{
                                    borderColor: remainder === t.value ? '#f05c38' : '#bfbfbf',
                                    backgroundColor: remainder === t.value ? '#f05c38' : '',
                                    color: remainder === t.value ? '#fff' : '#bfbfbf',
                                }}
                            >
                                <span className="buttonText" style={{ color: remainder === t.value ? '#fff' : '#bfbfbf', fontSize: 12 }}>
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <button className="button" onClick={handleStartGrouping}>
                        <span className="buttonText">分組！</span>
                    </button>
                </div>

                <div className="title" style={{ marginTop: 12 }}>簽到結果</div>
                <div className="formHoriView">
                    <button className="button" onClick={handleUpload} disabled={uploading}>
                        <span className="buttonText">{uploading ? '上傳中…' : '上傳'}</span>
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
