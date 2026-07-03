// Calculate how many times a member attended in the past N months
export function calcAttendanceCount(records, memberName, months = 3) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = formatLocalDate(cutoff);

    let count = 0;
    for (const record of records) {
        if (!record.date || record.date < cutoffStr) continue;
        const field = (record.field || []).find(f => f.key === '出席名單');
        if (!field || !field.value) continue;

        // Support both string ("name1、name2") and legacy array formats
        const names = Array.isArray(field.value)
            ? field.value
            : String(field.value).split('、');

        if (names.includes(memberName)) count++;
    }
    return count;
}

// Sort a member array by attendance count (descending), attaching the count
export function sortByAttendance(members, records) {
    return members
        .map(m => ({ ...m, _attendanceCount: calcAttendanceCount(records, m.name) }))
        .sort((a, b) => b._attendanceCount - a._attendanceCount);
}

// Local-timezone date string YYYY-MM-DD (avoids UTC offset issues)
function formatLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
