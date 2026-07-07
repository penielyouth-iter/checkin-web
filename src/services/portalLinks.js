import { get, set } from 'firebase/database';
import { portalLinksDbRef } from './firebase';

export const DEFAULT_PORTAL_LINKS = {
    currentSeasonServing: 'https://docs.google.com/spreadsheets/d/1E4zF8ikU2aM89FbUAKop_lPCM6Rrn8EHXC4iSgz4B8I/edit?gid=0#gid=0',
    nextSeasonServing: '',
};

export const fetchPortalLinks = async () => {
    const snapshot = await get(portalLinksDbRef);
    if (!snapshot.exists()) return DEFAULT_PORTAL_LINKS;
    return {
        ...DEFAULT_PORTAL_LINKS,
        ...(snapshot.val() || {}),
    };
};

export const savePortalLinks = async links => {
    await set(portalLinksDbRef, {
        ...DEFAULT_PORTAL_LINKS,
        ...links,
    });
};
