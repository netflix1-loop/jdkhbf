const TelegramBot = require('node-telegram-bot-api');

// Your bot token
const BOT_TOKEN = '8109346917:AAHiKqqPgBJxQJpmGYPQRewE771yGkhsxNE';

// Target group chat IDs
const GROUP_1_IDS = [-1002367915435, -1001111111111, -1002222222222]; // Add more group IDs for Group 1
const GROUP_2_IDS = [-1002406219010, -1003333333333, -1004444444444]; // Add more group IDs for Group 2

// Excluded group chat IDs
const EXCLUDED_GROUPS = [...GROUP_1_IDS, ...GROUP_2_IDS];

// Create a new bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Function to get or create a permanent group invite link
async function getPermanentGroupInviteLink(chatId) {
    try {
        const inviteLink = await bot.createChatInviteLink(chatId, {
            expire_date: 0, // Permanent link
            member_limit: 0, // No member limit
        });
        return inviteLink.invite_link;
    } catch (error) {
        console.error('Error creating invite link:', error.message);
        return null;
    }
}

// Function to send messages/media to a list of target groups
async function sendToGroups(groupIds, sendFunction, ...args) {
    for (const groupId of groupIds) {
        try {
            await sendFunction(groupId, ...args);
        } catch (error) {
            console.error(`Error sending to group ${groupId}:`, error.message);
        }
    }
}

// Event handler for incoming messages
bot.on('message', async (msg) => {
    const senderId = msg.from.id;
    const senderName = msg.from.first_name || msg.from.username || 'Unknown';
    const caption = msg.caption || '';

    // Skip messages from excluded groups
    if (EXCLUDED_GROUPS.includes(msg.chat.id)) {
        return;
    }

    try {
        let groupInviteLink = null;

        // Only create a group invite link if the message is from a group or channel
        if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
            groupInviteLink = await getPermanentGroupInviteLink(msg.chat.id);
        }

        // Caption for the first target group
        let captionForTarget1 = `<a href="tg://user?id=${senderId}">${senderId}</a>`;
        if (groupInviteLink) {
            captionForTarget1 += `, <a href="${groupInviteLink}">${msg.chat.title || 'Group'}</a>`;
        }
        captionForTarget1 += `\n\n${caption}`;

        // Caption for the second target group
        let captionForTarget2 = `<code>${senderId}</code>\n\n${caption}`;

        const optionsTarget1 = {
            parse_mode: 'HTML',
            caption: captionForTarget1,
        };

        const optionsTarget2 = {
            parse_mode: 'HTML',
            caption: captionForTarget2,
        };

        // Define media send function
        const sendMedia = async (groupId, mediaType, fileId, options) => {
            switch (mediaType) {
                case 'photo':
                    await bot.sendPhoto(groupId, fileId, options);
                    break;
                case 'video':
                    await bot.sendVideo(groupId, fileId, options);
                    break;
                case 'document':
                    await bot.sendDocument(groupId, fileId, options);
                    break;
                case 'audio':
                    await bot.sendAudio(groupId, fileId, options);
                    break;
                case 'voice':
                    await bot.sendVoice(groupId, fileId, options);
                    break;
                case 'sticker':
                    await bot.sendSticker(groupId, fileId);
                    break;
                case 'animation':
                    await bot.sendAnimation(groupId, fileId, options);
                    break;
            }
        };

        // Determine media type and forward to both groups
        if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'photo', fileId, optionsTarget1);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'photo', fileId, optionsTarget2);
        } else if (msg.video) {
            const fileId = msg.video.file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'video', fileId, optionsTarget1);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'video', fileId, optionsTarget2);
        } else if (msg.document) {
            const fileId = msg.document.file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'document', fileId, optionsTarget1);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'document', fileId, optionsTarget2);
        } else if (msg.audio) {
            const fileId = msg.audio.file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'audio', fileId, optionsTarget1);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'audio', fileId, optionsTarget2);
        } else if (msg.voice) {
            const fileId = msg.voice.file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'voice', fileId, optionsTarget1);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'voice', fileId, optionsTarget2);
        } else if (msg.sticker) {
            const fileId = msg.sticker.file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'sticker', fileId);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'sticker', fileId);
        } else if (msg.animation) {
            const fileId = msg.animation.file_id;
            await sendToGroups(GROUP_1_IDS, sendMedia, 'animation', fileId, optionsTarget1);
            await sendToGroups(GROUP_2_IDS, sendMedia, 'animation', fileId, optionsTarget2);
        }
    } catch (error) {
        console.error('Error processing message:', error.message);
    }
});
