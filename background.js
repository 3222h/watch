// Helpers
function createTab(url) {
    return new Promise(resolve => chrome.tabs.create({ url }, resolve));
}
function updateTab(tabId, updateProps) {
    return new Promise(resolve => chrome.tabs.update(tabId, updateProps, resolve));
}
function storageSet(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
}
function storageGet(key) {
    return new Promise(resolve => chrome.storage.local.get(key, resolve));
}

async function readLinkFile() {
    try {
        const url = chrome.runtime.getURL("link.txt");
        const r = await fetch(url);
        const txt = await r.text();
        return txt.trim();
    } catch (e) {
        console.error("Error reading link.txt:", e);
        return "";
    }
}

function parseLinkLine(line) {
    const parts = line.split(":");
    if (parts.length < 2) return null;
    const minutes = parseInt(parts.pop().trim(), 10);
    const url = parts.join(":").trim();
    if (!url || isNaN(minutes)) return null;
    return { videoUrl: url, minutes };
}

async function startCycle() {
    console.log("Starting cycle: opening YouTube Shorts...");
    const shortsTab = await createTab("https://www.youtube.com/shorts");
    await new Promise(r => setTimeout(r, 4000)); // wait for Shorts to load

    const line = await readLinkFile();
    const parsed = parseLinkLine(line);
    if (!parsed) {
        console.error("Invalid link.txt format. Expected: <url>:<minutes>");
        return;
    }

    const T = parsed.minutes;
    const waitMinutes = Math.floor(T / 2) + 5; // shorts wait time
    const playMinutes = T; // special video play time

    console.log(`Will wait ${waitMinutes} minutes on Shorts, then play for ${playMinutes} minutes.`);

    await storageSet({
        playbackState: {
            tabId: shortsTab.id,
            videoUrl: parsed.videoUrl,
            playMinutes
        }
    });

    chrome.alarms.create("playSpecial", { delayInMinutes: waitMinutes });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    const data = await storageGet("playbackState");
    const state = data.playbackState || {};
    const tabId = state.tabId;
    const videoUrl = state.videoUrl;
    const playMinutes = state.playMinutes || 1;

    if (alarm.name === "playSpecial") {
        console.log("Opening special video:", videoUrl);
        try {
            if (typeof tabId === "number") {
                await updateTab(tabId, { url: videoUrl });
            } else {
                const newTab = await createTab(videoUrl);
                await storageSet({ playbackState: { ...state, tabId: newTab.id } });
            }
        } catch {
            const newTab = await createTab(videoUrl);
            await storageSet({ playbackState: { ...state, tabId: newTab.id } });
        }
        chrome.alarms.create("returnShorts", { delayInMinutes: playMinutes });
    }

    if (alarm.name === "returnShorts") {
        console.log("Returning to Shorts...");
        try {
            if (typeof tabId === "number") {
                await updateTab(tabId, { url: "https://www.youtube.com/shorts" });
            } else {
                await createTab("https://www.youtube.com/shorts");
            }
        } catch {
            await createTab("https://www.youtube.com/shorts");
        }
        chrome.storage.local.remove("playbackState");
    }
});

chrome.runtime.onInstalled.addListener(startCycle);
chrome.runtime.onStartup.addListener(startCycle);
