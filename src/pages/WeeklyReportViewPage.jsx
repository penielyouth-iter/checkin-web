import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWeeklyReports } from '../services/weeklyReport';
import { formatReportDateLine, servingRoles } from '../utils/weeklyReportUtils';
import '../styles/WeeklyReportStyles.css';

const money = value => Number(value || 0).toLocaleString('zh-TW');
const titheSlots = tithe => [
    ...(Array.isArray(tithe) ? tithe : []),
    { code: '', amount: 0 },
    { code: '', amount: 0 },
    { code: '', amount: 0 },
    { code: '', amount: 0 },
].slice(0, Math.max(4, Array.isArray(tithe) ? tithe.length : 0));

const ListSection = ({ label, title, items }) => (
    <section className="weeklyReportSection">
        <div className="weeklySectionTitle">
            <span>{label}</span>
            <h2>{title}</h2>
        </div>
        <ol className="weeklyNumberList">
            {(items || []).filter(Boolean).map((item, idx) => (
                <li key={idx}>{item}</li>
            ))}
        </ol>
        {(items || []).filter(Boolean).length === 0 && <p className="weeklyMuted">尚未填寫</p>}
    </section>
);

const ServingTable = ({ serving, jointService }) => (
    <section className="weeklyReportSection servingSection">
        <div className="weeklySectionTitle">
            <span>Serving</span>
            <h2>下週服事同工</h2>
        </div>
        {jointService ? (
            <div className="jointServiceNotice">下週青崇併大堂</div>
        ) : (
            <div className="servingTable">
                {servingRoles.map(role => (
                    <div className="servingRow" key={role}>
                        <b>{role}</b>
                        <span>{(serving?.[role] || []).join('、') || '尚未填寫'}</span>
                    </div>
                ))}
            </div>
        )}
    </section>
);

const WeeklyReportViewPage = () => {
    const [reports, setReports] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchWeeklyReports();
                setReports(data);
                setSelectedId(data[0]?.id || '');
            } catch (error) {
                console.error(error);
                setReports([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const selectedReport = useMemo(
        () => reports.find(report => report.id === selectedId) || reports[0],
        [reports, selectedId]
    );

    if (loading) {
        return (
            <main className="weeklyPage">
                <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
                <div className="weeklyEmpty">週報資料載入中...</div>
            </main>
        );
    }

    if (!selectedReport) {
        return (
            <main className="weeklyPage">
                <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
                <div className="weeklyEmpty">目前還沒有週報紀錄。</div>
            </main>
        );
    }

    return (
        <main className="weeklyPage viewMode">
            <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
            <article className="weeklyReportCanvas">
                <section className="weeklyReportHero">
                    <div>
                        <p className="weeklyChurch">中華基督教便以利教會木柵堂</p>
                        <h1>{selectedReport.title.main}</h1>
                        <p>{selectedReport.title.subtitle}</p>
                        <strong>{formatReportDateLine(selectedReport)}</strong>
                    </div>
                    <aside>
                        <span>年度主題</span>
                        <b>{selectedReport.annual_theme}</b>
                    </aside>
                </section>

                <div className="weeklyReportGrid">
                    <ListSection label="Announcements" title="本週報告事項" items={selectedReport.announcements} />
                    <ListSection label="Prayer" title="肢體生活與代禱" items={selectedReport.prayer_requests} />
                </div>

                <section className="weeklyBottomGrid">
                    <div className="weeklyInfoCard attendanceCard">
                        <div className="weeklySectionTitle">
                            <span>Attendance</span>
                            <h2>
                                上週青崇資訊
                                {selectedReport.attendance?.date && (
                                    <small className="weeklyAttendanceDate">（{selectedReport.attendance.date}）</small>
                                )}
                            </h2>
                        </div>
                        <div className="attendanceCountLine">
                            <h2>{selectedReport.attendance?.total || selectedReport.attendance?.previous_week || 0} 人</h2>
                            <small>
                                大人 {selectedReport.attendance?.adult || 0} / 兒童 {selectedReport.attendance?.child || 0}
                            </small>
                        </div>
                        <p>上週聚會人數</p>
                        <div className="offeringTotal">
                            <b className="weeklyTitheHeading">奉獻合計</b>
                            <strong>${money(selectedReport.offering?.total)}</strong>
                        </div>
                        <h3 className="weeklyTitheHeading">什一奉獻</h3>
                        <div className="titheChips">
                            {titheSlots(selectedReport.offering?.tithe).map((item, idx) => (
                                <span key={idx}>
                                    {item.code || '\u00A0'}
                                    {item.code || item.amount ? ` $${money(item.amount)}` : '\u00A0'}
                                </span>
                            ))}
                        </div>
                    </div>

                    <ServingTable
                        serving={selectedReport.next_week_serving}
                        jointService={!!selectedReport.next_week_joint_service}
                    />
                </section>
            </article>

            <div className="weeklyArchiveFooter">
                <label className="archiveSelect">
                    <span>歷史週報</span>
                    <select value={selectedReport.id} onChange={e => setSelectedId(e.target.value)}>
                        {reports.map(report => (
                            <option key={report.id} value={report.id}>{report.id}</option>
                        ))}
                    </select>
                </label>
            </div>
        </main>
    );
};

export default WeeklyReportViewPage;
