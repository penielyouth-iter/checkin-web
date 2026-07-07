import { child, get, remove, update } from 'firebase/database';
import { recordDbRef, structureDbRef, weeklyReportsDbRef } from './firebase';
import { JSONS } from '../constants/AssetPaths';
import {
    buildChildNameSet,
    createBlankReport,
    findReportAttendance,
    hasWeeklyReportContent,
    mergeReportWithDefault,
    parseReportIdToDate,
    reportSortDesc,
} from '../utils/weeklyReportUtils';

export const fetchWeeklyReports = async () => {
    const [reportSnapshot, recordSnapshot, structureSnapshot] = await Promise.all([
        get(weeklyReportsDbRef),
        get(recordDbRef),
        get(structureDbRef),
    ]);
    if (!reportSnapshot.exists()) return [];
    const value = reportSnapshot.val();
    const records = recordSnapshot.exists() && Array.isArray(recordSnapshot.val())
        ? recordSnapshot.val()
        : JSONS.RECORD_DEFAULT;
    const childNameSet = buildChildNameSet(
        structureSnapshot.exists() ? structureSnapshot.val() : JSONS.STRUCTURE_DEFAULT
    );
    return Object.values(value || {})
        .filter(hasWeeklyReportContent)
        .map(report => {
            const merged = mergeReportWithDefault(report);
            return {
                ...merged,
                attendance: findReportAttendance(records, merged, childNameSet),
            };
        })
        .sort(reportSortDesc);
};

export const fetchWeeklyReport = async id => {
    const snapshot = await get(child(weeklyReportsDbRef, id));
    if (snapshot.exists()) return mergeReportWithDefault(snapshot.val());
    return createBlankReport(parseReportIdToDate(id));
};

export const saveWeeklyReportSection = async (id, patch) => {
    await update(child(weeklyReportsDbRef, id), {
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
    });
};

export const deleteWeeklyReport = async id => {
    await remove(child(weeklyReportsDbRef, id));
};

export const fetchReportAttendance = async report => {
    const [recordSnapshot, structureSnapshot] = await Promise.all([
        get(recordDbRef),
        get(structureDbRef),
    ]);
    const records = recordSnapshot.exists() && Array.isArray(recordSnapshot.val())
        ? recordSnapshot.val()
        : JSONS.RECORD_DEFAULT;
    const childNameSet = buildChildNameSet(
        structureSnapshot.exists() ? structureSnapshot.val() : JSONS.STRUCTURE_DEFAULT
    );
    return findReportAttendance(records, report, childNameSet);
};
