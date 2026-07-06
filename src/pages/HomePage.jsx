import React from 'react';
import { Link } from 'react-router-dom';
import Banner from '../components/Banner.jsx';
import '../styles/PortalStyles.css';

const HomePage = () => (
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
            <Link className="portalCard checkinCard" to="/checkin">
                <span className="portalCardTag">Check-in</span>
                <h2>有意思點點名</h2>
                <p>登記出席、用餐與分組，快速完成每週青崇簽到。</p>
                <strong>開始點名</strong>
            </Link>

            <Link className="portalCard recordCard" to="/record">
                <span className="portalCardTag">Records</span>
                <h2>點點名紀錄</h2>
                <p>查看每週出席趨勢、人數統計與詳細出席名單。</p>
                <strong>查看紀錄</strong>
            </Link>

            <Link className="portalCard weeklyEditCard" to="/weekly/edit">
                <span className="portalCardTag">Weekly Report</span>
                <h2>填寫週報資訊</h2>
                <p>不同負責人可分別填寫報告、代禱、奉獻與服事提醒。</p>
                <strong>開始填寫</strong>
            </Link>

            <Link className="portalCard weeklyViewCard" to="/weekly/view">
                <span className="portalCardTag">Archive</span>
                <h2>瀏覽週報資訊</h2>
                <p>查看最新週報，也可切換歷史週報紀錄。</p>
                <strong>查看週報</strong>
            </Link>
        </section>
    </main>
);

export default HomePage;
