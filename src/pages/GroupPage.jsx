import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/GroupPage.css';

const GroupPage = () => {
    const [tableData, setTableData] = useState([]);
    const [tableHeight, setTableHeight] = useState([]);

    useEffect(() => {
        const groupResult = JSON.parse(sessionStorage.getItem('groupResult'));
        if (groupResult) {
            setTableData(groupResult.tableData);
            setTableHeight(groupResult.tableHeight);
        }
    }, []);

    if (tableData.length === 0) {
        return (
            <div className="groupContainer">
                <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
                <div className="groupEmpty">
                    <p>沒有分組資料，請先回主畫面進行分組。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="groupContainer">
            <Link className="homeLink homeLinkFloating" to="/" aria-label="回主畫面"><span className="homeIcon" aria-hidden="true" /></Link>
            <table className="groupTable">
                <thead>
                    <tr style={{ height: tableHeight[0] }}>
                        {tableData.map((column, colIndex) => (
                            <th key={colIndex}>{column[0]}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableData[0].slice(1).map((_, rowIndex) => (
                        <tr key={rowIndex} style={{ height: tableHeight[rowIndex + 1] }}>
                            {tableData.map((column, colIndex) => (
                                <td key={colIndex}>{column[rowIndex + 1]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GroupPage;
