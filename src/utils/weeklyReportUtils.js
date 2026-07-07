const DEFAULT_SERVING_ROLES = [
    '講員',
    '司會',
    '主領',
    '樂手',
    '助敬拜',
    '司獻',
    '音控',
    '投影',
    '招待',
    '場佈',
    '財務',
    '典禮',
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const blankTitheRows = () => ([
    { code: '', amount: 0 },
    { code: '', amount: 0 },
    { code: '', amount: 0 },
    { code: '', amount: 0 },
]);

const pad2 = value => String(value).padStart(2, '0');

export const toRocYear = date => date.getFullYear() - 1911;

export const toReportId = date =>
    `${toRocYear(date)}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const getNextSaturday = (baseDate = new Date()) => {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    const daysUntilSaturday = (6 - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysUntilSaturday);
    return date;
};

export const formatGregorianDate = date =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const reportDateFromInput = value => {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? getNextSaturday() : date;
};

export const parseReportIdToDate = id => {
    const [rocYear, month, day] = String(id || '').split('-').map(Number);
    if (!rocYear || !month || !day) return getNextSaturday();
    return new Date(rocYear + 1911, month - 1, day);
};

export const createBlankReport = (date = getNextSaturday()) => {
    const nextSaturday = new Date(date);
    return {
        id: toReportId(nextSaturday),
        updatedAt: new Date().toISOString(),
        title: {
            main: '有意思窩敘',
            subtitle: '中華基督教便以利教會木柵堂青年崇拜週報',
        },
        annual_theme: '團隊事奉成全聖徒',
        date: {
            year: toRocYear(nextSaturday),
            month: nextSaturday.getMonth() + 1,
            day: nextSaturday.getDate(),
            weekday: WEEKDAYS[nextSaturday.getDay()],
        },
        time: {
            start: '15:50',
            end: '18:00',
        },
        announcements: [''],
        prayer_requests: [''],
        attendance: {
            total: 0,
            adult: 0,
            child: 0,
            date: '',
        },
        offering: {
            total: 0,
            tithe: blankTitheRows(),
        },
        next_week_joint_service: false,
        next_week_serving: DEFAULT_SERVING_ROLES.reduce((acc, role) => {
            acc[role] = [];
            return acc;
        }, {}),
    };
};

export const mergeReportWithDefault = report => {
    const date = report?.id ? parseReportIdToDate(report.id) : getNextSaturday();
    const blank = createBlankReport(date);
    return {
        ...blank,
        ...report,
        title: { ...blank.title, ...(report?.title || {}) },
        date: { ...blank.date, ...(report?.date || {}) },
        time: { ...blank.time, ...(report?.time || {}) },
        announcements: Array.isArray(report?.announcements) && report.announcements.length > 0
            ? report.announcements
            : blank.announcements,
        prayer_requests: Array.isArray(report?.prayer_requests) && report.prayer_requests.length > 0
            ? report.prayer_requests
            : blank.prayer_requests,
        attendance: {
            ...blank.attendance,
            ...(report?.attendance || {}),
            total: report?.attendance?.total ?? report?.attendance?.previous_week ?? blank.attendance.total,
            adult: report?.attendance?.adult ?? blank.attendance.adult,
            child: report?.attendance?.child ?? blank.attendance.child,
            date: report?.attendance?.date ?? blank.attendance.date,
        },
        offering: {
            ...blank.offering,
            ...(report?.offering || {}),
            tithe: Array.isArray(report?.offering?.tithe) && report.offering.tithe.length >= 4
                ? report.offering.tithe
                : [
                    ...(Array.isArray(report?.offering?.tithe) ? report.offering.tithe : []),
                    ...blankTitheRows(),
                ].slice(0, 4),
        },
        next_week_joint_service: !!report?.next_week_joint_service,
        next_week_serving: {
            ...blank.next_week_serving,
            ...(report?.next_week_serving || {}),
        },
    };
};

export const servingRoles = DEFAULT_SERVING_ROLES;

export const formatReportDateLine = report =>
    `${report.date.year}年${pad2(report.date.month)}月${pad2(report.date.day)}日(${report.date.weekday}) ${report.time.start}-${report.time.end}`;

export const formatNextWeekServingDate = report => {
    const date = new Date(report.date.year + 1911, report.date.month - 1, report.date.day);
    date.setDate(date.getDate() + 7);
    return formatGregorianDate(date);
};

export const splitPeopleInput = value =>
    String(value || '')
        .split(/[、,\n]/)
        .map(item => item.trim())
        .filter(Boolean);

export const joinPeople = value =>
    Array.isArray(value) ? value.join('、') : '';

export const getReportGregorianDateId = report =>
    formatGregorianDate(new Date(report.date.year + 1911, report.date.month - 1, report.date.day));

const getFieldValue = (record, key) =>
    (record.field || []).find(field => field.key === key)?.value;

const numberFromValue = value => {
    const match = String(value ?? '').match(/\d+/);
    return match ? Number(match[0]) : 0;
};

const splitNames = value => {
    if (!value) return [];
    const names = Array.isArray(value) ? value : String(value).split('、');
    return names.map(name => String(name).trim()).filter(Boolean);
};

export const buildChildNameSet = structure => {
    const names = new Set();
    for (const section of structure?.sections || []) {
        for (const subgroup of section.subgroups || []) {
            if (subgroup.id !== 'sg_children' && subgroup.title !== '兒童') continue;
            for (const member of subgroup.members || []) names.add(member.name);
        }
    }
    return names;
};

export const getAttendanceStatsFromRecord = (record, childNameSet = new Set()) => {
    if (!record) return { total: 0, adult: 0, child: 0, date: '' };

    const adultNamesFromField = splitNames(getFieldValue(record, '出席名單'));
    const childNamesFromField = splitNames(getFieldValue(record, '兒童名單'));
    if (adultNamesFromField.length > 0 || childNamesFromField.length > 0) {
        const inferredChildNames = adultNamesFromField.filter(name => childNameSet.has(name));
        const adultNames = adultNamesFromField.filter(name => !childNameSet.has(name));
        const childNames = childNamesFromField.length > 0 ? childNamesFromField : inferredChildNames;
        const adult = adultNames.length;
        const child = childNames.length;
        return { total: adult + child, adult, child, date: record.date || '' };
    }

    const fieldAdultValue = getFieldValue(record, '出席人數');
    const fieldChildValue = getFieldValue(record, '兒童人數');
    if (fieldAdultValue !== undefined || fieldChildValue !== undefined) {
        const adult = numberFromValue(fieldAdultValue);
        const child = numberFromValue(fieldChildValue);
        return { total: adult + child, adult, child, date: record.date || '' };
    }

    if (record.fullData?.families) {
        return record.fullData.families.reduce((stats, family) => {
            const isChildrenFamily = family.id === 'sg_children' || family.title === '兒童';
            const count = (family.members || []).filter(member => member.arriveState).length;
            if (isChildrenFamily) stats.child += count;
            else stats.adult += count;
            stats.total += count;
            return stats;
        }, { total: 0, adult: 0, child: 0, date: record.date || '' });
    }

    return { total: 0, adult: 0, child: 0, date: record.date || '' };
};

export const findReportAttendance = (records, report, childNameSet = new Set()) => {
    const reportDate = getReportGregorianDateId(report);
    const record = (records || [])
        .filter(item => item.date && item.date < reportDate)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return getAttendanceStatsFromRecord(record, childNameSet);
};

const hasTextItems = items =>
    Array.isArray(items) && items.some(item => String(item || '').trim());

const hasTitheItems = items =>
    Array.isArray(items) && items.some(item =>
        String(item?.code || '').trim() || Number(item?.amount || 0) > 0
    );

const hasServingPeople = serving =>
    Object.values(serving || {}).some(value => Array.isArray(value) && value.length > 0);

export const hasWeeklyReportContent = report => {
    const normalized = mergeReportWithDefault(report);
    return (
        hasTextItems(normalized.announcements) ||
        hasTextItems(normalized.prayer_requests) ||
        Number(normalized.offering?.total || 0) > 0 ||
        hasTitheItems(normalized.offering?.tithe) ||
        normalized.next_week_joint_service ||
        hasServingPeople(normalized.next_week_serving)
    );
};

export const reportSortDesc = (a, b) => String(b.id).localeCompare(String(a.id));
