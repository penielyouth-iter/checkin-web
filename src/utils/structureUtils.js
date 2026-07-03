const RUNTIME_KEYS = ['arriveState', 'groupState', 'mealState', '_attendanceCount'];

const addStates = m => ({
    ...m,
    arriveState: false,
    groupState: false,
    mealState: false,
});

// Augment a raw structure (from Firebase / JSON) with runtime check-in states
export function addRuntimeStates(raw) {
    return {
        counselors: raw.counselors.map(addStates),
        qinxuan: {
            subgroups: raw.qinxuan.subgroups.map(sg => ({
                ...sg,
                members: sg.members.map(addStates),
            })),
        },
        nonQinxuan: {
            brothers: raw.nonQinxuan.brothers.map(addStates),
            sisters: raw.nonQinxuan.sisters.map(addStates),
        },
    };
}

// Strip runtime states before saving to Firebase
export function stripRuntimeStates(structure) {
    const clean = m => {
        const copy = { ...m };
        RUNTIME_KEYS.forEach(k => delete copy[k]);
        return copy;
    };
    return {
        counselors: structure.counselors.map(clean),
        qinxuan: {
            subgroups: structure.qinxuan.subgroups.map(sg => ({
                id: sg.id,
                title: sg.title,
                members: sg.members.map(clean),
            })),
        },
        nonQinxuan: {
            brothers: structure.nonQinxuan.brothers.map(clean),
            sisters: structure.nonQinxuan.sisters.map(clean),
        },
    };
}

// Convert new structure to old "families" format for grouping/record services
export function structureToFamilies(structure) {
    const families = [
        { title: '輔導', members: structure.counselors },
        ...structure.qinxuan.subgroups.map(sg => ({ title: sg.title, members: sg.members })),
        { title: '弟兄', members: structure.nonQinxuan.brothers },
        { title: '姊妹', members: structure.nonQinxuan.sisters },
    ];
    return families;
}

// Generate a unique ID for new admin-created items
export function genId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
