import React from 'react';
import { Link } from 'react-router-dom';
import Banner from '../components/Banner.jsx';
import { verifyAdminPassword } from '../constants/AdminAuth';
import { DEFAULT_PORTAL_LINKS, fetchPortalLinks, savePortalLinks } from '../services/portalLinks';
import '../styles/PortalStyles.css';

const HomePage = ({ isAdmin, onAdminChange }) => {
    const [passwordInput, setPasswordInput] = React.useState('');
    const [portalLinks, setPortalLinks] = React.useState(DEFAULT_PORTAL_LINKS);

    const handleAdminSubmit = e => {
        e.preventDefault();
        if (verifyAdminPassword(passwordInput)) {
            onAdminChange(true);
            setPasswordInput('');
        } else {
            alert('密碼錯誤');
            setPasswordInput('');
        }
    };

    React.useEffect(() => {
        const loadPortalLinks = async () => {
            try {
                setPortalLinks(await fetchPortalLinks());
            } catch (error) {
                console.error(error);
                setPortalLinks(DEFAULT_PORTAL_LINKS);
            }
        };
        loadPortalLinks();
    }, []);

    const updateServingLink = async (key, label, allowEmpty = false) => {
        const value = window.prompt(`${label}連結網址：`, portalLinks[key] || '');
        if (value === null) return;
        const nextUrl = value.trim();
        if (!allowEmpty && !nextUrl) {
            alert(`${label}連結不可空白`);
            return;
        }

        const nextLinks = { ...portalLinks, [key]: nextUrl };
        setPortalLinks(nextLinks);
        try {
            await savePortalLinks(nextLinks);
            alert(`${label}連結已更新`);
        } catch (error) {
            console.error(error);
            alert('儲存失敗，請檢查網路連線。');
            setPortalLinks(portalLinks);
        }
    };

    return (
        <main className="portalPage">
            <div className="portalBanner">
                <Banner />
            </div>
            <section className="portalHero">
                <div className="portalHeroText">
                    <p className="portalKicker">Peniel Youth</p>
                    <h1>青崇資訊入口</h1>
                </div>
            </section>

            <section className="portalGrid" aria-label="系統服務">
                <div className="portalServicePair">
                    <Link className="portalCard weeklyViewCard" to="/weekly/view">
                        <span className="portalCardTag">Archive</span>
                        <h2>瀏覽週報資訊</h2>
                    </Link>

                    <Link className="portalCard weeklyEditCard" to="/weekly/edit">
                        <span className="portalCardTag">Weekly Report</span>
                        <h2>填寫週報資訊</h2>
                    </Link>
                </div>

                <div className="portalServicePair">
                    <Link className="portalCard recordCard" to="/record">
                        <span className="portalCardTag">Records</span>
                        <h2>點點名紀錄</h2>
                    </Link>

                    <Link className="portalCard checkinCard" to="/checkin">
                        <span className="portalCardTag">Check-in</span>
                        <h2>有意思點點名</h2>
                    </Link>
                </div>

                <div className="portalServicePair">
                    <div className="portalServingCardShell">
                        <a
                            className="portalCard servingCurrentCard"
                            href={portalLinks.currentSeasonServing || DEFAULT_PORTAL_LINKS.currentSeasonServing}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span className="portalCardTag">Serving</span>
                            <h2>本季服事表</h2>
                        </a>
                        {isAdmin && (
                            <button
                                type="button"
                                className="portalCardEditBtn"
                                aria-label="編輯本季服事表連結"
                                onClick={() => updateServingLink('currentSeasonServing', '本季服事表')}
                            >
                                ⚙
                            </button>
                        )}
                    </div>

                    <div className="portalServingCardShell">
                        <button
                            type="button"
                            className={`portalCard servingNextCard ${!portalLinks.nextSeasonServing ? 'servingNextCardEmpty' : ''}`}
                            disabled={!portalLinks.nextSeasonServing}
                            onClick={() => {
                                window.open(portalLinks.nextSeasonServing, '_blank', 'noopener,noreferrer');
                            }}
                        >
                            <span className="portalCardTag">Next Season</span>
                            <h2>下一季服事表</h2>
                            {!portalLinks.nextSeasonServing && (
                                <p className="portalCardNotice">（尚未公告）</p>
                            )}
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                className="portalCardEditBtn"
                                aria-label="編輯下一季服事表連結"
                                onClick={() => updateServingLink('nextSeasonServing', '下一季服事表', true)}
                            >
                                ⚙
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="portalAdminArea">
                {isAdmin ? (
                    <div className="portalAdminStatus">
                        <span>管理員模式已啟用</span>
                        <button type="button" onClick={() => onAdminChange(false)}>登出</button>
                    </div>
                ) : (
                    <form className="portalAdminLogin" onSubmit={handleAdminSubmit}>
                        <label htmlFor="portalAdminPwd">管理員登入</label>
                        <input
                            id="portalAdminPwd"
                            type="password"
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            placeholder="輸入密碼"
                        />
                        <button type="submit">登入</button>
                    </form>
                )}
            </section>
        </main>
    );
};

export default HomePage;
