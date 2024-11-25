import { recordDbRef } from "../services/firebase";
import { set, get } from "firebase/database";
import { JSONS } from '../constants/AssetPaths';

function compareDate(a, b) {
    if (a.date < b.date) {
        return 1;
    }
    if (a.date > b.date) {
        return -1;
    }
    return 0;
}

function uploadWeeklyRecord(data) {
    let arrive = []
    let meal = []
    for (const family of data.families) {
        for (const member of family.members) {
            if (member.arriveState)
                arrive.push(member.name);
            if (member.mealState)
                meal.push(member.name);
        }
    }

    let newRecord = {
        "isExpanded": false,
        "date": data.date,
        "title": data.date + "  " + data.worship + "  出席人數" + arrive.length,
        "field": [
            {
                "key": "聚會內容",
                "value": data.worship
            },
            {
                "key": "講員",
                "value": data.speaker
            },
            {
                "key": "出席人數",
                "value": arrive.length
            },
            {
                "key": "出席名單",
                "value": arrive.join('、')
            },
            {
                "key": "用餐人數",
                "value": meal.length
            },
            {
                "key": "用餐名單",
                "value": meal.join('、')
            }
        ],
        "fullData": data
    };

    get(recordDbRef).then((snapshot) => {
        let dbRecords;
        if (snapshot.exists()) {
            console.log("Weekly records loaded.");
            dbRecords = snapshot.val();
        } else {
            console.log("No weekly records available, use empty array.");
            dbRecords = JSONS.RECORD_DEFAULT;
        }

        let record_date_existed = false;
        for (let i = 0; i < dbRecords.length; i++) {
            if (dbRecords[i].date === newRecord.date) {
                dbRecords[i] = newRecord;
                record_date_existed = true;
                break;
            }
        }
        if (!record_date_existed) {
            dbRecords.push(newRecord);
            dbRecords.sort(compareDate);
        }

        set(recordDbRef, dbRecords);
    }).catch((error) => {
        console.error(error);
    });
}


export default uploadWeeklyRecord