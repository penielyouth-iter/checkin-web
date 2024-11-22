import { useEffect, useState } from 'react';
import '../styles/GroupPage.css'; // Custom CSS file for styles

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

    return (
        <div className="container">
            <table className="table">
                <thead>
                    <tr>
                        {/* Table headers based on the first row of the tableData */}
                        {tableData.length > 0 && tableData.map((column, colIndex) => (
                            <th key={colIndex} style={{ fontSize: 18, height: tableHeight }}>
                                {column[0]} {/* First item in each column is the header */}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Table rows, now iterating over the rows of data instead of columns */}
                    {tableData.length > 0 && tableData[0].slice(1).map((_, rowIndex) => (  // Skip header row for table body
                        <tr key={rowIndex}>
                            {tableData.map((column, colIndex) => (
                                <td key={colIndex} style={{ fontSize: 18, height: tableHeight }}>
                                    {column[rowIndex + 1]} {/* Skip the first item as it's the header */}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default GroupPage;
