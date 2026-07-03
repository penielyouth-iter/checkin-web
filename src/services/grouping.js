function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function startGrouping(formdata) {
    const families = formdata.families;
    const groupsize = parseInt(formdata.groupsize);
    const remainder = parseInt(formdata.remainder);

    if (!groupsize || groupsize <= 0) {
        return { tableData: [], tableHeight: [] };
    }

    const male_leaders = [];
    const female_leaders = [];
    const male_attenders = [];
    const female_attenders = [];

    for (const family of families) {
        for (const member of family.members) {
            if (member.arriveState && member.groupState) {
                if (member.leader === 1) {
                    if (member.gender === 'M') male_leaders.push(member.name);
                    else female_leaders.push(member.name);
                } else {
                    if (member.gender === 'M') male_attenders.push(member.name);
                    else female_attenders.push(member.name);
                }
            }
        }
    }

    shuffle(male_leaders);
    shuffle(female_leaders);
    shuffle(male_attenders);
    shuffle(female_attenders);

    const all_people = male_leaders.concat(female_leaders, male_attenders, female_attenders);
    const people_num = all_people.length;
    let group_num = remainder === 0
        ? Math.floor(people_num / groupsize)
        : Math.ceil(people_num / groupsize);
    if (group_num <= 0) group_num = 1;
    const max_people_num = Math.ceil(people_num / group_num);

    const group_list = [];
    for (let i = 0; i < group_num; i++) {
        const group = [`第${i + 1}組`];
        for (let j = i; j < group_num * max_people_num; j += group_num) {
            group.push(j < people_num ? all_people[j] : '');
        }
        group_list.push(group);
    }

    return {
        title: '有意思分組*⸜( •ᴗ• )⸝*',
        tableHead: group_list.map((_, i) => `第${i + 1}組`),
        tableData: group_list,
        tableHeight: ['10%'].concat(Array(max_people_num).fill(`${90 / max_people_num}%`)),
        fontsize: 18,
    };
}

export default startGrouping;
