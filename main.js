const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios");
const { google } = require('googleapis');
const fs = require('fs');
const { OpenAI } = require('openai');

const settings = JSON.parse(fs.readFileSync('key.json'));
const openaiApiKey = settings.keyopenai;
const token= settings.token;
const googleApiKey = settings.googleApiKey;
const searchEngineId = settings.searchEngineId;
const daniApi = settings.daniApi;
const customSearch = google.customsearch('v1');
const options = {
    polling: true
}

const konatabot = new TelegramBot(token, options)

const prefix = "/"
const sayHi = new RegExp(`^${prefix}halo$`)
const gempa = new RegExp(`^${prefix}gempa$`)
const anime = new RegExp(`^${prefix}anime (.+)$`);
const karakter = new RegExp(`^${prefix}karakter (.+)$`);
const gambar = new RegExp(`^${prefix}gambar (.+)$`);
const konata = new RegExp(`^${prefix}konata (.+)$`);
const tebakanime = new RegExp(`^${prefix}tebakanime$`);
const tebakanimeJawab = new RegExp(`^${prefix}tebakanime (.+)$`);
const tebakanimeHelp = new RegExp(`^${prefix}tebakanime-help$`);
const tebakanimeNext = new RegExp(`^${prefix}tebakanime-next$`);

konatabot.onText(sayHi, (callback) => {
    konatabot.sendMessage(callback.from.id, "Halo Juga")
})

konatabot.onText(gempa, async(callback) => {
    const BMKG_ENDPOINT = "https://data.bmkg.go.id/DataMKG/TEWS/"
    

    const apiCall = await fetch(BMKG_ENDPOINT + "autogempa.json")
    const {Infogempa: {gempa: {Jam, Magnitude, Tanggal, Wilayah, Potensi, Kedalaman, Shakemap} } } = await apiCall.json()
    const BMKGImage = BMKG_ENDPOINT + Shakemap

    const resultText = `
Waktu:${Tanggal} | ${Jam}
Besaran: ${Magnitude}
Wilayah: ${Wilayah}
Potensi: ${Potensi}
Kedalaman: ${Kedalaman}
    `

    konatabot.sendPhoto(callback.from.id, BMKGImage, {
        caption: resultText
    })
})

konatabot.onText(anime, async (msg, match) => {
    const animeTitle = match[1];  // menangkap judul anime dari regex grup
    
    if (!animeTitle || animeTitle.trim() === "") {
        return konatabot.sendMessage(msg.chat.id, `Mencari detail anime.\n\nContoh:\n${prefix}anime Naruto`);
    }

    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeTitle)}&limit=1`);
        if (response.data.data && response.data.data.length > 0) {
            const anime = response.data.data[0];
            const message = `
Title: ${anime.title}
Type: ${anime.type}
Episode: ${anime.episodes}
Score: ${anime.score}
Mal: ${anime.url}
            `;

            // Mengirimkan pesan teks dan gambar ke pengguna
            konatabot.sendPhoto(msg.chat.id, anime.images.jpg.image_url, {
                caption: message
            });
        } else {
            konatabot.sendMessage(msg.chat.id, "Maaf, anime tidak ditemukan.");
        }
    } catch (error) {
        console.log(error);
        konatabot.sendMessage(msg.chat.id, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});

konatabot.onText(karakter, async (msg, match) => {
    const karakterName = match[1];  // menangkap nama karakter dari regex grup

    if (!karakterName || karakterName.trim() === "") {
        return bot.sendMessage(msg.chat.id, `Mencari gambar karakter anime.\n\nContoh:\n/karakter Jabami Yumeko`);
    }

    try {
        const response = await axios.get(`https://kitsu.io/api/edge/characters?filter[name]=${encodeURIComponent(karakterName)}`);
        if (response.data.data && response.data.data.length > 0) {
            const character = response.data.data[0];
            if (character.attributes.image) {
                konatabot.sendPhoto(msg.chat.id, character.attributes.image.original, {
                    caption: character.attributes.slug
                });
            } else {
                konatabot.sendMessage(msg.chat.id, "Maaf, gambar karakter tidak ditemukan.");
            }
        } else {
            konatabot.sendMessage(msg.chat.id, "Maaf, karakter anime tidak ditemukan.");
        }
    } catch (error) {
        console.log(error);
        konatabot.sendMessage(msg.chat.id, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});

konatabot.onText(gambar, async (msg, match) => {
    const searchText = match[1];  // menangkap kata kunci pencarian dari regex grup

    if (!searchText || searchText.trim() === "") {
        return konatabot.sendMessage(msg.chat.id, `Mencari gambar.\n\nContoh:\n/gambar Anime Naruto`);
    }

    try {
        // Melakukan pencarian gambar dengan kata kunci menggunakan Google Custom Search
        const response = await customSearch.cse.list({
            auth: googleApiKey,
            cx: searchEngineId,
            q: searchText,
            searchType: 'image'
        });

        // Mengambil semua URL gambar dari hasil pencarian
        const images = response.data.items.map(item => item.link);

        // Memilih URL gambar secara acak
        const randomImage = images[Math.floor(Math.random() * images.length)];

        // Kirim gambar yang dipilih secara acak ke pengguna
        if (randomImage) {
            konatabot.sendPhoto(msg.chat.id, randomImage, { caption: 'Ini gambar yang ditemukan:' });
        } else {
            konatabot.sendMessage(msg.chat.id, "Maaf, gambar tidak ditemukan.");
        }
    } catch (error) {
        console.log(error);
        konatabot.sendMessage(msg.chat.id, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});


const openai = new OpenAI({
    apiKey: openaiApiKey
});

konatabot.onText(konata, async (msg, match) => {
    const userText = match[1];  // menangkap teks dari regex grup

    if (!userText || userText.trim() === "") {
        return konatabot.sendMessage(msg.chat.id, `Chat dengan AI.\n\nContoh:\n/konata Apa itu resesi`);
    }

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userText }]
        });

        const aiResponse = chatCompletion.choices[0].message.content;
        await konatabot.sendMessage(msg.chat.id, aiResponse);
    } catch (error) {
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error);
        }
        konatabot.sendMessage(msg.chat.id, "Maaf, sepertinya ada yang error: " + error.message);
    }
});


let tebakanimeData = null;

konatabot.onText(tebakanime, async (msg) => {
    const chatId = msg.chat.id;

    try {
        // Memulai permainan baru
        const response = await axios.get(`https://api.caliph.biz.id/api/tebakanime?apikey=${daniApi}`);
        tebakanimeData = response.data;

        // Kirim gambar tebakan anime ke pengguna
        konatabot.sendPhoto(chatId, tebakanimeData.img, {
            caption: `❏ 🤔 Siapakah karakter anime ini?\n\n❏ 🌟 Jika kesulitan, gunakan /tebakanime-help untuk mendapatkan bantuan\n\n❏ ✒️ Kirim jawaban dengan format /tebakanime <jawaban>`
        });
    } catch (error) {
        console.error(error);
        konatabot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});

konatabot.onText(tebakanimeHelp, async (msg, match) => {
    const chatId = msg.chat.id;

    try {
        // Kirim bantuan tebakan anime ke pengguna
        if (tebakanimeData) {
            konatabot.sendMessage(chatId, `Ini adalah bantuan untuk tebakan Karakter:\n${tebakanimeData.bantuan}\n\nJika masih kesulitan, coba lagi atau gunakan /tebakanime untuk memulai permainan baru.`);
        } else {
            konatabot.sendMessage(chatId, "Permainan tebakan anime belum dimulai. Silakan gunakan /tebakanime untuk memulai permainan.");
        }
    } catch (error) {
        console.error(error);
        konatabot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});

konatabot.onText(tebakanimeNext, async (msg, match) => {
    const chatId = msg.chat.id;

    try {
        // Jika data tebakan anime sudah ada, hapus data tersebut untuk mendapatkan pertanyaan baru
        if (tebakanimeData) {
            tebakanimeData = null;
        }

        // Mulai permainan baru dengan mengambil gambar tebakan anime baru
        const response = await axios.get(`https://api.caliph.biz.id/api/tebakanime?apikey=${daniApi}`);
        tebakanimeData = response.data;

        // Kirim gambar tebakan anime ke pengguna
        konatabot.sendPhoto(chatId, tebakanimeData.img, {
            caption: `❏ 🤔 Siapakah karakter anime ini?\n\n❏ 🌟 Jika kesulitan, gunakan /tebakanime-help untuk mendapatkan bantuan\n\n❏ ✒️ Kirim jawaban dengan format /tebakanime <jawaban>`
        });
    } catch (error) {
        console.error(error);
        konatabot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});

konatabot.onText(tebakanimeJawab, async (msg, match) => {
    const chatId = msg.chat.id;
    const userText = match[1];

    try {
        // Memeriksa apakah pengguna memberikan jawaban
        const jawaban = userText.trim();

        // Memeriksa apakah data tebakan anime sudah tersedia
        if (!tebakanimeData) return konatabot.sendMessage(chatId, "Permainan tebakan anime belum dimulai. Silakan gunakan /tebakanime untuk memulai permainan.");

        // Memeriksa jawaban pengguna
        if (jawaban.toLowerCase() === tebakanimeData.nama.toLowerCase()) {
            konatabot.sendMessage(chatId, "Selamat! Jawaban kamu benar!✅");
            tebakanimeData = null; // Menghapus data tebakan anime setelah permainan selesai
        } else {
            konatabot.sendMessage(chatId, "Maaf, jawaban kamu salah. Coba lagi!❌");
        }
    } catch (error) {
        console.error(error);
        konatabot.sendMessage(chatId, "Maaf, terjadi kesalahan dalam memproses permintaan.");
    }
});