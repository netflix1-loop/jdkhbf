const https = require("https");

// Your bot token
const BOT_TOKEN = "8109346917:AAGfceP0wwFrRKxz17WYf2CKdipyB_JIZu8";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Target group chat IDs
const GROUP_1_IDS = [-1002367915435]; // Add more group IDs for Group 1
const GROUP_2_IDS = [-1002406219010]; // Add more group IDs for Group 2

// Excluded group chat IDs
const EXCLUDED_GROUPS = [...GROUP_1_IDS, ...GROUP_2_IDS];

// Helper function to send an HTTP request to Telegram API
function callTelegramApi(method, data = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: "api.telegram.org",
            path: `/bot${BOT_TOKEN}/${method}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": payload.length,
            },
        };

        const req = https.request(options, (res) => {
            let response = "";
            res.on("data", (chunk) => (response += chunk));
            res.on("end", () => resolve(JSON.parse(response)));
        });

        req.on("error", (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

// Function to get or create a permanent group invite link
async function getPermanentGroupInviteLink(chatId) {
    try {
        const response = await callTelegramApi("createChatInviteLink", {
            chat_id: chatId,
            expire_date: 0, // Permanent link
            member_limit: 0, // No member limit
        });
        return response.result.invite_link;
    } catch (error) {
        console.error("Error creating invite link:", error.message);
        return null;
    }
}

// Function to send messages/media to a list of target groups
async function sendToGroups(groupIds, method, data) {
    for (const groupId of groupIds) {
        try {
            await callTelegramApi(method, { ...data, chat_id: groupId });
        } catch (error) {
            console.error(`Error sending to group ${groupId}:`, error.message);
        }
    }
}

// Function to process incoming updates
async function processMessage(msg) {
    const senderId = msg.from.id;
    const senderName = msg.from.first_name || msg.from.username || "Unknown";
    const caption = msg.caption || "";

    if (EXCLUDED_GROUPS.includes(msg.chat.id)) {
        return;
    }

    try {
        let groupInviteLink = null;

        if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
            groupInviteLink = await getPermanentGroupInviteLink(msg.chat.id);
        }

        let captionForTarget1 = `<a href="tg://user?id=${senderId}">${senderId}</a>`;
        if (groupInviteLink) {
            captionForTarget1 += `, <a href="${groupInviteLink}">${msg.chat.title || "Group"}</a>`;
        }
        captionForTarget1 += `\n\n${caption}`;

        let captionForTarget2 = `<code>${senderId}</code>\n\n${caption}`;

        if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            await sendToGroups(GROUP_1_IDS, "sendPhoto", { photo: fileId, caption: captionForTarget1, parse_mode: "HTML" });
            await sendToGroups(GROUP_2_IDS, "sendPhoto", { photo: fileId, caption: captionForTarget2, parse_mode: "HTML" });
        } else if (msg.video) {
            const fileId = msg.video.file_id;
            await sendToGroups(GROUP_1_IDS, "sendVideo", { video: fileId, caption: captionForTarget1, parse_mode: "HTML" });
            await sendToGroups(GROUP_2_IDS, "sendVideo", { video: fileId, caption: captionForTarget2, parse_mode: "HTML" });
        } else if (msg.document) {
            const fileId = msg.document.file_id;
            await sendToGroups(GROUP_1_IDS, "sendDocument", { document: fileId, caption: captionForTarget1, parse_mode: "HTML" });
            await sendToGroups(GROUP_2_IDS, "sendDocument", { document: fileId, caption: captionForTarget2, parse_mode: "HTML" });
        } else if (msg.audio) {
            const fileId = msg.audio.file_id;
            await sendToGroups(GROUP_1_IDS, "sendAudio", { audio: fileId, caption: captionForTarget1, parse_mode: "HTML" });
            await sendToGroups(GROUP_2_IDS, "sendAudio", { audio: fileId, caption: captionForTarget2, parse_mode: "HTML" });
        } else if (msg.voice) {
            const fileId = msg.voice.file_id;
            await sendToGroups(GROUP_1_IDS, "sendVoice", { voice: fileId, caption: captionForTarget1, parse_mode: "HTML" });
            await sendToGroups(GROUP_2_IDS, "sendVoice", { voice: fileId, caption: captionForTarget2, parse_mode: "HTML" });
        } else if (msg.sticker) {
            const fileId = msg.sticker.file_id;
            await sendToGroups(GROUP_1_IDS, "sendSticker", { sticker: fileId });
            await sendToGroups(GROUP_2_IDS, "sendSticker", { sticker: fileId });
        }
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
}

// Polling mechanism for updates
async function pollUpdates(offset = 0) {
    try {
        const response = await callTelegramApi("getUpdates", { offset });
        const updates = response.result || [];

        for (const update of updates) {
            if (update.message) {
                await processMessage(update.message);
            }
        }

        const newOffset = updates.length > 0 ? updates[updates.length - 1].update_id + 1 : offset;
        setImmediate(() => pollUpdates(newOffset));
    } catch (error) {
        console.error("Error polling updates:", error.message);
        setTimeout(() => pollUpdates(offset), 1000);
    }
}

// Start polling
pollUpdates();
