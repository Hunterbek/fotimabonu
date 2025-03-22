const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Bot tokeningizni shu yerga yozing
const token = '8001151305:AAHDj_kchLyOcWzrnaBbx8UfMzyyhIyEyb0';
const targetBotToken = '7938960342:AAGKUdMU4j5QN34NU26jCkN_be2QGq1DUKI'; // Ma'lumot yuboriladigan bot tokeni
const targetChatId = '6525277828'; // Admin yoki manager chat ID

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchi bosqichlarini saqlash
let userSteps = {};
let userData = {};
let registrationCount = 1000; // Ro'yxatga olishni 1001 dan boshlaymiz

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
        registrationCount++; // Yangi ro‘yxat raqamini oshiramiz
        userData[chatId] = { 
            ro‘yxatRaqami: `#${registrationCount}`, 
            kurs: text, 
            sana: new Date().toLocaleString() 
        };
        bot.sendMessage(chatId, `✅ Siz *${text}* kursini tanladingiz!\n👤 Iltimos, ismingizni kiriting.`, { parse_mode: 'Markdown' });

    } else if (userSteps[chatId] === 'asking_name') {
        userSteps[chatId] = 'asking_surname';
        userData[chatId].ism = text;
        bot.sendMessage(chatId, `👍 Rahmat, *${text}*!\n📛 Endi familiyangizni kiriting.`, { parse_mode: 'Markdown' });

    } else if (userSteps[chatId] === 'asking_surname') {
        userSteps[chatId] = 'asking_birth_year';
        userData[chatId].familiya = text;
        bot.sendMessage(chatId, `📝 Ajoyib, *${text}*! 🗓 Tug‘ilgan yilingizni kiriting (masalan, 2001).`, { parse_mode: 'Markdown' });

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
        
        bot.sendMessage(chatId, `✅ *Ma'lumotlaringiz qabul qilindi!* \n📌 Sizning ro‘yxat raqamingiz: *${userData[chatId].ro‘yxatRaqami}* \n☎️ Tez orada siz bilan bog'lanamiz.`, {
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true }
        });

        // Ma'lumotlarni boshqa botga yuborish
        const message = `📌 *Yangi ro'yxatga olish*\n\n🔢 *Ro‘yxat raqami:* ${userData[chatId].ro‘yxatRaqami}\n📅 *Sana:* ${userData[chatId].sana}\n📚 *Kurs:* ${userData[chatId].kurs}\n👤 *Ism:* ${userData[chatId].ism}\n📛 *Familiya:* ${userData[chatId].familiya}\n🎂 *Tug‘ilgan yil:* ${userData[chatId].tugilganYil}\n📞 *Telefon:* ${userData[chatId].telefon}`;

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
