const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

// ==========================================
// BARAKAT COMMUNITY
// ==========================================

const CONFIG = {
  SERVER_NAME: "BARAKAT COMMUNITY",
  TIMEZONE: "Africa/Cairo",

  WELCOME_CHANNEL_ID: "1525643339699847178",
  AUTO_ROLE_ID: "1532611461245964389",

  APPLICATION_PANEL_CHANNEL_ID: "1550783900261818468",
  APPLICATION_CATEGORY_ID: "1550783950060789880",
  ACCEPTED_ROLE_ID: "1550780555753299968",
  APPLICATION_LOG_CHANNEL_ID: "1556953724608446496",

  TICKET_PANEL_CHANNEL_ID: "1553140280742510622",
  TICKET_CATEGORY_ID: "1553139841007620267",
  TICKET_STAFF_ROLE_ID: "1556821008927948810",
  TICKET_LOG_CHANNEL_ID: "1556953848512516137",

  MEMBER_LOG_CHANNEL_ID: "1556835811440459796",
  SERVER_LOG_CHANNEL_ID: "1556835920760803428",
  VOICE_LOG_CHANNEL_ID: "1556835946132013150",
  ADMIN_LOG_CHANNEL_ID: "1556837526445101056",
};

const TOKEN = process.env.DISCORD_TOKEN?.trim();
const WELCOME_BANNER_URL = process.env.WELCOME_BANNER_URL?.trim() || "";

if (!TOKEN) {
  console.error(
    "[CONFIG ERROR] DISCORD_TOKEN is missing or empty in NexusHost Environment Variables."
  );
  process.exit(1);
}

const DB_PATH = path.join(__dirname, "database.json");

function loadDB() {
  const defaults = {
    applications: {},
    tickets: {},
  };

  try {
    if (!fs.existsSync(DB_PATH)) {
      return defaults;
    }

    const saved = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));

    return {
      applications:
        saved.applications &&
        typeof saved.applications === "object"
          ? saved.applications
          : {},
      tickets:
        saved.tickets && typeof saved.tickets === "object"
          ? saved.tickets
          : {},
    };
  } catch (error) {
    console.error("Database read error:", error.message);
    return defaults;
  }
}

const db = loadDB();

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (error) {
    console.error("Database write error:", error.message);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
  ],
});

const COLORS = {
  primary: 0x7c3aed,
  success: 0x2ecc71,
  danger: 0xe74c3c,
  warning: 0xf1c40f,
  neutral: 0x5865f2,
};

function makeEmbed(title, description, color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(String(description).slice(0, 4000))
    .setFooter({ text: CONFIG.SERVER_NAME })
    .setTimestamp();
}

function getChannel(guild, id) {
  return guild?.channels.cache.get(id) || null;
}

async function sendLog(guild, channelId, embed, files = []) {
  const channel = getChannel(guild, channelId);

  if (!channel?.isTextBased()) {
    console.warn(`Log channel not found: ${channelId}`);
    return;
  }

  try {
    await channel.send({ embeds: [embed], files });
  } catch (error) {
    console.error("Log send error:", error.message);
  }
}

function safeName(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 18) || "member"
  );
}

function isAdmin(member) {
  return Boolean(
    member?.permissions?.has(PermissionFlagsBits.Administrator)
  );
}

function isTicketStaff(member) {
  return (
    isAdmin(member) ||
    Boolean(member?.roles?.cache?.has(CONFIG.TICKET_STAFF_ROLE_ID))
  );
}

function ticketTypeName(type) {
  const names = {
    support: "الدعم الفني",
    editor: "التقديم على إديتور",
    complaint: "الشكاوى",
    stream: "طلبات الستريم",
    other: "طلب آخر",
  };

  return names[type] || "تذكرة";
}

// ==========================================
// TICKET PANEL
// ==========================================

function makeTicketPanel() {
  const embed = makeEmbed(
    "🎫 نظام التذاكر | BARAKAT COMMUNITY",
    [
      "أهلًا بك في نظام التذاكر الرسمي.",
      "",
      "اختر نوع التذكرة من القائمة:",
      "",
      "🎧 الدعم الفني",
      "🎬 التقديم على إديتور",
      "📢 طلبات الستريم",
      "⚠️ الشكاوى",
      "📩 طلب آخر",
      "",
      "يرجى عدم فتح تذاكر مكررة.",
      "انتظر رد فريق الإدارة بعد فتح التذكرة.",
    ].join("\n")
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_create")
    .setPlaceholder("اختر نوع التذكرة")
    .addOptions(
      {
        label: "الدعم الفني",
        description: "مشكلة أو استفسار يحتاج إلى مساعدة",
        value: "support",
        emoji: "🎧",
      },
      {
        label: "التقديم على إديتور",
        description: "التقديم للانضمام إلى فريق الإديتور",
        value: "editor",
        emoji: "🎬",
      },
      {
        label: "طلبات الستريم",
        description: "طلب متعلق بالبث",
        value: "stream",
        emoji: "📢",
      },
      {
        label: "الشكاوى",
        description: "تقديم شكوى للإدارة",
        value: "complaint",
        emoji: "⚠️",
      },
      {
        label: "طلب آخر",
        description: "أي طلب آخر متعلق بالكوميونيتي",
        value: "other",
        emoji: "📩",
      }
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(menu),
    ],
  };
}

// ==========================================
// STREAM APPLICATION PANEL
// ==========================================

function makeApplicationPanel() {
  const embed = makeEmbed(
    "🎥 التقديم على مودي ستريم",
    [
      "تريد الانضمام إلى فريق مودي ستريم في BARAKAT COMMUNITY؟",
      "",
      "اضغط على زر التقديم بالأسفل.",
      "ستصلك أسئلة التقديم في الرسائل الخاصة DM.",
      "",
      "يرجى الإجابة بوضوح وصدق.",
      "إرسال الطلب لا يعني القبول النهائي.",
    ].join("\n")
  );

  const button = new ButtonBuilder()
    .setCustomId("stream_apply")
    .setLabel("تقديم مودي ستريم")
    .setEmoji("🎥")
    .setStyle(ButtonStyle.Primary);

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(button),
    ],
  };
}

const APPLICATION_QUESTIONS = [
  "ما اسمك وعمرك؟",
  "ما اسمك داخل الكوميونيتي؟",
  "ما اسم حسابك على منصة البث؟ أرسل الرابط إن وجد.",
  "ما خبرتك السابقة في إدارة البثوث؟",
  "لماذا تريد الانضمام إلى فريق مودي ستريم؟",
  "كم ساعة تستطيع التواجد يوميًا؟",
  "هل لديك خبرة في التعامل مع المخالفات أثناء البث؟ وضّح.",
];

function makeApplicationReview(application) {
  const answers = APPLICATION_QUESTIONS.map((question, index) => {
    const answer = application.answers[index] || "لم تتم الإجابة";

    return (
      `**${index + 1}. ${question}**\n` +
      answer.slice(0, 450)
    );
  });

  const embed = makeEmbed(
    "📋 طلب تقديم مودي ستريم",
    [
      `**المتقدم:** <@${application.userId}>`,
      "**الحالة:** قيد المراجعة",
      "",
      ...answers,
    ].join("\n\n"),
    COLORS.warning
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`app_accept:${application.id}`)
      .setLabel("قبول مبدئي")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`app_reject:${application.id}`)
      .setLabel("رفض")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`app_pending:${application.id}`)
      .setLabel("قيد المراجعة")
      .setEmoji("⏳")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

async function startApplication(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const existing = Object.values(db.applications).find(
    (app) =>
      app.userId === interaction.user.id &&
      app.status === "pending"
  );

  if (existing) {
    return interaction.editReply(
      "لديك تقديم قيد المراجعة بالفعل. انتظر رد الإدارة."
    );
  }

  let dm;

  try {
    dm = await interaction.user.createDM();

    await dm.send({
      embeds: [
        makeEmbed(
          "🎥 تقديم مودي ستريم",
          "أجب عن كل سؤال برسالة منفصلة.\nاكتب `إلغاء` لإيقاف التقديم."
        ),
      ],
    });
  } catch {
    return interaction.editReply(
      "تعذر إرسال رسالة خاصة إليك. افتح الرسائل الخاصة من السيرفر ثم حاول مرة أخرى."
    );
  }

  await interaction.editReply(
    "تم إرسال أسئلة التقديم إلى الخاص DM. أكمل إجاباتك هناك."
  );

  const answers = [];

  try {
    for (let i = 0; i < APPLICATION_QUESTIONS.length; i++) {
      await dm.send({
        embeds: [
          makeEmbed(
            `السؤال ${i + 1} من ${APPLICATION_QUESTIONS.length}`,
            APPLICATION_QUESTIONS[i]
          ),
        ],
      });

      const collected = await dm.awaitMessages({
        filter: (message) =>
          message.author.id === interaction.user.id &&
          !message.author.bot,
        max: 1,
        time: 5 * 60 * 1000,
        errors: ["time"],
      });

      const answer = collected.first()?.content?.trim() || "";

      if (["إلغاء", "cancel"].includes(answer.toLowerCase())) {
        await dm.send("تم إلغاء التقديم.");
        return;
      }

      if (!answer) {
        await dm.send("الإجابة فارغة. أعد التقديم وحاول مرة أخرى.");
        return;
      }

      answers.push(answer.slice(0, 1500));
    }
  } catch {
    await dm.send(
      "انتهى وقت التقديم أو تعذر استقبال الإجابة. اضغط زر التقديم للبدء من جديد."
    ).catch(() => {});
    return;
  }

  const applicationId = `${interaction.user.id}-${Date.now()}`;

  const application = {
    id: applicationId,
    userId: interaction.user.id,
    username: interaction.user.username,
    answers,
    status: "pending",
    createdAt: new Date().toISOString(),
    reviewedBy: null,
  };

  db.applications[applicationId] = application;
  saveDB();

  const guild = interaction.guild;

  const reviewChannel = getChannel(
    guild,
    CONFIG.APPLICATION_LOG_CHANNEL_ID
  );

  if (reviewChannel?.isTextBased()) {
    try {
      const message = await reviewChannel.send(
        makeApplicationReview(application)
      );

      application.reviewChannelId = reviewChannel.id;
      application.reviewMessageId = message.id;
      saveDB();
    } catch (error) {
      console.error("Application review error:", error.message);
    }
  }

  await dm.send(
    "✅ تم استلام تقديمك وإرساله للإدارة للمراجعة."
  ).catch(() => {});

  await sendLog(
    guild,
    CONFIG.APPLICATION_LOG_CHANNEL_ID,
    makeEmbed(
      "📥 تم استلام تقديم جديد",
      `المتقدم: <@${interaction.user.id}>\nالحالة: قيد المراجعة`
    )
  );
}

// ==========================================
// TICKETS
// ==========================================

async function createTicket(interaction, type) {
  await interaction.deferReply({ ephemeral: true });

  const existing = Object.values(db.tickets).find(
    (ticket) =>
      ticket.userId === interaction.user.id &&
      ticket.status === "open"
  );

  if (existing) {
    const channel = getChannel(
      interaction.guild,
      existing.channelId
    );

    return interaction.editReply(
      channel
        ? `لديك تذكرة مفتوحة بالفعل: ${channel}`
        : "لديك تذكرة مفتوحة بالفعل. تواصل مع الإدارة إذا لم تجدها."
    );
  }

  const guild = interaction.guild;

  const category = getChannel(
    guild,
    CONFIG.TICKET_CATEGORY_ID
  );

  if (
    !category ||
    category.type !== ChannelType.GuildCategory
  ) {
    return interaction.editReply(
      "تعذر العثور على كاتيجوري التذاكر. راجع الـ ID."
    );
  }

  let ticketChannel;

  try {
    ticketChannel = await guild.channels.create({
      name: `${type}-${safeName(interaction.user.username)}`.slice(0, 90),
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `Ticket type: ${type} | Owner ID: ${interaction.user.id}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
        {
          id: CONFIG.TICKET_STAFF_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Ticket creation error:", error.message);

    return interaction.editReply(
      "تعذر إنشاء التذكرة. راجع صلاحيات البوت وترتيب الرولات."
    );
  }

  const ticketId = ticketChannel.id;

  db.tickets[ticketId] = {
    id: ticketId,
    channelId:
