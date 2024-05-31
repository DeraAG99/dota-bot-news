require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TeleToken = "6612134564:AAF0sadxqAJ3aAZQvIXcBE-5vrQ0u-oDNOQ";

if (!TeleToken) {
  console.error("Error: TELE_TOKEN environment variable is not set.");
  process.exit(1);
}

const bot = new TelegramBot(TeleToken, { polling: true });

const STEAM_ENDPOINT =
  "https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=570&count=1&format=json";
const HEADER_IMAGE = "https://clan.akamai.steamstatic.com/images";

async function getImages(content) {
  const imgRegex = /\[img\](.*?)\[\/img\]/g;
  const matches = content.match(imgRegex);

  if (!matches) return "";

  return matches.map((match) =>
    match
      .replace(/\[img\](.*?)\[\/img\]/, "$1")
      .replace("{STEAM_CLAN_IMAGE}", HEADER_IMAGE)
  );
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/getnews") {
    try {
      const response = await axios.get(STEAM_ENDPOINT);
      const jsonData = response.data;
      const newsItems = jsonData.appnews.newsitems;

      if (newsItems.length === 0) {
        await bot.sendMessage(chatId, "No news found for this app.");
      } else {
        const item = newsItems[0];
        const content = item.contents;
        const imageUrls = await getImages(content);

        if (imageUrls.length > 0) {
          const photoUrl = imageUrls.shift(); // Ambil URL foto pertama

          // Bagi caption menjadi beberapa bagian jika terlalu panjang
          const contentParts = content
            .replace(/\[img\](.*?)\[\/img\]/g, "")
            .replace(/<[^>]*>/g, "")
            .match(/.{1,20000}/g);
          await bot.sendPhoto(chatId, photoUrl, { caption: contentParts[0] });

          // Kirim sisa caption
          for (let i = 1; i < contentParts.length; i++) {
            await bot.sendMessage(chatId, contentParts[i]);
          }
        } else {
          // Jika tidak ada gambar, kirim pesan tanpa gambar
          await bot.sendMessage(
            chatId,
            content
              .replace(/\[img\](.*?)\[\/img\]/g, "")
              .replace(/<[^>]*>/g, "")
          );
        }
      }
    } catch (error) {
      console.error("Error retrieving or parsing news:", error);
      await bot.sendMessage(chatId, "An error occurred while retrieving news.");
    }
  }
});
