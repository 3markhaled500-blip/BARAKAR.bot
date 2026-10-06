const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType,
  StringSelectMenuBuilder,
  ActivityType
} = require('discord.js');

const CONFIG = {
  GUILD_ID:'1525640813831258183',
  WELCOME_CHANNEL_ID:'1525643339699847178',
  WELCOME_ROLE_ID:'1532611461245964389',

  STREAMER_MOD_ROLE_ID:'1550780555753299968',
  REVIEW_CHANNEL_ID:'1550783950060789880',
  APPLICATION_PANEL_CHANNEL_ID:'1550783900261818468',

  RULES_CHANNEL_ID:'1525642864640528435',

  TICKET_PANEL_CHANNEL_ID:'1553140280742510622',
  TICKET_CATEGORY_ID:'1553139841007620267',
  STAFF_ROLE_ID:'1556821008927948810',

  ROLE_PANEL_CHANNEL_ID:'1553152718871466074',
  TIKTOK_ROLE_ID:'1553148704897114242',
  KICK_ROLE_ID:'1553150118776016966',
  GAMING_ROLE_ID:'1556822047370510446',

  LEVEL_CHANNEL_ID:'1556949227513585674',

  MEMBER_LOG_CHANNEL_ID:'1556835811440459796',
  SERVER_LOG_CHANNEL_ID:'1556835920760803428',
  VOICE_LOG_CHANNEL_ID:'1556835946132013150',
  MESSAGE_LOG_CHANNEL_ID:'1556836177867448440',
  MOD_LOG_CHANNEL_ID:'1556837526445101056',
  TICKET_LOG_CHANNEL_ID:'1556953848512516137',
  APPLICATION_LOG_CHANNEL_ID:'1556953724608446496',

  BANNER_URL:
    'https://cdn.discordapp.com/banners/1545951349919711282/2744d1c5046464da9883162cb9f01183.webp?size=1024'
};

const YELLOW = 0xF5B700;
const GREEN = 0x2ECC71;
const RED = 0xE74C3C;
const BLUE = 0x3498DB;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],

  partials: [
    Partials.Channel
  ]
});

const activeApplications = new Set();
const userXP = new Map();
const messageCooldowns = new Map();

const MESSAGE_XP = 15;
const VOICE_XP = 25;
const MESSAGE_COOLDOWN = 30000;

const questions = [
  'ما اسمك؟',
  'كم عمرك؟',
  'الخبرة في؟ MOD 𝗦𝗧𝗥𝗘𝗔𝗠 .',
  'امتي تعمل ميوت لحد؟',
  'امتي اعمل كيك لحد؟',
  'تعمل ايه عشان تعمل تصويت وامتى؟',
  'تعمل ايه عشان تغير وضع اللعبة وامتى؟',
  'ازاي تعين عنوان البث؟'
];

// =========================================================
// LEVEL SYSTEM
// =========================================================

function levelFromXP(xp) {

  let level = 0;
  let need = 70;

  while (xp >= need) {

    xp -= need;
    level++;
    need = 70 + level * 50;

  }

  return level;
}

function nextXP(level) {

  return 70 + level * 50;

}

async function addXP(member, amount) {

  if (!member) return;
  if (member.user.bot) return;
  if (member.guild.id !== CONFIG.GUILD_ID) return;

  const oldXP =
    userXP.get(member.id) || 0;

  const oldLevel =
    levelFromXP(oldXP);

  const newXP =
    oldXP + amount;

  const newLevel =
    levelFromXP(newXP);

  userXP.set(
    member.id,
    newXP
  );

  if (newLevel <= oldLevel) {
    return;
  }

  const channel =
    member.guild.channels.cache.get(
      CONFIG.LEVEL_CHANNEL_ID
    );

  if (!channel?.isTextBased()) {
    return;
  }

  const embed =
    new EmbedBuilder()

      .setColor(YELLOW)

      .setTitle(
        '🎉 LEVEL UP!'
      )

      .setDescription(
`# 🎉 مبروك ${member}!

لقد وصلت إلى **المستوى ${newLevel}** 🎊

━━━━━━━━━━━━━━━━━━━━

👤 **العضو:**
${member}

🏆 **المستوى:**
Level ${newLevel}

⭐ **XP الحالي:**
${newXP} XP

📈 **XP للمستوى التالي:**
${nextXP(newLevel)} XP

━━━━━━━━━━━━━━━━━━━━

🔥 استمر في التفاعل داخل **BARAKAT COMMUNITY**!

━━━━━━━━━━━━━━━━━━━━`
      )

      .setThumbnail(
        member.user.displayAvatarURL({
          size: 512
        })
      )

      .setImage(
        CONFIG.BANNER_URL
      )

      .setFooter({
        text:
          'BARAKAT COMMUNITY • LEVEL SYSTEM'
      })

      .setTimestamp();

  await channel.send({
    content: `${member}`,
    embeds: [embed]
  });

}

// =========================================================
// LOG SYSTEM
// =========================================================

async function sendLog(
  channelId,
  embed
) {

  const channel =
    await client.channels
      .fetch(channelId)
      .catch(() => null);

  if (
    channel?.isTextBased()
  ) {

    await channel
      .send({
        embeds: [embed]
      })
      .catch(() => {});

  }

}

function logEmbed(
  title,
  color,
  description
) {

  return new EmbedBuilder()

    .setColor(color)

    .setTitle(title)

    .setDescription(description)

    .setFooter({
      text:
        'BARAKAT COMMUNITY • LOG SYSTEM'
    })

    .setTimestamp();

}

async function appLog(
  title,
  color,
  user,
  details
) {

  const embed =
    logEmbed(
      title,
      color,
      `👤 **المتقدم:** ${user}\n🆔 **ID:** \`${user.id}\`\n\n${details}`
    )

    .setThumbnail(
      user.displayAvatarURL({
        size: 256
      })
    );

  await sendLog(
    CONFIG.APPLICATION_LOG_CHANNEL_ID,
    embed
  );

}

async function ticketLog(
  title,
  color,
  user,
  details
) {

  const embed =
    logEmbed(
      title,
      color,
      `👤 **العضو:** ${user}\n🆔 **ID:** \`${user.id}\`\n\n${details}`
    )

    .setThumbnail(
      user.displayAvatarURL({
        size: 256
      })
    );

  await sendLog(
    CONFIG.TICKET_LOG_CHANNEL_ID,
    embed
  );

}

// =========================================================
// STAFF
// =========================================================

function isStaff(member) {

  return !!member && (

    member.permissions?.has(
      PermissionsBitField.Flags.Administrator
    )

    ||

    member.permissions?.has(
      PermissionsBitField.Flags.ManageGuild
    )

    ||

    member.roles?.cache?.has(
      CONFIG.STAFF_ROLE_ID
    )

  );

}

// =========================================================
// TICKET HELPERS
// =========================================================

function ownerId(channel) {

  return (
    channel.topic || ''
  )
    .match(/ticket:(\d+)/)
    ?.[1] || null;

}

function claimerId(channel) {

  return (
    channel.topic || ''
  )
    .match(/claimed:(\d+)/)
    ?.[1] || null;

}

function ticketName(
  user,
  type
) {

  const name =
    user.username
      .toLowerCase()
      .replace(
        /[^a-z0-9-]/g,
        '-'
      )
      .slice(
        0,
        18
      ) ||
    user.id.slice(-6);

  return `ticket-${type}-${name}`;

}

// =========================================================
// SETUP PANELS
// =========================================================

async function setupPanels(guild) {

  // =======================================================
  // APPLICATION PANEL
  // =======================================================

  const app =
    guild.channels.cache.get(
      CONFIG.APPLICATION_PANEL_CHANNEL_ID
    );

  if (app?.isTextBased()) {

    const embed =
      new EmbedBuilder()

        .setColor(
          YELLOW
        )

        .setTitle(
          '🎥 BARAKAT COMMUNITY'
        )

        .setDescription(
`## 🎥 MOD 𝗦𝗧𝗥𝗘𝗔𝗠

اضغط على الزر بالأسفل لبدء التقديم.

📩 الأسئلة في الخاص
🔎 المراجعة من الإدارة
📨 النتيجة في الخاص`
        )

        .setImage(
          CONFIG.BANNER_URL
        )

        .setFooter({
          text:
            'BARAKAT COMMUNITY • MOD 𝗦𝗧𝗥𝗘𝗔𝗠'
        });

    const row =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()

            .setCustomId(
              'streamer_apply'
            )

            .setLabel(
              'تقديم MOD 𝗦𝗧𝗥𝗘𝗔𝗠'
            )

            .setEmoji(
              '🎥'
            )

            .setStyle(
              ButtonStyle.Primary
            )

        );

    await app.send({
      embeds: [embed],
      components: [row]
    }).catch(() => {});

  }

  // =======================================================
  // RULES
  // =======================================================

  const rules =
    guild.channels.cache.get(
      CONFIG.RULES_CHANNEL_ID
    );

  if (rules?.isTextBased()) {

    const rulesList = [

      'احترام جميع الأعضاء وعدم السب أو التنمر.',

      'ممنوع الألفاظ العنصرية أو المسيئة.',

      'ممنوع السبام والمنشن المزعج.',

      'ممنوع الإعلانات وروابط السيرفرات الأخرى بدون إذن.',

      'استخدم كل روم في الغرض المخصص له.',

      'ممنوع المحتوى غير المناسب.',

      'ممنوع انتحال الشخصية.',

      'ممنوع نشر المعلومات الشخصية بدون موافقة.',

      'ممنوع الغش والاحتيال والروابط الضارة.',

      'احترام قرارات الإدارة.',

      'ممنوع افتعال المشاكل.'

    ];

    const embed =
      new EmbedBuilder()

        .setColor(
          BLUE
        )

        .setTitle(
          '📜 قوانين BARAKAT COMMUNITY'
        )

        .setDescription(

          rulesList
            .map(
              (x, i) =>
                `**${i + 1}.** ${x}`
            )
            .join('\n\n')

        )

        .setImage(
          CONFIG.BANNER_URL
        )

        .setFooter({
          text:
            'BARAKAT COMMUNITY • RULES'
        });

    await rules.send({
      embeds: [embed]
    }).catch(() => {});

  }

  // =======================================================
  // TICKET PANEL
  // =======================================================

  const ticket =
    guild.channels.cache.get(
      CONFIG.TICKET_PANEL_CHANNEL_ID
    );

  if (ticket?.isTextBased()) {

    const embed =
      new EmbedBuilder()

        .setColor(
          YELLOW
        )

        .setTitle(
          '🎫 BARAKAT SUPPORT'
        )

        .setDescription(
`# 🎫 نظام التذاكر

اختر نوع التذكرة من القائمة.

🛠️ الدعم الفني

⚖️ الشكاوى

🎥 Stream Support

🎬 Editor Application`
        )

        .setImage(
          CONFIG.BANNER_URL
        )

        .setFooter({
          text:
            'BARAKAT_TICKET_PANEL'
        });

    const menu =
      new StringSelectMenuBuilder()

        .setCustomId(
          'ticket_type'
        )

        .setPlaceholder(
          '🎫 اختر نوع التذكرة'
        )

        .addOptions(

          {
            label:
              'الدعم الفني',

            description:
              'مساعدة أو مشكلة فنية',

            value:
              'technical',

            emoji:
              '🛠️'
          },

          {
            label:
              'الشكاوى',

            description:
              'شكوى على عضو أو إداري',

            value:
              'complaint',

            emoji:
              '⚖️'
          },

          {
            label:
              'Stream Support',

            description:
              'دعم خاص بالبث',

            value:
              'stream',

            emoji:
              '🎥'
          },

          {
            label:
              'Editor Application',

            description:
              'التقديم على الإيديتور',

            value:
              'editor',

            emoji:
              '🎬'
          }

        );

    await ticket.send({

      embeds: [
        embed
      ],

      components: [

        new ActionRowBuilder()
          .addComponents(
            menu
          )

      ]

    }).catch(() => {});

  }

  // =======================================================
  // ROLE PANEL
  // =======================================================

  const role =
    guild.channels.cache.get(
      CONFIG.ROLE_PANEL_CHANNEL_ID
    );

  if (role?.isTextBased()) {

    const embed =
      new EmbedBuilder()

        .setColor(
          YELLOW
        )

        .setTitle(
          '🔔 اخـتـر رولـك'
        )

        .setDescription(
`# اخـتـر إشـعـاراتـك

اضغط على الزر لإضافة أو إزالة الرول.`
        )

        .setImage(
          CONFIG.BANNER_URL
        )

        .setFooter({
          text:
            'BARAKAT_ROLE_PANEL'
        });

    const row =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId(
              'role_tiktok'
            )
            .setLabel(
              'TikTok'
            )
            .setEmoji(
              '🎵'
            )
            .setStyle(
              ButtonStyle.Secondary
            ),

          new ButtonBuilder()
            .setCustomId(
              'role_kick'
            )
            .setLabel(
              'Kick'
            )
            .setEmoji(
              '🟢'
            )
            .setStyle(
              ButtonStyle.Secondary
            ),

          new ButtonBuilder()
            .setCustomId(
              'role_gaming'
            )
            .setLabel(
              'Gaming'
            )
            .setEmoji(
              '🎮'
            )
            .setStyle(
              ButtonStyle.Secondary
            )

        );

    await role.send({

      embeds: [
        embed
      ],

      components: [
        row
      ]

    }).catch(() => {});

  }

}

// =========================================================
// CREATE TICKET
// =========================================================

async function createTicket(
  interaction,
  type
) {

  const existing =
    interaction.guild.channels.cache.find(

      channel =>

        channel.type ===
          ChannelType.GuildText &&

        channel.parentId ===
          CONFIG.TICKET_CATEGORY_ID &&

        channel.topic?.startsWith(
          `ticket:${interaction.user.id}`
        )

    );

  if (existing) {

    return interaction.reply({

      content:
        `❌ لديك تذكرة مفتوحة بالفعل: ${existing}`,

      ephemeral:
        true

    });

  }

  const labels = {

    technical:
      'الدعم الفني',

    complaint:
      'الشكاوى',

    stream:
      'Stream Support',

    editor:
      'Editor Application'

  };

  const channel =
    await interaction.guild.channels.create({

      name:
        ticketName(
          interaction.user,
          type
        ),

      type:
        ChannelType.GuildText,

      parent:
        CONFIG.TICKET_CATEGORY_ID,

      topic:
        `ticket:${interaction.user.id}`,

      permissionOverwrites: [

        {

          id:
            interaction.guild.roles.everyone.id,

          deny: [

            PermissionsBitField.Flags
              .ViewChannel

          ]

        },

        {

          id:
            interaction.user.id,

          allow: [

            PermissionsBitField.Flags
              .ViewChannel,

            PermissionsBitField.Flags
              .SendMessages,

            PermissionsBitField.Flags
              .ReadMessageHistory,

            PermissionsBitField.Flags
              .AttachFiles

          ]

        },

        {

          id:
            CONFIG.STAFF_ROLE_ID,

          allow: [

            PermissionsBitField.Flags
              .ViewChannel,

            PermissionsBitField.Flags
              .SendMessages,

            PermissionsBitField.Flags
              .ReadMessageHistory,

            PermissionsBitField.Flags
              .ManageMessages

          ]

        }

      ]

    });

  const embed =
    new EmbedBuilder()

      .setColor(
        YELLOW
      )

      .setTitle(
        `🎫 ${labels[type]}`
      )

      .setDescription(
`أهلًا ${interaction.user} 👋

تم إنشاء التذكرة.

📥 **استلام التذكرة**

🔒 **إغلاق التذكرة**`
      )

      .setImage(
        CONFIG.BANNER_URL
      );

  const row =
    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(
            'claim_ticket'
          )
          .setLabel(
            'استلام التذكرة'
          )
          .setEmoji(
            '📥'
          )
          .setStyle(
            ButtonStyle.Success
          ),

        new ButtonBuilder()
          .setCustomId(
            'close_ticket'
          )
          .setLabel(
            'إغلاق التذكرة'
          )
          .setEmoji(
            '🔒'
          )
          .setStyle(
            ButtonStyle.Danger
          )

      );

  await channel.send({

    content:
      `${interaction.user} <@&${CONFIG.STAFF_ROLE_ID}>`,

    embeds: [
      embed
    ],

    components: [
      row
    ]

  });

  await ticketLog(

    '🎫 تم فتح تذكرة',

    GREEN,

    interaction.user,

    `📌 **النوع:** ${labels[type]}\n📍 **التذكرة:** ${channel}`

  );

  return interaction.reply({

    content:
      `✅ تم إنشاء تذكرتك: ${channel}`,

    ephemeral:
      true

  });

}

// =========================================================
// CLAIM TICKET
// =========================================================

async function claimTicket(
  interaction
) {

  if (
    !isStaff(
      interaction.member
    )
  ) {

    return interaction.reply({

      content:
        '❌ ليس لديك صلاحية استلام التذاكر.',

      ephemeral:
        true

    });

  }

  const channel =
    interaction.channel;

  const owner =
    ownerId(channel);

  if (!owner) {

    return interaction.reply({

      content:
        '❌ هذه ليست تذكرة.',

      ephemeral:
        true

    });

  }

  const claimer =
    claimerId(channel);

  if (claimer) {

    return interaction.reply({

      content:
        `⚠️ التذكرة مستلمة بواسطة <@${claimer}>.`,

      ephemeral:
        true

    });

  }

  await channel.setTopic(
    `ticket:${owner};claimed:${interaction.user.id}`
  );

  await interaction.update({

    components: [

      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()

            .setCustomId(
              'close_ticket'
            )

            .setLabel(
              'إغلاق التذكرة'
            )

            .setEmoji(
              '🔒'
            )

            .setStyle(
              ButtonStyle.Danger
            )

        )

    ]

  });

  await channel.send(
    `📥 تم استلام التذكرة بواسطة ${interaction.user}.`
  );

  await ticketLog(

    '📥 تم استلام تذكرة',

    GREEN,

    interaction.user,

    `🎫 **التذكرة:** ${channel}\n👤 **صاحب التذكرة:** <@${owner}>`

  );

}

// =========================================================
// CLOSE TICKET
// =========================================================

async function closeTicket(
  interaction
) {

  if (
    !isStaff(
      interaction.member
    )
  ) {

    return interaction.reply({

      content:
        '❌ ليس لديك صلاحية إغلاق التذاكر.',

      ephemeral:
        true

    });

  }

  const channel =
    interaction.channel;

  const owner =
    ownerId(channel);

  const claimer =
    claimerId(channel);

  if (!owner || !claimer) {

    return interaction.reply({

      content:
        '⚠️ يجب استلام التذكرة أولًا.',

      ephemeral:
        true

    });

  }

  if (
    claimer !==
    interaction.user.id
  ) {

    return interaction.reply({

      content:
        `❌ التذكرة مستلمة بواسطة <@${claimer}>.`,

      ephemeral:
        true

    });

  }

  await interaction.reply(
    '🔒 سيتم إغلاق التذكرة خلال 5 ثوانٍ...'
  );

  await ticketLog(

    '🔒 تم إغلاق تذكرة',

    RED,

    interaction.user,

    `🎫 **التذكرة:** #${channel.name}\n👤 **صاحب التذكرة:** <@${owner}>`

  );

  const user =
    await client.users
      .fetch(owner)
      .catch(() => null);

  if (user) {

    await user
      .send(
        `🔒 تم إغلاق تذكرتك في **BARAKAT COMMUNITY** بواسطة ${interaction.user}.`
      )
      .catch(() => {});

  }

  setTimeout(() => {

    channel
      .delete()
      .catch(() => {});

  }, 5000);

}

// =========================================================
// READY
// =========================================================

client.once(
  'ready',
  async () => {

    console.log(
      `✅ Bot Online: ${client.user.tag}`
    );

    client.user.setPresence({

      activities: [

        {

          name:
            'BARAKAT COMMUNITY',

          type:
            ActivityType.Watching

        }

      ],

      status:
        'online'

    });

    const guild =
      client.guilds.cache.get(
        CONFIG.GUILD_ID
      );

    if (guild) {

      await setupPanels(
        guild
      );

    }

  }
);

// =========================================================
// MEMBER LOGS + WELCOME
// =========================================================

client.on(
  'guildMemberAdd',
  async member => {

    if (
      member.guild.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.MEMBER_LOG_CHANNEL_ID,

      logEmbed(

        '📥 عضو دخل السيرفر',

        GREEN,

        `👤 **العضو:** ${member}\n🆔 **ID:** \`${member.id}\``

      ).setThumbnail(

        member.user.displayAvatarURL({
          size: 256
        })

      )

    );

    const role =
      member.guild.roles.cache.get(
        CONFIG.WELCOME_ROLE_ID
      );

    if (role) {

      await member.roles
        .add(role)
        .catch(() => {});

    }

    const channel =
      member.guild.channels.cache.get(
        CONFIG.WELCOME_CHANNEL_ID
      );

    if (
      !channel?.isTextBased()
    ) return;

    const embed =
      new EmbedBuilder()

        .setColor(
          YELLOW
        )

        .setTitle(
          '👋 أهلاً وسهلاً بك في BARAKAT COMMUNITY'
        )

        .setDescription(
`# نورت السيرفر يا ${member}

أهلاً وسهلاً بك في **BARAKAT COMMUNITY** ❤️

📜 لا تنسَ قراءة القوانين.`
        )

        .setThumbnail(
          member.user.displayAvatarURL({
            size: 512
          })
        )

        .setImage(
          CONFIG.BANNER_URL
        );

    await channel.send({

      content:
        `${member}`,

      embeds: [
        embed
      ]

    });

  }
);

client.on(
  'guildMemberRemove',
  async member => {

    if (
      member.guild.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.MEMBER_LOG_CHANNEL_ID,

      logEmbed(

        '📤 عضو غادر السيرفر',

        RED,

        `👤 **العضو:** ${member.user}\n🆔 **ID:** \`${member.id}\``

      )

    );

  }
);

// =========================================================
// CHAT XP
// =========================================================

client.on(
  'messageCreate',
  async message => {

    if (
      !message.guild ||
      message.guild.id !== CONFIG.GUILD_ID ||
      message.author.bot
    ) return;

    const now =
      Date.now();

    const last =
      messageCooldowns.get(
        message.author.id
      ) || 0;

    if (
      now - last <
      MESSAGE_COOLDOWN
    ) return;

    messageCooldowns.set(
      message.author.id,
      now
    );

    if (message.member) {

      await addXP(
        message.member,
        MESSAGE_XP
      );

    }

  }
);

// =========================================================
// MESSAGE LOGS
// =========================================================

client.on(
  'messageDelete',
  async message => {

    if (
      !message.guild ||
      message.guild.id !== CONFIG.GUILD_ID ||
      message.author?.bot
    ) return;

    await sendLog(

      CONFIG.MESSAGE_LOG_CHANNEL_ID,

      logEmbed(

        '🗑️ تم حذف رسالة',

        RED,

`👤 **العضو:** ${message.author || 'غير معروف'}

📍 **الروم:** ${message.channel}

💬 **المحتوى:**

${(
  message.content ||
  '[لا يوجد نص]'
).slice(0, 3500)}`

      )

    );

  }
);

client.on(
  'messageUpdate',
  async (oldMessage, newMessage) => {

    if (
      !newMessage.guild ||
      newMessage.guild.id !== CONFIG.GUILD_ID ||
      newMessage.author?.bot ||
      oldMessage.content ===
        newMessage.content
    ) return;

    await sendLog(

      CONFIG.MESSAGE_LOG_CHANNEL_ID,

      logEmbed(

        '✏️ تم تعديل رسالة',

        YELLOW,

`👤 **العضو:** ${newMessage.author}

📍 **الروم:** ${newMessage.channel}

🔴 **قبل:**

${(
  oldMessage.content ||
  '[فارغ]'
).slice(0, 1500)}

🟢 **بعد:**

${(
  newMessage.content ||
  '[فارغ]'
).slice(0, 1500)}`

      )

    );

  }
);

// =========================================================
// VOICE LOGS
// =========================================================

client.on(
  'voiceStateUpdate',
  async (oldState, newState) => {

    if (
      !newState.guild ||
      newState.guild.id !== CONFIG.GUILD_ID ||
      newState.member?.user.bot
    ) return;

    let title =
      '🎧 تحديث صوتي';

    let color =
      YELLOW;

    let description =
      `👤 **العضو:** ${newState.member}`;

    if (
      !oldState.channelId &&
      newState.channelId
    ) {

      title =
        '🟢 دخول فويس';

      color =
        GREEN;

      description +=
        `\n🎧 **دخل:** ${newState.channel}`;

    }

    else if (
      oldState.channelId &&
      !newState.channelId
    ) {

      title =
        '🔴 خروج من الفويس';

      color =
        RED;

      description +=
        `\n🎧 **خرج:** ${oldState.channel}`;

    }

    else if (
      oldState.channelId !==
      newState.channelId
    ) {

      description +=
        `\n📤 **من:** ${oldState.channel}\n📥 **إلى:** ${newState.channel}`;

    }

    else {

      return;

    }

    await sendLog(

      CONFIG.VOICE_LOG_CHANNEL_ID,

      logEmbed(
        title,
        color,
        description
      )

    );

  }
);

// =========================================================
// VOICE XP - EVERY 5 MINUTES
// =========================================================

setInterval(
  async () => {

    const guild =
      client.guilds.cache.get(
        CONFIG.GUILD_ID
      );

    if (!guild) return;

    for (
      const channel of
      guild.channels.cache.values()
    ) {

      if (
        channel.type !==
        ChannelType.GuildVoice
      ) continue;

      for (
        const member of
        channel.members.values()
      ) {

        if (
          member.user.bot
        ) continue;

        await addXP(
          member,
          VOICE_XP
        );

      }

    }

  },
  5 * 60 * 1000
);

// =========================================================
// MOD LOGS
// =========================================================

client.on(
  'guildBanAdd',
  async ban => {

    if (
      ban.guild.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.MOD_LOG_CHANNEL_ID,

      logEmbed(

        '🔨 تم حظر عضو',

        RED,

        `👤 **العضو:** ${ban.user}\n🆔 **ID:** \`${ban.user.id}\``

      )

    );

  }
);

client.on(
  'guildBanRemove',
  async ban => {

    if (
      ban.guild.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.MOD_LOG_CHANNEL_ID,

      logEmbed(

        '🔓 تم فك حظر عضو',

        GREEN,

        `👤 **العضو:** ${ban.user}\n🆔 **ID:** \`${ban.user.id}\``

      )

    );

  }
);

client.on(
  'guildMemberUpdate',
  async (oldMember, newMember) => {

    if (
      newMember.guild.id !==
      CONFIG.GUILD_ID ||
      newMember.user.bot
    ) return;

    if (
      oldMember.communicationDisabledUntilTimestamp !==
      newMember.communicationDisabledUntilTimestamp
    ) {

      const enabled =
        !!newMember.communicationDisabledUntilTimestamp;

      await sendLog(

        CONFIG.MOD_LOG_CHANNEL_ID,

        logEmbed(

          enabled
            ? '⏳ تم إعطاء Timeout'
            : '🔓 تم إزالة Timeout',

          enabled
            ? RED
            : GREEN,

`👤 **العضو:** ${newMember}

🆔 **ID:** \`${newMember.id}\`

${
  enabled
    ? `⏱️ حتى: <t:${Math.floor(
        newMember.communicationDisabledUntilTimestamp / 1000
      )}:F>`
    : 'تم إزالة التايم أوت.'
}`

        )

      );

    }

  }
);

// =========================================================
// SERVER LOGS
// =========================================================

client.on(
  'channelCreate',
  async channel => {

    if (
      channel.guild?.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.SERVER_LOG_CHANNEL_ID,

      logEmbed(

        '📁 تم إنشاء قناة',

        GREEN,

        `📌 **القناة:** ${channel}\n🆔 **ID:** \`${channel.id}\``

      )

    );

  }
);

client.on(
  'channelDelete',
  async channel => {

    if (
      channel.guild?.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.SERVER_LOG_CHANNEL_ID,

      logEmbed(

        '🗑️ تم حذف قناة',

        RED,

        `📌 **الاسم:** ${channel.name}\n🆔 **ID:** \`${channel.id}\``

      )

    );

  }
);

client.on(
  'roleCreate',
  async role => {

    if (
      role.guild.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.SERVER_LOG_CHANNEL_ID,

      logEmbed(

        '🎭 تم إنشاء رول',

        GREEN,

        `🎭 **الرول:** ${role}\n🆔 **ID:** \`${role.id}\``

      )

    );

  }
);

client.on(
  'roleDelete',
  async role => {

    if (
      role.guild.id !==
      CONFIG.GUILD_ID
    ) return;

    await sendLog(

      CONFIG.SERVER_LOG_CHANNEL_ID,

      logEmbed(

        '🗑️ تم حذف رول',

        RED,

        `🎭 **الاسم:** \`${role.name}\`\n🆔 **ID:** \`${role.id}\``

      )

    );

  }
);

// =========================================================
// INTERACTIONS
// =========================================================

client.on(
  'interactionCreate',
  async interaction => {

    try {

      // =====================================================
      // TICKET SELECT
      // =====================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          'ticket_type'
      ) {

        return createTicket(
          interaction,
          interaction.values[0]
        );

      }

      // =====================================================
      // BUTTONS
      // =====================================================

      if (
        interaction.isButton()
      ) {

        // TICKET CLAIM
        if (
          interaction.customId ===
          'claim_ticket'
        ) {

          return claimTicket(
            interaction
          );

        }

        // TICKET CLOSE
        if (
          interaction.customId ===
          'close_ticket'
        ) {

          return closeTicket(
            interaction
          );

        }

        // ===================================================
        // ROLE BUTTONS
        // ===================================================

        const roleMap = {

          role_tiktok: [
            CONFIG.TIKTOK_ROLE_ID,
            'TikTok'
          ],

          role_kick: [
            CONFIG.KICK_ROLE_ID,
            'Kick'
          ],

          role_gaming: [
            CONFIG.GAMING_ROLE_ID,
            'Gaming'
          ]

        };

        if (
          roleMap[
            interaction.customId
          ]
        ) {

          const [
            roleId,
            name
          ] =
            roleMap[
              interaction.customId
            ];

          const role =
            interaction.guild.roles.cache.get(
              roleId
            );

          if (!role) {

            return interaction.reply({

              content:
                '❌ الرول غير موجود.',

              ephemeral:
                true

            });

          }

          if (
            interaction.member.roles.cache.has(
              roleId
            )
          ) {

            await interaction.member
              .roles.remove(
                role
              );

            return interaction.reply({

              content:
                `🔴 تم إزالة رول **${name}**.`,

              ephemeral:
                true

            });

          }

          await interaction.member
            .roles.add(
              role
            );

          return interaction.reply({

            content:
              `🟢 تم إعطاؤك رول **${name}**.`,

            ephemeral:
              true

          });

        }

        // ===================================================
        // START APPLICATION
        // ===================================================

        if (
          interaction.customId ===
          'streamer_apply'
        ) {

          if (
            activeApplications.has(
              interaction.user.id
            )
          ) {

            return interaction.reply({

              content:
                '⚠️ لديك تقديم قيد التنفيذ بالفعل.',

              ephemeral:
                true

            });

          }

          activeApplications.add(
            interaction.user.id
          );

          await interaction.reply({

            content:
              '📩 تم بدء التقديم، افتح الخاص مع البوت.',

            ephemeral:
              true

          });

          try {

            const dm =
              await interaction.user.createDM();

            await dm.send(
              '🎥 **BARAKAT COMMUNITY — MOD 𝗦𝗧𝗥𝗘𝗔𝗠 Application**\n\nسأرسل لك الأسئلة واحدًا تلو الآخر..'
            );

            const answers = [];

            for (
              let i = 0;
              i < questions.length;
              i++
            ) {

              await dm.send(
                `### السؤال ${i + 1}/${questions.length}\n${questions[i]}`
              );

              const collected =
                await dm.awaitMessages({

                  filter:
                    message =>
                      message.author.id ===
                      interaction.user.id,

                  max:
                    1,

                  time:
                    300000

                });

              if (
                !collected.size
              ) {

                await dm.send(
                  '❌ انتهى الوقت وتم إلغاء التقديم.'
                );

                return;

              }

              const answer =
                collected
                  .first()
                  .content
                  .trim();

              if (
                answer.toLowerCase() ===
                  'إلغاء' ||

                answer.toLowerCase() ===
                  'cancel'
              ) {

                await dm.send(
                  '❌ تم إلغاء التقديم.'
                );

                return;

              }

              answers.push(
                answer
              );

            }

            const review =
              interaction.guild.channels.cache.get(
                CONFIG.REVIEW_CHANNEL_ID
              );

            if (
              !review?.isTextBased()
            ) {

              throw new Error(
                'Review channel not found'
              );

            }

            const embed =
              new EmbedBuilder()

                .setColor(
                  YELLOW
                )

                .setTitle(
                  '📋 طلب MOD 𝗦𝗧𝗥𝗘𝗔𝗠 جديد'
                )

                .setThumbnail(
                  interaction.user.displayAvatarURL({
                    size: 512
                  })
                )

                .setDescription(
`👤 **المتقدم:** ${interaction.user}

🆔 **ID:** \`${interaction.user.id}\`

🟡 **الحالة:** قيد المراجعة`
                )

                .setTimestamp();

            questions.forEach(
              (
                question,
                index
              ) => {

                embed.addFields({

                  name:
                    `${index + 1}️⃣ ${question}`,

                  value:
                    (
                      answers[index] ||
                      'لا توجد إجابة.'
                    ).slice(
                      0,
                      1024
                    )

                });

              }
            );

            const row =
              new ActionRowBuilder()
                .addComponents(

                  new ButtonBuilder()

                    .setCustomId(
                      `accept_${interaction.user.id}`
                    )

                    .setLabel(
                      'قبول'
                    )

                    .setEmoji(
                      '✅'
                    )

                    .setStyle(
                      ButtonStyle.Success
                    ),

                  new ButtonBuilder()

                    .setCustomId(
                      `reject_${interaction.user.id}`
                    )

                    .setLabel(
                      'رفض'
                    )

                    .setEmoji(
                      '❌'
                    )

                    .setStyle(
                      ButtonStyle.Danger
                    )

                );

            await review.send({

              embeds: [
                embed
              ],

              components: [
                row
              ]

            });

            await appLog(

              '📋 تقديم MOD 𝗦𝗧𝗥𝗘𝗔𝗠 جديد',

              YELLOW,

              interaction.user,

              '🟡 تم إرسال التقديم إلى المراجعة.'

            );

            await dm.send(
              '✅ تم إرسال تقديمك بنجاح، ستصلك النتيجة في الخاص.'
            );

          }

          catch (error) {

            console.error(
              '❌ Application Error:',
              error
            );

            await interaction
              .editReply({

                content:
                  '❌ حدث خطأ أثناء التقديم.'

              })

              .catch(
                () => {}
              );

          }

          finally {

            activeApplications.delete(
              interaction.user.id
            );

          }

          return;

        }

        // ===================================================
        // ACCEPT
        // ===================================================

        if (
          interaction.customId.startsWith(
            'accept_'
          )
        ) {

          if (
            !isStaff(
              interaction.member
            )
          ) {

            return interaction.reply({

              content:
                '❌ ليس لديك صلاحية مراجعة التقديمات.',

              ephemeral:
                true

            });

          }

          const userId =
            interaction.customId.slice(
              7
            );

          const member =
            await interaction.guild.members
              .fetch(
                userId
              )
              .catch(
                () => null
              );

          const role =
            interaction.guild.roles.cache.get(
              CONFIG.STREAMER_MOD_ROLE_ID
            );

          if (
            !member ||
            !role
          ) {

            return interaction.reply({

              content:
                '❌ العضو أو الرول غير موجود.',

              ephemeral:
                true

            });

          }

          await member.roles.add(
            role
          );

          const embed =
            EmbedBuilder
              .from(
                interaction.message.embeds[0]
              )

              .setColor(
                GREEN
              )

              .setDescription(
`${interaction.message.embeds[0].description}

━━━━━━━━━━━━━━━━━━━━

## ✅ تم قبول التقديم

👮 **تم قبوله بواسطة:**
${interaction.user}`
              );

          await interaction.update({

            embeds: [
              embed
            ],

            components: [

              new ActionRowBuilder()
                .addComponents(

                  new ButtonBuilder()

                    .setCustomId(
                      'application_done'
                    )

                    .setLabel(
                      'تم قبول التقديم'
                    )

                    .setStyle(
                      ButtonStyle.Success
                    )

                    .setDisabled(
                      true
                    )

                )

            ]

          });

          const user =
            await client.users
              .fetch(
                userId
              )
              .catch(
                () => null
              );

          if (user) {

            await user
              .send(
`🎉 مبروك!

تم قبول تقديمك في **MOD 𝗦𝗧𝗥𝗘𝗔𝗠**.

👮 تم قبولك بواسطة:
${interaction.user.username}`
              )
              .catch(
                () => {}
              );

          }

          await appLog(

            '✅ تم قبول تقديم MOD 𝗦𝗧𝗥𝗘𝗔𝗠',

            GREEN,

            member.user,

            `👮 **المراجع:** ${interaction.user}\n🎭 **الرول:** ${role}`

          );

          return;

        }

        // ===================================================
        // REJECT
        // ===================================================

        if (
          interaction.customId.startsWith(
            'reject_'
          )
        ) {

          if (
            !isStaff(
              interaction.member
            )
          ) {

            return interaction.reply({

              content:
                '❌ ليس لديك صلاحية مراجعة التقديمات.',

              ephemeral:
                true

            });

          }

          const userId =
            interaction.customId.slice(
              7
            );

          const modal =
            new ModalBuilder()

              .setCustomId(
                `reject_modal_${userId}`
              )

              .setTitle(
                '❌ رفض MOD KICK'
              );

          const input =
            new TextInputBuilder()

              .setCustomId(
                'reason'
              )

              .setLabel(
                'سبب الرفض'
              )

              .setStyle(
                TextInputStyle.Paragraph
              )

              .setRequired(
                true
              )

              .setMaxLength(
                1000
              );

          modal.addComponents(

            new ActionRowBuilder()
              .addComponents(
                input
              )

          );

          return interaction.showModal(
            modal
          );

        }

      }

      // =====================================================
      // REJECT MODAL
      // =====================================================

      if (
        interaction.isModalSubmit() &&

        interaction.customId.startsWith(
          'reject_modal_'
        )
      ) {

        if (
          !isStaff(
            interaction.member
          )
        ) {

          return interaction.reply({

            content:
              '❌ ليس لديك صلاحية.',

            ephemeral:
              true

          });

        }

        const userId =
          interaction.customId.replace(
            'reject_modal_',
            ''
          );

        const reason =
          interaction.fields.getTextInputValue(
            'reason'
          );

        const embed =
          EmbedBuilder
            .from(
              interaction.message.embeds[0]
            )

            .setColor(
              RED
            )

            .setDescription(
`${interaction.message.embeds[0].description}

━━━━━━━━━━━━━━━━━━━━

## ❌ تم رفض التقديم

📝 **السبب:**
${reason}

👮 **تم الرفض بواسطة:**
${interaction.user}`
            );

        await interaction.update({

          embeds: [
            embed
          ],

          components: [

            new ActionRowBuilder()
              .addComponents(

                new ButtonBuilder()

                  .setCustomId(
                    'application_rejected'
                  )

                  .setLabel(
                    'تم رفض التقديم'
                  )

                  .setStyle(
                    ButtonStyle.Danger
                  )

                  .setDisabled(
                    true
                  )

              )

          ]

        });

        const user =
          await client.users
            .fetch(
              userId
            )
            .catch(
              () => null
            );

        if (user) {

          await user
            .send(
`❌ تم رفض تقديمك في **MOD 𝗦𝗧𝗥𝗘𝗔𝗠**.

📝 **السبب:**
${reason}`
            )
            .catch(
              () => {}
            );

          await appLog(

            '❌ تم رفض تقديم MOD 𝗦𝗧𝗥𝗘𝗔𝗠',

            RED,

            user,

            `📝 **السبب:** ${reason}\n👮 **المراجع:** ${interaction.user}`

          );

        }

        return;

      }

    }

    catch (error) {

      console.error(
        '❌ Interaction Error:',
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction
          .reply({

            content:
              '❌ حدث خطأ غير متوقع.',

            ephemeral:
              true

          })
          .catch(
            () => {}
          );

      }

    }

  }
);

// =========================================================
// LOGIN
// =========================================================

client
  .login(
    process.env.BOT_TOKEN
  )

  .catch(
    error => {

      console.error(
        '❌ Discord Login Error:',
        error.message
      );

      process.exit(1);

    }
  );
