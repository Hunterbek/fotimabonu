const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Bot tokenlari
const token = '8001151305:AAE2KeaisDoEMX7seMAb2Ab26eojhC0MR7s';
const targetBotToken = '7938960342:AAGK22pwtfeBq7YdoangN6Xb7yJUrRc1-q4'; // Ma'lumot yuboriladigan bot tokeni
const targetChatId = ' 6525277828'; // Admin yoki manager chat ID

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchi bosqichlarini saqlash
let userSteps = {};
let userData = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userSteps[chatId] = 'choosing_course';

    bot.sendMessage(chatId, "🎓 *Fotimabonu O'quv markaziga xush kelibsiz!* 🎓\n\n📚 Qaysi kursga qiziqasiz?", {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [["🇬🇧 Ingliz tili", "🇷🇺 Rus tili", "🇸🇦 Arab tili"], ["💊 Farmosevtika", "🏥 Uy Hamshiraligi"], ["🧬 Biologiya", "🧪 Kimyo", "🧮 Matematika"], ["⚛️ Fizika", "💆‍♂️ Tibbiy massaj"]],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userSteps[chatId] === 'choosing_course' && text !== "/start") {
        userSteps[chatId] = 'asking_name';
        userData[chatId] = { 
            kurs: text, 
            sana: new Date().toLocaleString() 
        };
        bot.sendMessage(chatId, `✅ Siz *${text}* kursini tanladingiz!\n👤 Iltimos, ismingizni kiriting.`, { parse_mode: 'Markdown' });

    } else if (userSteps[chatId] === 'asking_name') {
        userSteps[chatId] = 'asking_surname';
        userData[chatId].ism = text;
        bot.sendMessage(chatId, `📛 Endi familiyangizni kiriting.`, { parse_mode: 'Markdown' });

    } else if (userSteps[chatId] === 'asking_surname') {
        userSteps[chatId] = 'asking_birth_year';
        userData[chatId].familiya = text;
        bot.sendMessage(chatId, `🗓 Tug‘ilgan yilingizni kiriting (masalan, 2001).`, { parse_mode: 'Markdown' });

    } else if (userSteps[chatId] === 'asking_birth_year') {
        if (!/^\d{4}$/.test(text) || parseInt(text) < 1900 || parseInt(text) > new Date().getFullYear()) {
            bot.sendMessage(chatId, "⚠️ Iltimos, tug‘ilgan yilingizni to‘g‘ri formatda kiriting (masalan, 2001).");
            return;
        }
        userSteps[chatId] = 'asking_phone';
        userData[chatId].tugilganYil = text;
        bot.sendMessage(chatId, `📞 Endi telefon raqamingizni yuboring.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [[{ text: "📞 Telefon raqamni yuborish", request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });

    } else if (msg.contact) {
        userData[chatId].telefon = msg.contact.phone_number;
        
        bot.sendMessage(chatId, `✅ *Ma'lumotlaringiz qabul qilindi!* \n☎️ Tez orada siz bilan bog'lanamiz.`, {
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true }
        });

        // Ma'lumotlarni boshqa botga yuborish
        const message = `📌 *Yangi ro'yxatga olish*\n\n📅 *Sana:* ${userData[chatId].sana}\n📚 *Kurs:* ${userData[chatId].kurs}\n👤 *Ism:* ${userData[chatId].ism}\n📛 *Familiya:* ${userData[chatId].familiya}\n🎂 *Tug‘ilgan yil:* ${userData[chatId].tugilganYil}\n📞 *Telefon:* ${userData[chatId].telefon}`;

        axios.post(`https://api.telegram.org/bot${targetBotToken}/sendMessage`, {
            chat_id: targetChatId,
            text: message,
            parse_mode: 'Markdown'
        }).then(response => {
            console.log("✅ Xabar yuborildi:", response.data);
        }).catch(err => {
            console.error("❌ Xatolik yuz berdi:", err.response ? err.response.data : err.message);
        });

        // Tozalash
        delete userSteps[chatId];
        delete userData[chatId];
    }
});
