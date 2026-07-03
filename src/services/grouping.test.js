import { describe, expect, it, vi } from 'vitest';
import startGrouping from './grouping';

describe('startGrouping', () => {
    it('returns an empty table for invalid group size', () => {
        expect(startGrouping({ families: [], groupsize: '0', remainder: 0 })).toEqual({
            tableData: [],
            tableHeight: [],
        });
    });

    it('groups only arrived members selected for grouping', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const result = startGrouping({
            groupsize: '2',
            remainder: 1,
            families: [
                {
                    title: '一小家',
                    members: [
                        { name: 'Leader M', gender: 'M', leader: 1, arriveState: true, groupState: true },
                        { name: 'Leader F', gender: 'F', leader: 1, arriveState: true, groupState: true },
                        { name: 'Member M', gender: 'M', leader: 0, arriveState: true, groupState: true },
                        { name: 'No Group', gender: 'F', leader: 0, arriveState: true, groupState: false },
                        { name: 'Absent', gender: 'M', leader: 0, arriveState: false, groupState: true },
                    ],
                },
            ],
        });

        const groupedNames = result.tableData.flat().filter(cell => !cell.startsWith('第') && cell !== '');

        expect(groupedNames).toHaveLength(3);
        expect(groupedNames).toEqual(expect.arrayContaining(['Leader M', 'Leader F', 'Member M']));
        expect(groupedNames).not.toContain('No Group');
        expect(groupedNames).not.toContain('Absent');

        Math.random.mockRestore();
    });
});
