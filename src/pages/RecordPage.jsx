import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, set } from 'firebase/database';
import { recordDbRef, structureDbRef } from "../services/firebase";
import { JSONS } from '../constants/AssetPaths';
import '../styles/RecordPage.css';

const RANGE_OPTIONS = [
    { label: '一季', months: 3 },
    { label: '半年', months: 6 },
    { label: '一年', months: 12 },
    { label: '全部', months: null },
];
const ADMIN_PASSWORD = 'admin123';

const getFieldValue = (record, key) =>
    (record.field || []).find(field => field.key === key)?.value;

const splitNames = value => {
    if (!value) return [];
    const names = Array.isArray(value) ? value : String(value).split('、');
    return names.map(name => String(name).trim()).filter(Boolean);
};

const toNumber = value => {
    const match = String(value ?? '').match(/\d+/);
    return match ? Number(match[0]) : 0;
};

const formatDisplayDate = date => date || '未標日期';

const formatRangeDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const buildChildNameSet = structure => {
    const names = new Set();
    for (const section of structure?.sections || []) {
        for (const subgroup of section.subgroups || []) {
            if (subgroup.id !== 'sg_children' && subgroup.title !== '兒童') continue;
            for (const member of subgroup.members || []) names.add(member.name);
        }
    }
    return names;
};

const normalizeRecord = (record, childNameSet) => {
    const adultNamesFromField = splitNames(getFieldValue(record, '出席名單'));
    const childNamesFromField = splitNames(getFieldValue(record, '兒童名單'));
    const inferredChildNames = adultNamesFromField.filter(name => childNameSet.has(name));
    const adultNames = adultNamesFromField.filter(name => !childNameSet.has(name));
    const childNames = childNamesFromField.length > 0 ? childNamesFromField : inferredChildNames;
    const explicitAdultCount = getFieldValue(record, '出席人數');
    const explicitChildCount = getFieldValue(record, '兒童人數');
    const adultCount = adultNames.length > 0 ? adultNames.length : toNumber(explicitAdultCount);
    const childCount = childNames.length > 0 ? childNames.length : toNumber(explicitChildCount);
    const mealNames = splitNames(getFieldValue(record, '用餐名單'));
    const mealCount = mealNames.length > 0 ? mealNames.length : toNumber(getFieldValue(record, '用餐人數'));

    return {
        ...record,
        worship: getFieldValue(record, '聚會內容') || '',
        speaker: getFieldValue(record, '講員') || '',
        adultNames,
        childNames,
        adultCount,
        childCount,
        totalCount: adultCount + childCount,
        mealNames,
        mealCount,
    };
};

const buildLoadPayload = record => {
    if (record.fullData) return record.fullData;

    const mealSet = new Set(record.mealNames);
    const members = [...record.adultNames, ...record.childNames].map(name => ({
        name,
        arriveState: true,
        groupState: false,
        mealState: mealSet.has(name),
    }));

    return {
        date: record.date,
        worship: record.worship,
        speaker: record.speaker,
        families: [{ title: '讀入紀錄', members }],
    };
};

const filterRecordsByRange = (records, months) => {
    if (!months) return records;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = formatRangeDate(cutoff);
    return records.filter(record => record.date >= cutoffStr);
};

const average = values => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

function AttendanceChart({ records }) {
    const chartRecords = [...records].reverse();
    const width = 640;
    const height = 220;
    const padding = { top: 20, right: 22, bottom: 38, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxCount = Math.max(10, ...chartRecords.map(record => record.totalCount));

    const pointsFor = key => chartRecords.map((record, idx) => {
        const x = padding.left + (chartRecords.length <= 1 ? chartWidth / 2 : (idx / (chartRecords.length - 1)) * chartWidth);
        const y = padding.top + chartHeight - (record[key] / maxCount) * chartHeight;
        return { x, y, record };
    });

    const pathFor = points => points.map((point, idx) =>
        `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    ).join(' ');

    const totalPoints = pointsFor('totalCount');
    const adultPoints = pointsFor('adultCount');
    const childPoints = pointsFor('childCount');
    const latest = chartRecords[chartRecords.length - 1];

    if (records.length === 0) {
        return <div className="recordEmpty">沒有符合區間的紀錄</div>;
    }

    return (
        <div className="chartShell">
            <svg className="attendanceChart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="出席人數折線圖">
                <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} className="chartAxis" />
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} className="chartAxis" />
                {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                    const y = padding.top + chartHeight - tick * chartHeight;
                    const value = Math.round(tick * maxCount);
                    return (
                        <g key={tick}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="chartGrid" />
                            <text x={padding.left - 8} y={y + 4} className="chartTick" textAnchor="end">{value}</text>
                        </g>
                    );
                })}
                <path d={pathFor(totalPoints)} className="chartLine chartLineTotal" />
                <path d={pathFor(adultPoints)} className="chartLine chartLineAdult" />
                <path d={pathFor(childPoints)} className="chartLine chartLineChild" />
                {totalPoints.map(point => (
                    <circle key={`${point.record.date}-total`} cx={point.x} cy={point.y} r="3.4" className="chartDot chartDotTotal" />
                ))}
                {chartRecords.length > 0 && (
                    <>
                        <text x={padding.left} y={height - 10} className="chartDate">{chartRecords[0].date}</text>
                        <text x={width - padding.right} y={height - 10} className="chartDate" textAnchor="end">{latest.date}</text>
                    </>
                )}
            </svg>
            <div className="chartLegend">
                <span><i className="legendTotal" />總出席</span>
                <span><i className="legendAdult" />大人</span>
                <span><i className="legendChild" />兒童</span>
            </div>
        </div>
    );
}

const RecordPage = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [childNameSet, setChildNameSet] = useState(new Set());
    const [expandedDate, setExpandedDate] = useState(null);
    const [rangeMonths, setRangeMonths] = useState(6);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeeklyData();
    }, []);

    const normalizeRecords = value => Array.isArray(value) ? value : JSONS.RECORD_DEFAULT;

    const fetchWeeklyData = async () => {
        setLoading(true);
        try {
            const [recordSnapshot, structureSnapshot] = await Promise.all([
                get(recordDbRef),
                get(structureDbRef),
            ]);
            const weeklyRecord = recordSnapshot.exists()
                ? normalizeRecords(recordSnapshot.val())
                : JSONS.RECORD_DEFAULT;
            setRecords(weeklyRecord);
            setChildNameSet(buildChildNameSet(structureSnapshot.exists() ? structureSnapshot.val() : JSONS.STRUCTURE_DEFAULT));
        } catch (error) {
            console.error(error);
            setRecords(JSONS.RECORD_DEFAULT);
            setChildNameSet(buildChildNameSet(JSONS.STRUCTURE_DEFAULT));
        } finally {
            setLoading(false);
        }
    };

    const normalizedRecords = useMemo(
        () => records.map(record => normalizeRecord(record, childNameSet)),
        [records, childNameSet]
    );
    const visibleRecords = useMemo(
        () => filterRecordsByRange(normalizedRecords, rangeMonths),
        [normalizedRecords, rangeMonths]
    );

    const latestRecord = normalizedRecords[0];
    const summary = {
        weeks: visibleRecords.length,
        averageTotal: average(visibleRecords.map(record => record.totalCount)),
        averageAdult: average(visibleRecords.map(record => record.adultCount)),
        averageChild: average(visibleRecords.map(record => record.childCount)),
    };

    const handleDelete = async record => {
        const password = window.prompt('請輸入管理員密碼');
        if (password === null) return;
        if (password !== ADMIN_PASSWORD) {
            alert('輸入密碼錯誤');
            return;
        }
        if (!window.confirm(`確定刪除 ${record.date} 的紀錄？`)) return;
        const nextRecords = records.filter(item => item.date !== record.date);
        setRecords(nextRecords);
        try {
            await set(recordDbRef, nextRecords);
            if (expandedDate === record.date) setExpandedDate(null);
        } catch (error) {
            console.error(error);
            alert('刪除失敗，請檢查網路連線。');
            setRecords(records);
        }
    };

    const handleLoadRecord = record => {
        if (!window.confirm(`讀入 ${record.date} 的紀錄並回到主畫面？目前主畫面的勾選狀態會被這筆紀錄覆蓋。`)) return;
        sessionStorage.setItem('loadedRecordData', JSON.stringify(buildLoadPayload(record)));
        navigate('/checkin');
    };

    if (loading) {
        return (
            <div className="recordPage">
                <div className="recordContent">
                    <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
                    <div className="recordEmpty">載入中…</div>
                </div>
            </div>
        );
    }

    return (
        <div className="recordPage">
            <div className="recordContent">
                <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
                <header className="recordHeader">
                    <div>
                        <h1>出席紀錄</h1>
                        <p>{latestRecord ? `最近一次：${formatDisplayDate(latestRecord.date)}，共 ${latestRecord.totalCount} 人` : '目前沒有紀錄'}</p>
                    </div>
                    <div className="rangeTabs">
                        {RANGE_OPTIONS.map(option => (
                            <button
                                key={option.label}
                                className={rangeMonths === option.months ? 'rangeTab active' : 'rangeTab'}
                                onClick={() => setRangeMonths(option.months)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </header>

                <section className="summaryGrid">
                    <div className="summaryItem">
                        <span>週數</span>
                        <strong>{summary.weeks}</strong>
                    </div>
                    <div className="summaryItem">
                        <span>平均總出席</span>
                        <strong>{summary.averageTotal}</strong>
                    </div>
                    <div className="summaryItem">
                        <span>平均大人</span>
                        <strong>{summary.averageAdult}</strong>
                    </div>
                    <div className="summaryItem">
                        <span>平均兒童</span>
                        <strong>{summary.averageChild}</strong>
                    </div>
                </section>

                <section className="recordSection">
                    <div className="recordSectionHeader">
                        <h2>出席趨勢</h2>
                        <span>{visibleRecords.length} 筆</span>
                    </div>
                    <AttendanceChart records={visibleRecords} />
                </section>

                <section className="recordSection">
                    <div className="recordSectionHeader">
                        <h2>每週明細</h2>
                        <span>點選週次查看名單</span>
                    </div>
                    <div className="weeklyList">
                        {visibleRecords.map(record => {
                            const isExpanded = expandedDate === record.date;
                            return (
                                <article key={record.date} className="weeklyItem">
                                    <button className="weeklySummary" onClick={() => setExpandedDate(isExpanded ? null : record.date)}>
                                        <span className="weeklyDate">{formatDisplayDate(record.date)}</span>
                                        <span className="weeklyMeta">{record.worship || '聚會'} · {record.speaker || '講員未填'}</span>
                                        <span className="weeklyCounts">
                                            <b>{record.totalCount}</b>
                                            <small>大人 {record.adultCount} / 兒童 {record.childCount}</small>
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div className="weeklyDetail">
                                            <div className="detailColumns">
                                                <div>
                                                    <h3>大人出席 {record.adultCount}</h3>
                                                    <div className="nameList">
                                                        {record.adultNames.length > 0
                                                            ? record.adultNames.map(name => <span key={name}>{name}</span>)
                                                            : <em>此筆紀錄沒有名單</em>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3>兒童出席 {record.childCount}</h3>
                                                    <div className="nameList">
                                                        {record.childNames.length > 0
                                                            ? record.childNames.map(name => <span key={name}>{name}</span>)
                                                            : <em>無兒童名單</em>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mealRow">用餐 {record.mealCount} 人</div>
                                            <div className="recordActions">
                                                <button className="loadRecordBtn" onClick={() => handleLoadRecord(record)}>讀入紀錄</button>
                                                <button className="deleteRecordBtn" onClick={() => handleDelete(record)}>刪除紀錄</button>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default RecordPage;
