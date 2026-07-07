import React from 'react';
import { Link } from 'react-router-dom';
import Banner from '../components/Banner.jsx';
import { verifyAdminPassword } from '../constants/AdminAuth';
import '../styles/PortalStyles.css';

const CURRENT_SEASON_SERVING_URL = 'https://docs.google.com/spreadsheets/d/1E4zF8ikU2aM89FbUAKop_lPCM6Rrn8EHXC4iSgz4B8I/edit?gid=0#gid=0';

const HomePage = ({ isAdmin, onAdminChange }) => {
    const [passwordInput, setPasswordInput] = React.useState('');

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
                    <Link className="portalCard checkinCard" to="/checkin">
                        <span className="portalCardTag">Check-in</span>
                        <h2>有意思點點名</h2>
                    </Link>

                    <Link className="portalCard recordCard" to="/record">
                        <span className="portalCardTag">Records</span>
                        <h2>點點名紀錄</h2>
                    </Link>
                </div>

                <div className="portalServicePair">
                    <Link className="portalCard weeklyEditCard" to="/weekly/edit">
                        <span className="portalCardTag">Weekly Report</span>
                        <h2>填寫週報資訊</h2>
                    </Link>

                    <Link className="portalCard weeklyViewCard" to="/weekly/view">
                        <span className="portalCardTag">Archive</span>
                        <h2>瀏覽週報資訊</h2>
                    </Link>
                </div>

                <div className="portalServicePair">
                    <a
                        className="portalCard servingCurrentCard"
                        href={CURRENT_SEASON_SERVING_URL}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <span className="portalCardTag">Serving</span>
                        <h2>本季服事表</h2>
                    </a>

                    <button
                        type="button"
                        className="portalCard servingNextCard"
                        onClick={() => alert('服事表尚未公佈，請耐心等待 🙏')}
                    >
                        <span className="portalCardTag">Next Season</span>
                        <h2>下一季服事表</h2>
                    </button>
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
