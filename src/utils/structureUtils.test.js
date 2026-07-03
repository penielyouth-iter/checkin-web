import { describe, expect, it } from 'vitest';
import { addRuntimeStates, applyAttendanceBuckets, stripRuntimeStates, structureToFamilies } from './structureUtils';

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

const rawStructure = {
    worshipTypes: ['主日'],
    speakers: ['講員 A'],
    sections: [
        {
            id: 'section-1',
            title: '小組',
            subgroups: [
                {
                    id: 'subgroup-1',
                    title: '一小家',
                    members: [
                        { name: 'Alice', gender: 'F', leader: 1 },
                        { name: 'Bob', gender: 'M', leader: 0 },
                    ],
                },
            ],
        },
    ],
};

describe('structureUtils', () => {
    it('adds runtime check-in states to every member', () => {
        const structure = addRuntimeStates(rawStructure);

        expect(structure.sections[0].subgroups[0].members).toMatchObject([
            { name: 'Alice', gender: 'F', leader: 1, arriveState: false, groupState: false, mealState: false },
            { name: 'Bob', gender: 'M', leader: 0, arriveState: false, groupState: false, mealState: false },
        ]);
    });

    it('strips runtime states before saving', () => {
        const structure = addRuntimeStates(rawStructure);
        structure.sections[0].subgroups[0].members[0].arriveState = true;
        structure.sections[0].subgroups[0].members[0]._attendanceCount = 3;

        expect(stripRuntimeStates(structure)).toEqual(rawStructure);
    });

    it('flattens sections into grouping families', () => {
        const structure = addRuntimeStates(rawStructure);

        expect(structureToFamilies(structure)).toEqual([
            {
                id: 'subgroup-1',
                title: '一小家',
                sectionId: 'section-1',
                members: structure.sections[0].subgroups[0].members,
            },
        ]);
    });

    it('auto-buckets long-absent members and children after loading records', () => {
        const structure = addRuntimeStates({
            worshipTypes: ['主日'],
            speakers: ['講員 A'],
            sections: [
                {
                    id: 'section_qinxuan',
                    title: '青宣小組',
                    subgroups: [
                        {
                            id: 'sg_q1',
                            title: '青宣一小家',
                            members: [
                                { name: 'Active Youth', gender: 'F', leader: 0 },
                                { name: 'Missing Youth', gender: 'M', leader: 0 },
                            ],
                        },
                    ],
                },
                {
                    id: 'section_nonqinxuan',
                    title: '非青宣小組',
                    subgroups: [
                        {
                            id: 'sg_brothers',
                            title: '弟兄',
                            members: [
                                { name: 'Active Brother', gender: 'M', leader: 0 },
                                { name: 'More Active Brother', gender: 'M', leader: 0 },
                            ],
                        },
                        {
                            id: 'sg_sisters',
                            title: '姊妹',
                            members: [
                                { name: 'Active Sister', gender: 'F', leader: 0 },
                                { name: 'Recent Missing Non Youth', gender: 'F', leader: 0 },
                                { name: 'Missing Non Youth', gender: 'F', leader: 0 },
                            ],
                        },
                        {
                            id: 'sg_children',
                            title: '兒童',
                            members: [
                                { name: 'Youth Child', gender: 'F', leader: 0 },
                                { name: 'Active Child', gender: 'M', leader: 0 },
                                { name: 'Missing Child', gender: 'F', leader: 0 },
                            ],
                        },
                    ],
                },
            ],
        });

        const records = [
            {
                date: monthsAgo(1),
                field: [
                    { key: '出席名單', value: 'Active Youth、Active Brother、More Active Brother、Active Sister' },
                    { key: '兒童名單', value: 'Youth Child、Active Child' },
                ],
            },
            {
                date: monthsAgo(2),
                field: [
                    { key: '出席名單', value: 'More Active Brother' },
                ],
            },
            {
                date: monthsAgo(7),
                field: [
                    { key: '出席名單', value: 'Recent Missing Non Youth' },
                ],
            },
            {
                date: monthsAgo(12),
                field: [
                    { key: '出席名單', value: 'Missing Non Youth' },
                ],
            },
        ];

        const bucketed = applyAttendanceBuckets(structure, records, 6);
        const qinxuan = bucketed.sections.find(s => s.id === 'section_qinxuan');
        const nonQinxuan = bucketed.sections.find(s => s.id === 'section_nonqinxuan');

        expect(qinxuan.subgroups.find(sg => sg.title === '青宣一小家').members.map(m => m.name))
            .toEqual(['Active Youth']);
        expect(qinxuan.subgroups.find(sg => sg.title === '半年以上未出席').members.map(m => m.name))
            .toEqual(['Missing Youth']);
        expect(nonQinxuan.subgroups).toHaveLength(4);
        expect(nonQinxuan.subgroups.find(sg => sg.title === '弟兄').members.map(m => m.name))
            .toEqual(['More Active Brother', 'Active Brother']);
        expect(nonQinxuan.subgroups.find(sg => sg.title === '姊妹').members.map(m => m.name))
            .toEqual(['Active Sister']);
        expect(nonQinxuan.subgroups.find(sg => sg.title === '兒童').members.map(m => m.name))
            .toEqual(['Youth Child', 'Active Child', 'Missing Child']);
        expect(nonQinxuan.subgroups.find(sg => sg.title === '半年以上未出席').members.map(m => m.name))
            .toEqual(['Recent Missing Non Youth', 'Missing Non Youth']);
    });

    it('does not persist generated missing subgroups when stripping runtime state', () => {
        const raw = {
            worshipTypes: ['主日'],
            speakers: ['講員 A'],
            sections: [
                {
                    id: 'section_qinxuan',
                    title: '青宣小組',
                    subgroups: [
                        {
                            id: 'sg_q1',
                            title: '青宣一小家',
                            members: [
                                { name: 'Missing Youth', gender: 'M', leader: 0 },
                            ],
                        },
                    ],
                },
                {
                    id: 'section_nonqinxuan',
                    title: '非青宣小組',
                    subgroups: [
                        { id: 'sg_brothers', title: '弟兄', members: [] },
                        { id: 'sg_sisters', title: '姊妹', members: [] },
                        { id: 'sg_children', title: '兒童', members: [] },
                    ],
                },
            ],
        };

        const bucketed = applyAttendanceBuckets(addRuntimeStates(raw), [], 6);

        expect(stripRuntimeStates(bucketed)).toEqual(raw);
    });
});
