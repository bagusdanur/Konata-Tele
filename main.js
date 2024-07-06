const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios");

const token= ""
const options = {
    polling: true
}

const konatabot = new TelegramBot(token, options)

const prefix = "."
const sayHi = new RegExp(`^${prefix}halo$`)
const gempa = new RegExp(`^${prefix}gempa$`)
const anime = new RegExp(`^${prefix}anime (.+)$`);


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
