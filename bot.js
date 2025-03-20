const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Bot tokeningizni shu yerga yozing
const token = '8001151305:AAHWxW5I7nGr-aBWM396gLsOLQMH9B84tD4';
const targetBotToken = '7938960342:AAEL6f5uvVzfx99xj56sJhOuv7NRG2l2y_Y'; // Ma'lumot yuboriladigan bot tokeni
const targetChatId = '6525277828'; // Admin yoki manager chat ID

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchi bosqichlarini saqlash
let userSteps = {};
let userData = {};

const courses = [
    ["🇬🇧 Ingliz tili", "🇷🇺 Rus tili", "🇸🇦 Arab tili"],
    ["💊 Farmosevtika", "🏥 Uy Hamshiraligi"],
    ["🧬 Biologiya", "🧪 Kimyo", "🧮 Matematika"],
    ["⚛️ Fizika", "💆‍♂️ Tibbiy massaj"]
];

// Start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userSteps[chatId] = 'choosing_course';

    bot.sendMessage(chatId, "🎓 *Fotimabonu O'quv markaziga xush kelibsiz!* 🎓\n\n📚 Qaysi kursga qiziqasiz?", {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: courses,
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// Xabarlarni qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userSteps[chatId] === 'choosing_course' && text !== "/start") {
        userSteps[chatId] = 'asking_name';
        userData[chatId] = { kurs: text, sana: new Date().toLocaleString() };
        bot.sendMessage(chatId, `✅ Siz *${text}* kursini tanladingiz!\n👤 Iltimos, ismingizni kiriting.`, { parse_mode: 'Markdown' });

    } else if (userSteps[chatId] === 'asking_name') {
        userSteps[chatId] = 'asking_phone';
        userData[chatId].ism = text;
        bot.sendMessage(chatId, `👍 Rahmat, *${text}*!\n📞 Endi telefon raqamingizni yuboring.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [[{ text: "📞 Telefon raqamni yuborish", request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });

    } else if (msg.contact) {
        userData[chatId].telefon = msg.contact.phone_number;
        
        bot.sendMessage(chatId, "✅ *Ma'lumotlaringiz qabul qilindi!* \n☎️ Tez orada siz bilan bog'lanamiz.", {
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true }
        });

        // Ma'lumotlarni boshqa botga yuborish
        const message = `📌 *Yangi ro'yxatga olish*\n\n📅 *Sana:* ${userData[chatId].sana}\n📚 *Kurs:* ${userData[chatId].kurs}\n👤 *Ism:* ${userData[chatId].ism}\n📞 *Telefon:* ${userData[chatId].telefon}`;

        axios.post(`https://api.telegram.org/bot${targetBotToken}/sendMessage`, {
            chat_id: targetChatId,
            text: message,
            parse_mode: 'Markdown'
        }).catch(err => console.error('Xatolik:', err));

        // Tozalash
        delete userSteps[chatId];
        delete userData[chatId];
    }
});
