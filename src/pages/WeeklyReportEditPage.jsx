import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    fetchReportAttendance,
    fetchWeeklyReport,
    saveWeeklyReportSection,
} from '../services/weeklyReport';
import {
    createBlankReport,
    formatGregorianDate,
    formatReportDateLine,
    getNextSaturday,
    hasWeeklyReportContent,
    joinPeople,
    mergeReportWithDefault,
    reportDateFromInput,
    servingRoles,
    splitPeopleInput,
} from '../utils/weeklyReportUtils';
import '../styles/WeeklyReportStyles.css';

const formatNumberedText = items =>
    (items || []).filter(Boolean).map((item, idx) => `${idx + 1}. ${item}`).join('\n\n');

const parseNumberedText = value => {
    const text = String(value || '').trim();
    if (!text) return [''];

    const lines = text.split('\n');
    const numberedItems = [];
    let current = '';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const match = line.match(/^\d+\.\s*(.*)$/);
        if (match) {
            if (current.trim()) numberedItems.push(current.trim());
            current = match[1].trim();
        } else {
            current = current ? `${current}\n${line}` : line;
        }
    }
    if (current.trim()) numberedItems.push(current.trim());
    if (numberedItems.length > 1 || /^\d+\./.test(text)) return numberedItems;

    return text.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);
};

const TextListEditor = ({ title, items, onChange, accent, action }) => {
    const [text, setText] = useState(formatNumberedText(items));

    const handleTextChange = value => {
        setText(value);
        onChange(parseNumberedText(value));
    };

    return (
        <section className={`weeklyEditorPanel ${accent}`}>
            <div className="weeklyPanelHeader">
                <div>
                    <h2>{title}</h2>
                </div>
                {action}
            </div>
            <textarea
                className="weeklyBulkTextarea"
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                placeholder={`1. 請輸入${title}\n\n2. 可以直接貼上整段內容`}
            />
        </section>
    );
};

const ServingEditor = ({ serving, jointService, onChange, onJointServiceChange, action }) => {
    const updateRole = (role, value) => onChange({ ...serving, [role]: splitPeopleInput(value) });

    return (
        <section className="weeklyEditorPanel servingAccent">
            <div className="weeklyPanelHeader">
                <div>
                    <h2>下週服事同工</h2>
                </div>
                {action}
            </div>
            <label className="jointServiceToggle">
                <input
                    type="checkbox"
                    checked={jointService}
                    onChange={e => onJointServiceChange(e.target.checked)}
                />
                <span>下週青崇併大堂</span>
            </label>
            <div className="servingEditorGrid">
                {servingRoles.map(role => (
                    <label className="weeklyField" key={role}>
                        <span>{role}</span>
                        <input
                            value={joinPeople(serving[role])}
                            onChange={e => updateRole(role, e.target.value)}
                            disabled={jointService}
                            placeholder="可用頓號或逗號分隔"
                        />
                    </label>
                ))}
            </div>
        </section>
    );
};

const OfferingEditor = ({ offering, onOfferingChange, action }) => {
    const updateTithe = (idx, key, value) => {
        const tithe = offering.tithe.map((item, itemIdx) =>
            itemIdx === idx ? { ...item, [key]: key === 'amount' ? Number(value || 0) : value } : item
        );
        onOfferingChange({ ...offering, tithe });
    };

    return (
        <section className="weeklyEditorPanel offeringAccent">
            <div className="weeklyPanelHeader">
                <div>
                    <h2>奉獻紀錄</h2>
                </div>
                {action}
            </div>
            <div className="offeringGrid">
                <label className="weeklyField">
                    <span>奉獻合計</span>
                    <input
                        type="number"
                        min="0"
                        value={offering.total}
                        onChange={e => onOfferingChange({ ...offering, total: Number(e.target.value || 0) })}
                    />
                </label>
            </div>
            <h3 className="titheTitle">什一奉獻</h3>
            <div className="titheList">
                {offering.tithe.map((item, idx) => (
                    <div className="titheRow" key={idx}>
                        <input value={item.code} onChange={e => updateTithe(idx, 'code', e.target.value)} placeholder="代號" />
                        <input type="number" min="0" value={item.amount} onChange={e => updateTithe(idx, 'amount', e.target.value)} placeholder="金額" />
                        <button
                            onClick={() => onOfferingChange({ ...offering, tithe: offering.tithe.filter((_, itemIdx) => itemIdx !== idx) })}
                            disabled={offering.tithe.length <= 2}
                        >
                            刪除
                        </button>
                    </div>
                ))}
                <button
                    className="titheAddBtn"
                    onClick={() => onOfferingChange({ ...offering, tithe: [...offering.tithe, { code: '', amount: 0 }] })}
                    aria-label="新增十一奉獻欄位"
                >
                    +
                </button>
            </div>
        </section>
    );
};

const WeeklyReportEditPage = () => {
    const defaultDate = getNextSaturday();
    const [dateInput, setDateInput] = useState(formatGregorianDate(defaultDate));
    const [report, setReport] = useState(createBlankReport(defaultDate));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState('');
    const [titleInfoEditing, setTitleInfoEditing] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const reportDate = useMemo(() => reportDateFromInput(dateInput), [dateInput]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const blank = createBlankReport(reportDate);
                const existing = await fetchWeeklyReport(blank.id);
                const merged = mergeReportWithDefault(existing.id === blank.id ? existing : blank);
                const attendance = await fetchReportAttendance(merged);
                const withAttendance = {
                    ...merged,
                    attendance,
                };
                setReport(withAttendance);
                setTitleInfoEditing(false);
            } catch (error) {
                console.error(error);
                setReport(createBlankReport(reportDate));
                setTitleInfoEditing(false);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [reportDate]);

    const saveSection = async (label, patch) => {
        if (!hasWeeklyReportContent({ ...report, ...patch })) {
            alert('尚未填寫週報內容，不會儲存紀錄。');
            return;
        }
        setSaving(label);
        try {
            await saveWeeklyReportSection(report.id, patch);
            alert(`${label}已儲存`);
        } catch (error) {
            console.error(error);
            alert('儲存失敗，請檢查網路連線。');
        } finally {
            setSaving('');
        }
    };

    const saveTitleInfo = async () => {
        if (!hasWeeklyReportContent(report)) {
            alert('尚未填寫週報內容，不會儲存紀錄。');
            return;
        }
        setSaving('標題與年度主題');
        try {
            await saveWeeklyReportSection(report.id, {
                title: report.title,
                annual_theme: report.annual_theme,
                date: report.date,
                time: report.time,
            });
            setTitleInfoEditing(false);
            alert('標題與年度主題已儲存');
        } catch (error) {
            console.error(error);
            alert('儲存失敗，請檢查網路連線。');
        } finally {
            setSaving('');
        }
    };

    const updateDate = date => {
        setDateInput(formatGregorianDate(date));
        setDatePickerOpen(false);
    };

    if (loading) {
        return (
            <main className="weeklyPage">
                <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
                <div className="weeklyEmpty">週報資料載入中...</div>
            </main>
        );
    }

    return (
        <main className="weeklyPage">
            <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
            <section className="weeklyEditHero">
                <div>
                    <p className="weeklyKicker">填寫週報資訊</p>
                    <h1>{report.title.main}</h1>
                    <p>{report.title.subtitle}</p>
                    <strong>{formatReportDateLine(report)}</strong>
                </div>
                <div className="datePickerCard">
                    <span>週報日期</span>
                    <button className="weeklyDatePickerButton" onClick={() => setDatePickerOpen(prev => !prev)}>
                        {dateInput}
                    </button>
                    {datePickerOpen && (
                        <div className="weeklyCalendarPopover">
                            <DatePicker
                                selected={reportDate}
                                onChange={updateDate}
                                inline
                            />
                        </div>
                    )}
                </div>
            </section>

            <section className="weeklyEditorPanel titleAccent">
                <div className="weeklyPanelHeader">
                    <div>
                        <h2>標題與年度主題</h2>
                    </div>
                    {titleInfoEditing ? (
                        <button
                            className="weeklySaveBtn"
                            onClick={saveTitleInfo}
                            disabled={saving !== ''}
                        >
                            {saving === '標題與年度主題' ? '儲存中...' : '儲存'}
                        </button>
                    ) : (
                        <button
                            className="weeklySaveBtn"
                            onClick={() => setTitleInfoEditing(true)}
                            disabled={saving !== ''}
                        >
                            編輯
                        </button>
                    )}
                </div>
                {titleInfoEditing ? (
                    <div className="titleEditorGrid">
                        <label className="weeklyField">
                            <span>主標題</span>
                            <input value={report.title.main} onChange={e => setReport({ ...report, title: { ...report.title, main: e.target.value } })} />
                        </label>
                        <label className="weeklyField">
                            <span>副標題</span>
                            <input value={report.title.subtitle} onChange={e => setReport({ ...report, title: { ...report.title, subtitle: e.target.value } })} />
                        </label>
                        <label className="weeklyField">
                            <span>年度主題</span>
                            <input value={report.annual_theme} onChange={e => setReport({ ...report, annual_theme: e.target.value })} />
                        </label>
                    </div>
                ) : (
                    <div className="titleInfoPreview">
                        <p><span>主標題</span>{report.title.main}</p>
                        <p><span>副標題</span>{report.title.subtitle}</p>
                        <p><span>年度主題</span>{report.annual_theme}</p>
                    </div>
                )}
            </section>

            <OfferingEditor
                offering={report.offering}
                onOfferingChange={offering => setReport({ ...report, offering })}
                action={(
                    <button className="weeklySaveBtn" onClick={() => saveSection('奉獻紀錄', { attendance: report.attendance, offering: report.offering })} disabled={saving !== ''}>
                        {saving === '奉獻紀錄' ? '儲存中...' : '儲存'}
                    </button>
                )}
            />

            <TextListEditor
                title="本週報告事項"
                accent="announcementAccent"
                items={report.announcements}
                onChange={announcements => setReport({ ...report, announcements })}
                action={(
                    <button className="weeklySaveBtn" onClick={() => saveSection('報告事項', { announcements: report.announcements })} disabled={saving !== ''}>
                        {saving === '報告事項' ? '儲存中...' : '儲存'}
                    </button>
                )}
            />

            <TextListEditor
                title="肢體生活與代禱"
                accent="prayerAccent"
                items={report.prayer_requests}
                onChange={prayer_requests => setReport({ ...report, prayer_requests })}
                action={(
                    <button className="weeklySaveBtn" onClick={() => saveSection('代禱事項', { prayer_requests: report.prayer_requests })} disabled={saving !== ''}>
                        {saving === '代禱事項' ? '儲存中...' : '儲存'}
                    </button>
                )}
            />

            <ServingEditor
                serving={report.next_week_serving}
                jointService={!!report.next_week_joint_service}
                onChange={next_week_serving => setReport({ ...report, next_week_serving })}
                onJointServiceChange={next_week_joint_service => setReport({ ...report, next_week_joint_service })}
                action={(
                    <button
                        className="weeklySaveBtn"
                        onClick={() => saveSection('下週服事同工', {
                            next_week_serving: report.next_week_serving,
                            next_week_joint_service: !!report.next_week_joint_service,
                        })}
                        disabled={saving !== ''}
                    >
                        {saving === '下週服事同工' ? '儲存中...' : '儲存'}
                    </button>
                )}
            />
        </main>
    );
};

export default WeeklyReportEditPage;
