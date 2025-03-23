const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const moment = require('moment');

// Bot tokenlari
const token = '8001151305:AAE2KeaisDoEMX7seMAb2Ab26eojhC0MR7s';
const targetBotToken = '7938960342:AAGgKbvA0baMHfLIIdoBICUGiZr2pBrqSKI'; 
const targetChatId = '6525277828'; 

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchilar ma'lumotlari
let userSteps = {};
let userData = {};
let registrationCount = 1;
let currentMonth = moment().format("YYYY-MM");

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userSteps[chatId] = 'choosing_course';

    bot.sendMessage(chatId, "🎓 *Fotimabonu O'quv markaziga xush kelibsiz!*\n\n📚 Qaysi kursga qiziqasiz?", {
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
        userData[chatId] = { kurs: text, sana: moment().format('YYYY-MM-DD HH:mm') };
        bot.sendMessage(chatId, `✅ Siz *${text}* kursini tanladingiz!\n👤 Iltimos, ismingizni kiriting.`, { parse_mode: 'Markdown' });
    }
    else if (userSteps[chatId] === 'asking_name') {
        userSteps[chatId] = 'asking_surname';
        userData[chatId].ism = text;
        bot.sendMessage(chatId, `📛 Endi familiyangizni kiriting.`);
    }
    else if (userSteps[chatId] === 'asking_surname') {
        userSteps[chatId] = 'asking_birth_year';
        userData[chatId].familiya = text;
        bot.sendMessage(chatId, `🗓 Tug‘ilgan yilingizni kiriting (masalan, 2001).`);
    }
    else if (userSteps[chatId] === 'asking_birth_year') {
        if (!/^[0-9]{4}$/.test(text)) {
            bot.sendMessage(chatId, "⚠️ Tug‘ilgan yilingizni to‘g‘ri kiriting (masalan, 2001).")
            return;
        }
        userSteps[chatId] = 'asking_telegram_profile';
        userData[chatId].tugilganYil = text;
        
        bot.sendMessage(chatId, "📎 Iltimos, Telegram profilingizni yuboring.", {
            reply_markup: {
                keyboard: [[{ text: "📎 Telegram profilni yuborish", request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
    else if (msg.contact) {
        if (moment().format("YYYY-MM") !== currentMonth) {
            registrationCount = 1;
            currentMonth = moment().format("YYYY-MM");
        }

        userData[chatId].telefon = msg.contact.phone_number;
        userData[chatId].royxatRaqami = `${currentMonth}-#${String(registrationCount).padStart(3, '0')}`;
        registrationCount++;

        bot.sendMessage(chatId, `✅ *Ma'lumotlaringiz qabul qilindi!* \n📌 Sizning ro‘yxat raqamingiz: *${userData[chatId].royxatRaqami}* \n☎️ Tez orada siz bilan bog'lanamiz.`, {
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true }
        });

        const message = `📌 *Yangi ro'yxatga olish*\n\n🔢 *Ro‘yxat raqami:* ${userData[chatId].royxatRaqami}\n📅 *Sana:* ${userData[chatId].sana}\n📚 *Kurs:* ${userData[chatId].kurs}\n👤 *Ism:* ${userData[chatId].ism}\n📛 *Familiya:* ${userData[chatId].familiya}\n🎂 *Tug‘ilgan yil:* ${userData[chatId].tugilganYil}\n📞 *Telefon:* ${userData[chatId].telefon}`;

        axios.post(`https://api.telegram.org/bot${targetBotToken}/sendMessage`, {
            chat_id: targetChatId,
            text: message,
            parse_mode: 'Markdown'
        }).then(response => {
            console.log("✅ Xabar yuborildi:", response.data);
        }).catch(err => {
            console.error("❌ Xatolik yuz berdi:", err.response ? err.response.data : err.message);
        });

        delete userSteps[chatId];
        delete userData[chatId];
    }
});
