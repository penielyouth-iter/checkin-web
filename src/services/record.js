import { recordDbRef } from "../services/firebase";
import { set, get } from "firebase/database";

function compareDate(a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
}

// Returns a Promise that resolves when the write to Firebase completes.
async function uploadWeeklyRecord(data) {
    const arrive = [];
    const meal = [];
    for (const family of data.families) {
        for (const member of family.members) {
            if (member.arriveState) arrive.push(member.name);
            if (member.mealState) meal.push(member.name);
        }
    }

    const newRecord = {
        isExpanded: false,
        date: data.date,
        title: `${data.date}  ${data.worship}  出席人數${arrive.length}`,
        field: [
            { key: '聚會內容', value: data.worship },
            { key: '講員',     value: data.speaker },
            { key: '出席人數', value: arrive.length },
            { key: '出席名單', value: arrive.join('、') },
            { key: '用餐人數', value: meal.length },
            { key: '用餐名單', value: meal.join('、') },
        ],
        fullData: data,
    };

    const snapshot = await get(recordDbRef);
    let dbRecords = snapshot.exists() ? snapshot.val() : [];

    const existingIdx = dbRecords.findIndex(r => r.date === newRecord.date);
    if (existingIdx >= 0) {
        dbRecords[existingIdx] = newRecord;
    } else {
        dbRecords.push(newRecord);
        dbRecords.sort(compareDate);
    }

    await set(recordDbRef, dbRecords);
}

export default uploadWeeklyRecord;
