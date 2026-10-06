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
  GUILD_ID: '1525640813831258183',

  WELCOME_CHANNEL_ID: '1525643339699847178',
  WELCOME_ROLE_ID: '1532611461245964389',

  STREAMER_MOD_ROLE_ID: '1550780555753299968',
  REVIEW_CHANNEL_ID: '1550783950060789880',
  APPLICATION_PANEL_CHANNEL_ID: '1550783900261818468',

  RULES_CHANNEL_ID: '1525642864640528435',

  TICKET_PANEL_CHANNEL_ID: '1553140280742510622',
  TICKET_CATEGORY_ID: '1553139841007620267',
  STAFF_ROLE_ID: '1556821008927948810',

  BANNER_URL:
    'https://cdn.discordapp.com/banners/1545951349919711282/2744d1c5046464da9883162cb9f01183.webp?size=1024'
};

const YELLOW = 0xF5B700;
const GREEN = 0x2ECC71;
const RED = 0xE74C3C;
const BLUE = 0x3498DB;

const questions = [
  'ما اسمك؟',
  'كم عمرك؟',
  'الخبرة في؟ 𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠.',
  'عاوز تقدم مود تيك توك ولا كيك؟',
  'ازاي تعمل؟ (Ban) للشخص وامتى تعمل له (Ban)',
  'تعمل ايه عشان تعمل تصويت (وامتى تعمل تصويت)؟',
  'تعمل ايه عشان تغير وضع اللعبة (وامتى تغير وضع اللعبة)؟',
  'ازاي تعين عنوان البث؟'
];

const activeApplications = new Set();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

function isStaff(interaction) {
  const permissions = interaction.memberPermissions;

  return !!(
    permissions?.has(PermissionsBitField.Flags.Administrator) ||
    permissions?.has(PermissionsBitField.Flags.ManageGuild) ||
    interaction.member?.roles?.cache?.has(CONFIG.STAFF_ROLE_ID)
  );
}

async function panel(channel, marker, payload) {
  const messages = await channel.messages
    .fetch({ limit: 50 })
    .catch(() => null);

  const oldMessage = messages?.find(
    message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed => embed.footer?.text === marker)
  );

  if (oldMessage) {
    return oldMessage.edit(payload).catch(console.error);
  }

  return channel.send(payload).catch(console.error);
}

async function setupPanels(guild) {
  // =========================
  // MOD STREAM APPLICATION
  // =========================

  const applicationChannel = guild.channels.cache.get(
    CONFIG.APPLICATION_PANEL_CHANNEL_ID
  );

  if (applicationChannel?.isTextBased()) {
    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle('🎥 BARAKAT COMMUNITY')
      .setDescription(
        `## 🎥 𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠

هل ترغب في الانضمام إلى فريق **𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠**؟

اضغط على الزر بالأسفل لبدء التقديم.

📩 **الأسئلة:** سيتم إرسالها لك في الخاص.
📝 **الإجابة:** سؤال ثم جواب.
🔎 **المراجعة:** سيتم إرسال التقديم لفريق المراجعة.
📨 **النتيجة:** ستصلك في الخاص.

━━━━━━━━━━━━━━━━━━━━
🟡 **BARAKAT COMMUNITY**`
      )
      .setImage(CONFIG.BANNER_URL)
      .setFooter({ text: 'BARAKAT_APPLICATION_PANEL' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('streamer_apply')
        .setLabel('تقديم 𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠')
        .setEmoji('🎥')
        .setStyle(ButtonStyle.Primary)
    );

    await panel(
      applicationChannel,
      'BARAKAT_APPLICATION_PANEL',
      {
        embeds: [embed],
        components: [row]
      }
    );
  }

  // =========================
  // RULES
  // =========================

  const rulesChannel = guild.channels.cache.get(
    CONFIG.RULES_CHANNEL_ID
  );

  if (rulesChannel?.isTextBased()) {
    const rules = [
      'احترام جميع الأعضاء وعدم السب أو التنمر.',
      'ممنوع الألفاظ العنصرية أو المسيئة.',
      'ممنوع السبام أو الإزعاج أو المنشن المتكرر.',
      'ممنوع الإعلانات أو روابط السيرفرات الأخرى بدون إذن الإدارة.',
      'استخدم كل روم في الغرض المخصص له.',
      'ممنوع نشر أي محتوى غير مناسب.',
      'ممنوع انتحال شخصية الأعضاء أو الإدارة.',
      'ممنوع نشر المعلومات الشخصية بدون موافقة صاحبها.',
      'ممنوع الغش أو الاحتيال أو الروابط والملفات الضارة.',
      'احترام قرارات الإدارة وتقديم الشكاوى بطريقة محترمة.',
      'ممنوع افتعال المشاكل أو إثارة النزاعات.'
    ];

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle('📜 قوانين BARAKAT COMMUNITY')
      .setDescription(
        rules
          .map((rule, index) => `**${index + 1}.** ${rule}`)
          .join('\n\n')
      )
      .setFooter({
        text: 'BARAKAT_RULES_PANEL'
      });

    await panel(
      rulesChannel,
      'BARAKAT_RULES_PANEL',
      {
        embeds: [embed]
      }
    );
  }

  // =========================
  // TICKETS
  // =========================

  const ticketChannel = guild.channels.cache.get(
    CONFIG.TICKET_PANEL_CHANNEL_ID
  );

  if (ticketChannel?.isTextBased()) {
    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle('🎫 نظام التذاكر')
      .setDescription(
        `اختار نوع التذكرة من القائمة بالأسفل.

🛠️ **الدعم الفني**
⚖️ **شكوى / عقوبة**
🎥 **Stream Support**
🎬 **Editor Application**`
      )
      .setFooter({
        text: 'BARAKAT_TICKET_PANEL'
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_type')
      .setPlaceholder('اختر نوع التذكرة')
      .addOptions(
        {
          label: 'الدعم الفني',
          description: 'للمشاكل والاستفسارات التقنية',
          value: 'technical',
          emoji: '🛠️'
        },
        {
          label: 'شكوى / عقوبة',
          description: 'لتقديم شكوى أو الاعتراض على عقوبة',
          value: 'complaint',
          emoji: '⚖️'
        },
        {
          label: 'Stream Support',
          description: 'دعم ومشاكل البث',
          value: 'stream',
          emoji: '🎥'
        },
        {
          label: 'Editor Application',
          description: 'التقديم على الإيديتور',
          value: 'editor',
          emoji: '🎬'
        }
      );

    await panel(
      ticketChannel,
      'BARAKAT_TICKET_PANEL',
      {
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(menu)
        ]
      }
    );
  }
}

function ticketName(user, type) {
  const username = user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 18);

  return `ticket-${type}-${username || user.id.slice(-6)}`;
}

async function createTicket(interaction, type) {
  const existing = interaction.guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildText &&
      channel.parentId === CONFIG.TICKET_CATEGORY_ID &&
      channel.topic === `ticket:${interaction.user.id}`
  );

  if (existing) {
    return interaction.reply({
      content: `❌ لديك تذكرة مفتوحة بالفعل: ${existing}`,
      ephemeral: true
    });
  }

  const labels = {
    technical: 'الدعم الفني',
    complaint: 'شكوى / عقوبة',
    stream: 'Stream Support',
    editor: 'Editor Application'
  };

  const channel = await interaction.guild.channels.create({
    name: ticketName(interaction.user, type),
    type: ChannelType.GuildText,
    parent: CONFIG.TICKET_CATEGORY_ID,
    topic: `ticket:${interaction.user.id}`,

    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      },

      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles
        ]
      },

      {
        id: CONFIG.STAFF_ROLE_ID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageMessages
        ]
      }
    ]
  });

  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`🎫 ${labels[type]}`)
    .setDescription(
      `أهلًا ${interaction.user}.

اكتب مشكلتك بالتفصيل وانتظر أحد أعضاء الإدارة.`
    )
    .setFooter({
      text: 'BARAKAT_TICKET'
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('إغلاق التذكرة')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${interaction.user} <@&${CONFIG.STAFF_ROLE_ID}>`,
    embeds: [embed],
    components: [row]
  });

  return interaction.reply({
    content: `✅ تم إنشاء تذكرتك: ${channel}`,
    ephemeral: true
  });
}

// =========================
// BOT READY
// =========================

client.once('ready', async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      {
        name: 'BARAKAT COMMUNITY',
        type: ActivityType.Watching
      }
    ],
    status: 'online'
  });

  const guild = client.guilds.cache.get(CONFIG.GUILD_ID);

  if (!guild) {
    return console.error('❌ لم يتم العثور على السيرفر.');
  }

  await setupPanels(guild);

  console.log(
    '✅ تم تجهيز MOD STREAM + Rules + Tickets.'
  );
});

// =========================
// WELCOME
// =========================

client.on('guildMemberAdd', async member => {
  try {
    if (member.guild.id !== CONFIG.GUILD_ID) return;

    const role = member.guild.roles.cache.get(
      CONFIG.WELCOME_ROLE_ID
    );

    if (role) {
      await member.roles.add(role).catch(console.error);
    }

    const channel = member.guild.channels.cache.get(
      CONFIG.WELCOME_CHANNEL_ID
    );

    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle(
        '👋 أهلاً وسهلاً بك في BARAKAT COMMUNITY'
      )
      .setDescription(
        `## نورت السيرفر يا ${member}

أهلاً وسهلاً بك في **BARAKAT COMMUNITY** ❤️

🎮 نتمنى لك وقتًا ممتعًا معنا.
📜 لا تنسَ قراءة القوانين.

━━━━━━━━━━━━━━━━━━━━
👤 العضو: ${member}
🆔 ID: \`${member.id}\`

🟡 **استمتع بوقتك معنا!**`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          size: 512
        })
      )
      .setImage(CONFIG.BANNER_URL)
      .setFooter({
        text: 'BARAKAT COMMUNITY'
      })
      .setTimestamp();

    await channel.send({
      content: `${member}`,
      embeds: [embed]
    });
  } catch (error) {
    console.error(
      '❌ Welcome Error:',
      error
    );
  }
});

// =========================
// INTERACTIONS
// =========================

client.on(
  'interactionCreate',
  async interaction => {
    try {
      // =========================
      // BUTTONS
      // =========================

      if (interaction.isButton()) {

        // =========================
        // MOD STREAM APPLY
        // =========================

        if (
          interaction.customId ===
          'streamer_apply'
        ) {
          const user = interaction.user;

          if (
            activeApplications.has(user.id)
          ) {
            return interaction.reply({
              content:
                '⚠️ لديك تقديم قيد التنفيذ بالفعل. راجع الخاص.',
              ephemeral: true
            });
          }

          activeApplications.add(user.id);

          try {
            await interaction.reply({
              content:
                '📩 تم بدء التقديم. افتح الخاص مع البوت للإجابة على الأسئلة.',
              ephemeral: true
            });

            const dm =
              await user.createDM();

            await dm.send(
              `━━━━━━━━━━━━━━━━━━━━
🎥 **BARAKAT COMMUNITY**

## 𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠 Application

أهلًا بك في نموذج التقديم.

سأرسل لك الأسئلة واحدًا تلو الآخر.

⏱️ لديك **5 دقائق** للإجابة على كل سؤال.

❌ للإلغاء اكتب \`إلغاء\` أو \`cancel\`.

━━━━━━━━━━━━━━━━━━━━`
            );

            const answers = [];

            for (
              let i = 0;
              i < questions.length;
              i++
            ) {
              await dm.send(
                `━━━━━━━━━━━━━━━━━━━━
### السؤال ${i + 1}/${questions.length}

${questions[i]}

أرسل إجابتك الآن.`
              );

              const collected =
                await dm.awaitMessages({
                  filter: message =>
                    message.author.id === user.id,

                  max: 1,

                  time:
                    5 * 60 * 1000
                });

              if (!collected.size) {
                await dm.send(
                  '❌ انتهى وقت الإجابة وتم إلغاء التقديم.'
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

              answers.push(answer);
            }

            const review =
              interaction.guild.channels.cache.get(
                CONFIG.REVIEW_CHANNEL_ID
              );

            if (!review?.isTextBased()) {
              await dm.send(
                '❌ لم يتم العثور على روم المراجعة.'
              );

              return;
            }

            const embed =
              new EmbedBuilder()
                .setColor(YELLOW)
                .setTitle(
                  '📋 طلب 𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠 جديد'
                )
                .setThumbnail(
                  user.displayAvatarURL({
                    size: 512
                  })
                )
                .setDescription(
                  `━━━━━━━━━━━━━━━━━━━━
👤 **المتقدم:** ${user}
🆔 **Discord ID:** \`${user.id}\`
🟡 **الحالة:** قيد المراجعة
━━━━━━━━━━━━━━━━━━━━`
                )
                .setTimestamp()
                .setFooter({
                  text:
                    'BARAKAT COMMUNITY • Review System'
                });

            questions.forEach(
              (question, index) => {
                embed.addFields({
                  name:
                    `${index + 1}️⃣ ${question}`.slice(
                      0,
                      256
                    ),

                  value:
                    (
                      answers[index] ||
                      'لا توجد إجابة.'
                    ).slice(0, 1024)
                });
              }
            );

            const row =
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    `accept_${user.id}`
                  )
                  .setLabel('قبول')
                  .setEmoji('✅')
                  .setStyle(
                    ButtonStyle.Success
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    `reject_${user.id}`
                  )
                  .setLabel('رفض')
                  .setEmoji('❌')
                  .setStyle(
                    ButtonStyle.Danger
                  )
              );

            await review.send({
              embeds: [embed],
              components: [row]
            });

            await dm.send(
              `━━━━━━━━━━━━━━━━━━━━
✅ **تم إرسال تقديمك بنجاح!**

تم إرسال طلبك إلى فريق المراجعة.

📩 ستصلك النتيجة في الخاص.

🟡 **BARAKAT COMMUNITY**
━━━━━━━━━━━━━━━━━━━━`
            );

            await interaction.editReply({
              content:
                '✅ تم إرسال تقديمك إلى فريق المراجعة بنجاح.'
            });

          } catch (error) {
            console.error(
              '❌ Application Error:',
              error
            );

            await interaction
              .editReply({
                content:
                  '❌ حدث خطأ أثناء التقديم. حاول مرة أخرى.'
              })
              .catch(() => {});
          } finally {
            activeApplications.delete(
              user.id
            );
          }

          return;
        }

        // =========================
        // ACCEPT
        // =========================

        if (
          interaction.customId.startsWith(
            'accept_'
          )
        ) {
          if (!isStaff(interaction)) {
            return interaction.reply({
              content:
                '❌ ليس لديك صلاحية مراجعة التقديمات.',
              ephemeral: true
            });
          }

          const userId =
            interaction.customId.replace(
              'accept_',
              ''
            );

          const member =
            await interaction.guild.members
              .fetch(userId)
              .catch(() => null);

          if (!member) {
            return interaction.reply({
              content:
                '❌ العضو غير موجود في السيرفر.',
              ephemeral: true
            });
          }

          const role =
            interaction.guild.roles.cache.get(
              CONFIG.STREAMER_MOD_ROLE_ID
            );

          if (!role) {
            return interaction.reply({
              content:
                '❌ لم يتم العثور على رول Streamer Mod.',
              ephemeral: true
            });
          }

          try {
            await member.roles.add(
              role
            );
          } catch {
            return interaction.reply({
              content:
                '❌ لم أستطع إعطاء الرول. تأكد أن رتبة البوت أعلى من رتبة Streamer Mod.',
              ephemeral: true
            });
          }

          const old =
            interaction.message.embeds[0];

          const embed =
            EmbedBuilder.from(old)
              .setColor(GREEN)
              .setDescription(
                `${old.description || ''}

━━━━━━━━━━━━━━━━━━━━
## ✅ تم قبول التقديم

👮 **تم قبوله بواسطة:** ${interaction.user}`
              )
              .setFooter({
                text:
                  'BARAKAT COMMUNITY • ACCEPTED'
              });

          const row =
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(
                  'application_done'
                )
                .setLabel(
                  'تم قبول التقديم'
                )
                .setEmoji('✅')
                .setStyle(
                  ButtonStyle.Success
                )
                .setDisabled(true)
            );

          await interaction.update({
            embeds: [embed],
            components: [row]
          });

          const user =
            await client.users
              .fetch(userId)
              .catch(() => null);

          if (user) {
            await user
              .send(
                `━━━━━━━━━━━━━━━━━━━━
🎉 **مبروك!**

تم **قبول** تقديمك كـ **مقبول مبدئيًا** في:

🟡 **𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠**

👮 **تم قبولك بواسطة:** ${interaction.user.username}

🎭 تم إعطاؤك الرول بنجاح. استعد للمقابلة النهائية.

━━━━━━━━━━━━━━━━━━━━`
              )
              .catch(() => {});
          }

          return;
        }

        // =========================
        // REJECT
        // =========================

        if (
          interaction.customId.startsWith(
            'reject_'
          )
        ) {
          if (!isStaff(interaction)) {
            return interaction.reply({
              content:
                '❌ ليس لديك صلاحية مراجعة التقديمات.',
              ephemeral: true
            });
          }

          const userId =
            interaction.customId.replace(
              'reject_',
              ''
            );

          const modal =
            new ModalBuilder()
              .setCustomId(
                `reject_modal_${userId}`
              )
              .setTitle(
                '❌ رفض MOD STREAM'
              );

          const reason =
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('سبب الرفض')
              .setPlaceholder(
                'اكتب سبب رفض التقديم هنا...'
              )
              .setStyle(
                TextInputStyle.Paragraph
              )
              .setRequired(true)
              .setMaxLength(1000);

          modal.addComponents(
            new ActionRowBuilder().addComponents(
              reason
            )
          );

          await interaction.showModal(
            modal
          );

          return;
        }

        // =========================
        // CLOSE TICKET
        // =========================

        if (
          interaction.customId ===
          'close_ticket'
        ) {
          if (!isStaff(interaction)) {
            return interaction.reply({
              content:
                '❌ لا يمكنك إغلاق التذكرة.',
              ephemeral: true
            });
          }

          await interaction.reply(
            '🔒 سيتم إغلاق التذكرة خلال 3 ثوانٍ.'
          );

          setTimeout(() => {
            interaction.channel
              .delete()
              .catch(() => {});
          }, 3000);

          return;
        }
      }

      // =========================
      // REJECT MODAL
      // =========================

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          'reject_modal_'
        )
      ) {
        if (!isStaff(interaction)) {
          return interaction.reply({
            content:
              '❌ ليس لديك صلاحية مراجعة التقديمات.',
            ephemeral: true
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

        const old =
          interaction.message?.embeds?.[0];

        if (!old) {
          return interaction.reply({
            content:
              '❌ لم أستطع العثور على طلب التقديم.',
            ephemeral: true
          });
        }

        const embed =
          EmbedBuilder.from(old)
            .setColor(RED)
            .setDescription(
              `${old.description || ''}

━━━━━━━━━━━━━━━━━━━━
## ❌ تم رفض التقديم

📝 **سبب الرفض:** ${reason}

👮 **تم رفضه بواسطة:** ${interaction.user}`
            )
            .setFooter({
              text:
                'BARAKAT COMMUNITY • REJECTED'
            });

        const row =
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(
                'application_rejected'
              )
              .setLabel(
                'تم رفض التقديم'
              )
              .setEmoji('❌')
              .setStyle(
                ButtonStyle.Danger
              )
              .setDisabled(true)
          );

        await interaction.update({
          embeds: [embed],
          components: [row]
        });

        const user =
          await client.users
            .fetch(userId)
            .catch(() => null);

        if (user) {
          await user
            .send(
              `━━━━━━━━━━━━━━━━━━━━
❌ **تم رفض تقديمك**

تقديمك كـ **𝗠𝗢𝗗 𝗦𝗧𝗥𝗘𝗔𝗠** في **BARAKAT COMMUNITY**.

📝 **سبب الرفض:** ${reason}

👮 **تم الرفض بواسطة:** ${interaction.user.username}

يمكنك التقديم مرة أخرى إذا تم فتح التقديم من جديد.

━━━━━━━━━━━━━━━━━━━━`
            )
            .catch(() => {});
        }

        return;
      }

      // =========================
      // TICKET SELECT MENU
      // =========================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          'ticket_type'
      ) {
        await createTicket(
          interaction,
          interaction.values[0]
        );

        return;
      }

    } catch (error) {
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
            ephemeral: true
          })
          .catch(() => {});
      }
    }
  }
);

// =========================
// LOGIN
// =========================

if (!process.env.BOT_TOKEN) {
  console.error(
    '❌ BOT_TOKEN غير موجود في Railway Variables.'
  );

  process.exit(1);
}

client
  .login(process.env.BOT_TOKEN)
  .catch(error => {
    console.error(
      '❌ Discord Login Error:',
      error.message
    );

    process.exit(1);
  });   
