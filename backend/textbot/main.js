// backend/textbot/index.js
const { Bot, Keyboard } = require("@maxhub/max-bot-api");
require("dotenv").config();

const { BOT_TOKEN, BOT_USERNAME } = process.env;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not provided in backend/textbot/.env");
}

if (!BOT_USERNAME) {
  throw new Error("BOT_USERNAME is not provided in backend/textbot/.env");
}

const bot = new Bot(BOT_TOKEN);

// Команды бота
bot.api.setMyCommands([
  {
    name: "start",
    description: "Начать",
  },
  {
    name: "hello",
    description: "Поприветствовать бота",
  },
]);

// Вспомогательные функции
const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getUserFromCtx = (ctx) => {
  // SDK мог поменяться, поэтому аккуратно:
  if (typeof ctx.user === "function") {
    return ctx.user() ?? null;
  }
  return ctx.user ?? null;
};

const buildStartPayload = (ctx) => {
  const user = getUserFromCtx(ctx);

  const payload = {
    userId: user?.user_id ?? null,
    firstName: user?.first_name ?? null,
    lastName: user?.last_name ?? null,
    username: user?.username ?? null,
    languageCode: user?.language_code ?? null,
    ts: Date.now(),
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  return encoded.length > 512 ? "" : encoded;
};

const buildMiniAppLink = (ctx) => {
  const startParam = buildStartPayload(ctx);
  const deeplinkBase = `https://max.ru/${BOT_USERNAME}?startapp`;
  return startParam ? `${deeplinkBase}=${startParam}` : deeplinkBase;
};

// /start
bot.command("start", (ctx) => {
  const user = getUserFromCtx(ctx);

  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.link("🚀 Открыть мини-приложение", buildMiniAppLink(ctx))],
  ]);

  const greetingText = `🎓 Привет! Я — MAX, ваш виртуальный помощник университета.

Я помогу вам:
💡 узнать информацию о приёме и поступлении;
📅 разобраться в расписании занятий и экзаменов;
📚 получить сведения о факультетах, кафедрах и преподавателях;
🏛️ найти нужные службы и подразделения университета;
❓ и просто ответить на любые вопросы о студенческой жизни!

Напишите, что вас интересует, — и я подскажу 😊`;

  return ctx.reply(greetingText, { attachments: [keyboard] });
});

// /hello
bot.command("hello", (ctx) => {
  const user = getUserFromCtx(ctx);

  if (!user) {
    return ctx.reply("Привет! ✨\n\nНе удалось определить данные пользователя.");
  }

  const helloText = `Привет, ${user.first_name ?? "друг"}! ✨`;

  return ctx.reply(helloText);
});

bot.start();
