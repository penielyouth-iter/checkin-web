import { describe, expect, it } from 'vitest';
import { buildChildNameSet, createBlankReport, findReportAttendance } from './weeklyReportUtils';

describe('weeklyReportUtils', () => {
    it('finds the latest attendance record before the report date', () => {
        const report = createBlankReport(new Date('2026-05-30T00:00:00'));
        const records = [
            {
                date: '2026-05-30',
                field: [
                    { key: '出席人數', value: 99 },
                    { key: '兒童人數', value: 9 },
                ],
            },
            {
                date: '2026-05-23',
                field: [
                    { key: '出席人數', value: 20 },
                    { key: '兒童人數', value: 3 },
                ],
            },
            {
                date: '2026-05-09',
                field: [
                    { key: '出席人數', value: 11 },
                    { key: '兒童人數', value: 2 },
                ],
            },
        ];

        expect(findReportAttendance(records, report)).toEqual({
            total: 23,
            adult: 20,
            child: 3,
            date: '2026-05-23',
        });
    });

    it('returns empty attendance when there is no previous meeting record', () => {
        const report = createBlankReport(new Date('2026-05-30T00:00:00'));

        expect(findReportAttendance([{ date: '2026-05-30', field: [] }], report)).toEqual({
            total: 0,
            adult: 0,
            child: 0,
            date: '',
        });
    });

    it('prefers summarized field counts over legacy fullData grouping', () => {
        const report = createBlankReport(new Date('2026-05-30T00:00:00'));
        const records = [
            {
                date: '2026-05-23',
                field: [
                    { key: '出席人數', value: 24 },
                    { key: '兒童人數', value: 5 },
                ],
                fullData: {
                    families: [
                        {
                            id: 'legacy_group',
                            title: '讀入紀錄',
                            members: Array.from({ length: 29 }, (_, idx) => ({
                                name: `Member ${idx}`,
                                arriveState: true,
                            })),
                        },
                    ],
                },
            },
        ];

        expect(findReportAttendance(records, report)).toEqual({
            total: 29,
            adult: 24,
            child: 5,
            date: '2026-05-23',
        });
    });

    it('prefers adult and child name lists over legacy fullData grouping', () => {
        const report = createBlankReport(new Date('2026-05-30T00:00:00'));
        const records = [
            {
                date: '2026-05-23',
                field: [
                    { key: '出席名單', value: Array.from({ length: 24 }, (_, idx) => `Adult ${idx}`).join('、') },
                    { key: '兒童名單', value: Array.from({ length: 5 }, (_, idx) => `Child ${idx}`).join('、') },
                ],
                fullData: {
                    families: [
                        {
                            id: 'legacy_group',
                            title: '讀入紀錄',
                            members: Array.from({ length: 29 }, (_, idx) => ({
                                name: `Member ${idx}`,
                                arriveState: true,
                            })),
                        },
                    ],
                },
            },
        ];

        expect(findReportAttendance(records, report)).toEqual({
            total: 29,
            adult: 24,
            child: 5,
            date: '2026-05-23',
        });
    });

    it('infers child attendance from structure when legacy records only have one attendance list', () => {
        const report = createBlankReport(new Date('2026-05-30T00:00:00'));
        const childNameSet = buildChildNameSet({
            sections: [
                {
                    subgroups: [
                        {
                            id: 'sg_children',
                            title: '兒童',
                            members: [
                                { name: 'Child 1' },
                                { name: 'Child 2' },
                                { name: 'Child 3' },
                                { name: 'Child 4' },
                                { name: 'Child 5' },
                            ],
                        },
                    ],
                },
            ],
        });
        const records = [
            {
                date: '2026-05-23',
                field: [
                    {
                        key: '出席名單',
                        value: [
                            ...Array.from({ length: 24 }, (_, idx) => `Adult ${idx}`),
                            'Child 1',
                            'Child 2',
                            'Child 3',
                            'Child 4',
                            'Child 5',
                        ].join('、'),
                    },
                ],
                fullData: {
                    families: [
                        {
                            id: 'legacy_group',
                            title: '讀入紀錄',
                            members: Array.from({ length: 29 }, (_, idx) => ({
                                name: `Member ${idx}`,
                                arriveState: true,
                            })),
                        },
                    ],
                },
            },
        ];

        expect(findReportAttendance(records, report, childNameSet)).toEqual({
            total: 29,
            adult: 24,
            child: 5,
            date: '2026-05-23',
        });
    });
});
