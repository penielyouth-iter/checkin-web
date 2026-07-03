import { describe, expect, it } from 'vitest';
import { getAttendanceStats } from './attendanceUtils';

const formatDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const monthsAgo = months => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return formatDate(date);
};

describe('attendanceUtils', () => {
    it('counts recent attendance and tracks last attendance date', () => {
        const latestDate = monthsAgo(1);
        const records = [
            {
                date: latestDate,
                field: [{ key: '出席名單', value: 'Alice、Bob' }],
            },
            {
                date: monthsAgo(2),
                field: [{ key: '兒童名單', value: 'Alice' }],
            },
            {
                date: monthsAgo(7),
                field: [{ key: '出席名單', value: 'Alice' }],
            },
        ];

        expect(getAttendanceStats(records, 'Alice', 6)).toEqual({
            recentCount: 2,
            lastDate: latestDate,
        });
    });
});
