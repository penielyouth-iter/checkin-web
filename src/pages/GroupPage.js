import { useEffect, useState } from 'react';
import '../styles/GroupPage.css'; // Custom CSS file for styles

const GroupPage = () => {
    const [tableData, setTableData] = useState([]);
    console.log("Group page")

    useEffect(() => {
        console.log("Group page use effect")
        const storedTableData = JSON.parse(sessionStorage.getItem('tableData'));
        console.log("Group page use effect storedTableData", storedTableData)

        // Set the state with the data from sessionStorage
        if (storedTableData) {
            setTableData(storedTableData);
            console.log("123 storedTableData:", storedTableData)
            console.log("123 tableData:", tableData)
        }
    }, []);

    return (
        <div className="container">
            <table className="table">
                <thead>
                    <tr>
                        {/* Table headers based on the column names */}
                        {tableData && tableData[0] && tableData[0].map((header, index) => (
                            <th key={index} style={{ fontSize: 16, height: 50 }}>
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Table rows */}
                    {tableData && tableData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} style={{ fontSize: 16 }}>
                                    {cell}
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
