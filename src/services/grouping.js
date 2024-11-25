function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			let temp = array[i];
			array[i] = array[j];
			array[j] = temp;
	}
}

function startGrouping(formdata) {
    console.log("start_grouping2")
	let families = formdata.families;
    let groupsize =  parseInt(formdata.groupsize);
    let remainder =  parseInt(formdata.remainder);


    let male_leaders = [];
    let female_leaders = [];
    let male_attenders = [];
    let female_attenders = [];
    for (const family of families) {
        for (const member of family.members) {
            if (member.arriveState && member.groupState) {
                if (member.leader === 1) {
                    if (member.gender === "M")
                        male_leaders.push(member.name);
                    else
                        female_leaders.push(member.name);
                } else {
                    if (member.gender === "M")
                        male_attenders.push(member.name);
                    else
                        female_attenders.push(member.name);
                }
            }
        }
    }

    console.log("male_leaders: ", male_leaders);
    console.log("female_leaders: ", female_leaders);
    console.log("male_attenders: ", male_attenders);
    console.log("female_attenders: ", female_attenders);

	shuffle(male_leaders);
	shuffle(female_leaders);
	shuffle(male_attenders);
	shuffle(female_attenders);
	console.log("shuffled male_leaders", male_leaders);
	console.log("shuffled female_leaders", female_leaders);
	console.log("shuffled male_attenders", male_attenders);
	console.log("shuffled female_attenders", female_attenders);

    let all_people = male_leaders.concat(female_leaders, male_attenders, female_attenders);
	let people_num = all_people.length;
	let group_num = remainder === 0 ? Math.floor(people_num / groupsize) : Math.ceil(people_num / groupsize);
    if (group_num === 0)
        group_num = 1;
    let max_people_num = Math.ceil(people_num / group_num)
	console.log("all_people", all_people)
	console.log("people_num", people_num)
	console.log("group_num", group_num)

    // start grouping
	let group_title = [];
	let group_list = [];
	for (let i=0; i<group_num; i++) {
        group_title.push(String("第"+(i+1)+"組"))
		let group = []
        group.push(String("第"+(i+1)+"組"))
		for (let j=i; j<group_num*max_people_num; j+=group_num) {
            if (j < people_num) {
			    // group.push(String(all_people[j]) + "\n" + themes[theme][all_people[j] - 1]);				    group.push(String(all_people[j]) + "\n" + themes[theme][all_people[j] - 1]);			    group.push(String(all_people[j]) + "\n" + themes[theme][all_people[j] - 1]);
                group.push(all_people[j]);
            }
            else {
                group.push("");
            }
		}
		console.log(group)
		group_list.push(group);
	}
    console.log(group_title)
    console.log(group_list)

    let table_data = {
        title: "有意思分組*⸜( •ᴗ• )⸝*",
        tableHead: group_title,
        tableData: group_list,
        tableHeight: ["10%"].concat(Array(max_people_num).fill(String(90/max_people_num)+ "%")),
        fontsize: 18
    }

    return table_data
}
export default startGrouping