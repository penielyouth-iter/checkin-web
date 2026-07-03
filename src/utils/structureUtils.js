import { getAttendanceStats } from './attendanceUtils';

const RUNTIME_KEYS = [
    'arriveState',
    'groupState',
    'mealState',
    '_attendanceCount',
    '_lastAttendanceDate',
    '_sourceSectionId',
    '_sourceSubgroupId',
    '_generated',
    'isChild',
];

const QINXUAN_SECTION_ID = 'section_qinxuan';
const NON_QINXUAN_SECTION_ID = 'section_nonqinxuan';
const AUTO_MISSING_TITLE = '半年以上未出席';
const AUTO_MISSING_ID_SUFFIX = '_missing_over_6_months';
const NON_QINXUAN_BROTHERS_ID = 'sg_brothers';
const NON_QINXUAN_SISTERS_ID = 'sg_sisters';
const NON_QINXUAN_CHILDREN_ID = 'sg_children';

const DEFAULT_WORSHIP_TYPES = ['青年崇拜', '團契美好時光'];
const DEFAULT_SPEAKERS = ['洪英正 教授', '錢玉芬 教授', '劉信優 牧師', '董倫賢 牧師', '楊雅莉 牧師', '蔡孟佳 牧師'];

const addStates = (m, sectionId, subgroupId) => ({
    ...m,
    _sourceSectionId: m._sourceSectionId || sectionId,
    _sourceSubgroupId: m._sourceSubgroupId || subgroupId,
    arriveState: false,
    groupState: false,
    mealState: false,
});

const cleanMember = m => {
    const copy = { ...m };
    RUNTIME_KEYS.forEach(k => delete copy[k]);
    return copy;
};

const isQinxuanSection = section =>
    section.id === QINXUAN_SECTION_ID || section.title === '青宣小組';

const isNonQinxuanSection = section =>
    section.id === NON_QINXUAN_SECTION_ID || section.title === '非青宣小組';

const isGeneratedSubgroup = subgroup =>
    subgroup._generated || subgroup.id?.endsWith(AUTO_MISSING_ID_SUFFIX);

const isChildrenSubgroupId = id => id === NON_QINXUAN_CHILDREN_ID;

export function addRuntimeStates(raw) {
    return {
        worshipTypes: raw.worshipTypes || DEFAULT_WORSHIP_TYPES,
        speakers:     raw.speakers     || DEFAULT_SPEAKERS,
        sections: raw.sections.map(section => ({
            ...section,
            subgroups: section.subgroups.map(sg => ({
                ...sg,
                members: sg.members.map(m => addStates(m, section.id, sg.id)),
            })),
        })),
    };
}

export function stripRuntimeStates(structure) {
    const sections = structure.sections.map(section => ({
            id: section.id,
            title: section.title,
            subgroups: section.subgroups
                .filter(sg => !isGeneratedSubgroup(sg))
                .map(sg => ({
                    id: sg.id,
                    title: sg.title,
                    members: [],
                })),
        }));

    const sectionById = new Map(sections.map(section => [section.id, section]));
    const subgroupByKey = new Map();
    for (const section of sections) {
        for (const subgroup of section.subgroups) {
            subgroupByKey.set(`${section.id}:${subgroup.id}`, subgroup);
        }
    }

    const findFallbackSubgroup = (section, member) => {
        if (!section) return null;
        if (isNonQinxuanSection(section)) {
            const fallbackId = isChildrenSubgroupId(member._sourceSubgroupId)
                ? NON_QINXUAN_CHILDREN_ID
                : member.gender === 'M'
                    ? NON_QINXUAN_BROTHERS_ID
                    : NON_QINXUAN_SISTERS_ID;
            return subgroupByKey.get(`${section.id}:${fallbackId}`) || section.subgroups[0] || null;
        }
        return section.subgroups[0] || null;
    };

    for (const section of structure.sections) {
        for (const subgroup of section.subgroups) {
            for (const member of subgroup.members) {
                const targetSectionId = member._sourceSectionId || section.id;
                const targetSubgroupId = member._sourceSubgroupId || subgroup.id;
                const targetSection = sectionById.get(targetSectionId) || sectionById.get(section.id);
                const targetSubgroup = subgroupByKey.get(`${targetSectionId}:${targetSubgroupId}`) ||
                    findFallbackSubgroup(targetSection, member);
                if (targetSubgroup) targetSubgroup.members.push(cleanMember(member));
            }
        }
    }

    return {
        worshipTypes: structure.worshipTypes || DEFAULT_WORSHIP_TYPES,
        speakers:     structure.speakers     || DEFAULT_SPEAKERS,
        sections,
    };
}

export function applyAttendanceBuckets(structure, records, months = 6) {
    const qinxuanSection = structure.sections.find(isQinxuanSection);
    const nonQinxuanSection = structure.sections.find(isNonQinxuanSection);
    if (!qinxuanSection || !nonQinxuanSection) return structure;

    const qinxuanMissing = [];
    const nonQinxuanBrothers = [];
    const nonQinxuanSisters = [];
    const nonQinxuanChildren = [];
    const nonQinxuanMissing = [];

    const compareByRecentAttendance = (a, b) =>
        b._attendanceCount - a._attendanceCount ||
        b._lastAttendanceDate.localeCompare(a._lastAttendanceDate) ||
        a.name.localeCompare(b.name, 'zh-Hant');

    const compareByLastAttendance = (a, b) =>
        b._lastAttendanceDate.localeCompare(a._lastAttendanceDate) ||
        a.name.localeCompare(b.name, 'zh-Hant');

    const withAttendanceStats = member => {
        const stats = getAttendanceStats(records, member.name, months);
        return {
            ...member,
            _attendanceCount: stats.recentCount,
            _lastAttendanceDate: stats.lastDate,
        };
    };

    const classifyNonQinxuan = member => {
        const next = withAttendanceStats(member);
        if (isChildrenSubgroupId(next._sourceSubgroupId)) {
            nonQinxuanChildren.push(next);
            return;
        }
        if (next._attendanceCount === 0) {
            nonQinxuanMissing.push(next);
            return;
        }
        if (next.gender === 'M') nonQinxuanBrothers.push(next);
        else nonQinxuanSisters.push(next);
    };

    const qinxuanSubgroups = qinxuanSection.subgroups
        .filter(sg => !isGeneratedSubgroup(sg))
        .map(sg => ({ ...sg, members: [] }));
    const qinxuanSubgroupById = new Map(qinxuanSubgroups.map(sg => [sg.id, sg]));

    for (const sg of qinxuanSection.subgroups) {
        for (const member of sg.members) {
            const next = { ...member };
            const attended = getAttendanceStats(records, next.name, months).recentCount > 0;
            if (attended) {
                const target = qinxuanSubgroupById.get(next._sourceSubgroupId) || qinxuanSubgroupById.get(sg.id);
                if (target) target.members.push(next);
                else qinxuanMissing.push(next);
            } else {
                qinxuanMissing.push(next);
            }
        }
    }

    for (const sg of nonQinxuanSection.subgroups) {
        for (const member of sg.members) classifyNonQinxuan(member);
    }

    nonQinxuanBrothers.sort(compareByRecentAttendance);
    nonQinxuanSisters.sort(compareByRecentAttendance);
    nonQinxuanMissing.sort(compareByLastAttendance);

    const nextSections = structure.sections.map(section => {
        if (isQinxuanSection(section)) {
            return {
                ...section,
                subgroups: [
                    ...qinxuanSubgroups,
                    {
                        id: `${section.id}${AUTO_MISSING_ID_SUFFIX}`,
                        title: AUTO_MISSING_TITLE,
                        _generated: true,
                        allowQuickAdd: false,
                        members: qinxuanMissing,
                    },
                ],
            };
        }

        if (isNonQinxuanSection(section)) {
            return {
                ...section,
                subgroups: [
                    { id: NON_QINXUAN_BROTHERS_ID, title: '弟兄', members: nonQinxuanBrothers },
                    { id: NON_QINXUAN_SISTERS_ID, title: '姊妹', members: nonQinxuanSisters },
                    { id: NON_QINXUAN_CHILDREN_ID, title: '兒童', members: nonQinxuanChildren },
                    {
                        id: `${section.id}${AUTO_MISSING_ID_SUFFIX}`,
                        title: AUTO_MISSING_TITLE,
                        _generated: true,
                        allowQuickAdd: false,
                        members: nonQinxuanMissing,
                    },
                ],
            };
        }

        return section;
    });

    return { ...structure, sections: nextSections };
}

export function structureToFamilies(structure) {
    const families = [];
    for (const section of structure.sections) {
        for (const sg of section.subgroups) {
            families.push({
                id: sg.id,
                title: sg.title,
                sectionId: section.id,
                members: sg.members,
            });
        }
    }
    return families;
}

export function genId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
