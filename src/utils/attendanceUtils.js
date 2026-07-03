// Calculate how many times a member attended in the past N months
export function calcAttendanceCount(records, memberName, months = 3) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = formatLocalDate(cutoff);

    let count = 0;
    for (const record of records) {
        if (!record.date || record.date < cutoffStr) continue;
        if (getAttendanceNames(record).includes(String(memberName).trim())) count++;
    }
    return count;
}

export function hasAttendedWithinMonths(records, memberName, months = 6) {
    return calcAttendanceCount(records, memberName, months) > 0;
}

export function getAttendanceStats(records, memberName, months = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = formatLocalDate(cutoff);
    const targetName = String(memberName).trim();

    let recentCount = 0;
    let lastDate = '';

    for (const record of records) {
        if (!record.date) continue;
        const names = getAttendanceNames(record);
        if (!names.includes(targetName)) continue;

        if (record.date >= cutoffStr) recentCount++;
        if (record.date > lastDate) lastDate = record.date;
    }

    return { recentCount, lastDate };
}

// Sort a member array by attendance count (descending), attaching the count
export function sortByAttendance(members, records) {
    return members
        .map(m => ({ ...m, _attendanceCount: calcAttendanceCount(records, m.name) }))
        .sort((a, b) => b._attendanceCount - a._attendanceCount);
}

function getAttendanceNames(record) {
    const attendanceFields = (record.field || []).filter(f =>
        f.key === '出席名單' || f.key === '兒童名單'
    );

    return attendanceFields.flatMap(field => {
        if (!field.value) return [];
        // Support both string ("name1、name2") and legacy array formats
        return Array.isArray(field.value)
            ? field.value
            : String(field.value).split('、');
    }).map(name => String(name).trim()).filter(Boolean);
}

// Local-timezone date string YYYY-MM-DD (avoids UTC offset issues)
function formatLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
