import { recordDbRef } from "../services/firebase";
import { set, get } from "firebase/database";

function compareDate(a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
}

async function uploadWeeklyRecord(data) {
    const arrive = [], arriveChildren = [], meal = [];

    for (const family of data.families) {
        const isChildrenFamily = family.id === 'sg_children' || family.title === '兒童';
        for (const member of family.members) {
            if (member.arriveState) {
                if (isChildrenFamily) arriveChildren.push(member.name);
                else arrive.push(member.name);
            }
            if (member.mealState) meal.push(member.name);
        }
    }

    const newRecord = {
        isExpanded: false,
        date: data.date,
        title: `${data.date}  ${data.worship}  大人${arrive.length}人 兒童${arriveChildren.length}人`,
        field: [
            { key: '聚會內容', value: data.worship },
            { key: '講員',     value: data.speaker },
            { key: '出席人數', value: arrive.length },
            { key: '出席名單', value: arrive.join('、') },
            { key: '兒童人數', value: arriveChildren.length },
            { key: '兒童名單', value: arriveChildren.join('、') },
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
