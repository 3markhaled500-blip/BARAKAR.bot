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
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const CONFIG = {
  GUILD_ID: process.env.GUILD_ID,
  WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID,
  WELCOME_ROLE_ID: process.env.WELCOME_ROLE_ID,
  STREAMER_MOD_ROLE_ID: process.env.STREAMER_MOD_ROLE_ID,
  REVIEW_CHANNEL_ID: process.env.REVIEW_CHANNEL_ID,
  APPLICATION_PANEL_CHANNEL_ID: process.env.APPLICATION_PANEL_CHANNEL_ID,
  BANNER_URL: process.env.BANNER_URL
};

const questions = [
  "ما اسمك؟",
  "كم عمرك؟",
  "ما اسم حسابك في منصة البث؟ أرسل الرابط إن وجد.",
  "ما خبرتك في مجال الـ Streamer Mod؟",
  "لماذا تريد الانضمام إلى فريق Streamer Mod في BARAKAT COMMUNITY؟",
  "كم ساعة تستطيع التواجد يوميًا؟",
  "كيف ستتعامل مع مشكلة أو مخالفة أثناء بث مباشر؟",
  "هل تتعهد بالالتزام بقوانين السيرفر وعدم استغلال صلاحياتك؟"
];

const YELLOW = 0xF5B700;

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log("🟡 BARAKAT COMMUNITY BOT ONLINE");

  // إنشاء بانل التقديم بأمر من الكونسول/عند تشغيل البوت
  const channel = await client.channels
    .fetch(CONFIG.APPLICATION_PANEL_CHANNEL_ID)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    console.log("⚠️ لم يتم العثور على روم بانل التقديم.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle("🎥 BARAKAT COMMUNITY")
    .setDescription(
      "## Streamer Mod\n\n" +
      "هل ترغب في الانضمام إلى فريق **Streamer Mod**؟\n\n" +
      "اضغط على الزر بالأسفل لبدء التقديم.\n\n" +
      "📩 سيتم إرسال الأسئلة لك في الخاص.\n" +
      "📝 أجب عن جميع الأسئلة.\n" +
      "🔎 بعد الانتهاء سيتم إرسال طلبك إلى فريق المراجعة.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "🟡 **BARAKAT COMMUNITY**"
    )
    .setFooter({
      text: "BARAKAT COMMUNITY • Streamer Mod"
    });

  if (CONFIG.BANNER_URL) {
    embed.setImage(CONFIG.BANNER_URL);
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("streamer_apply")
      .setLabel("تقديم Streamer Mod")
      .setEmoji("🎥")
      .setStyle(ButtonStyle.Primary)
  );

  // البانل يتم إرساله مرة عند كل تشغيل
  await channel.send({
    embeds: [embed],
    components: [row]
  });

  console.log("✅ تم إرسال بانل Streamer Mod");
});

// =========================
// ترحيب + رول طلقاء
// =========================

client.on("guildMemberAdd", async member => {
  if (member.guild.id !== CONFIG.GUILD_ID) return;

  // إعطاء رول طلقاء
  const welcomeRole = await member.guild.roles
    .fetch(CONFIG.WELCOME_ROLE_ID)
    .catch(() => null);

  if (welcomeRole) {
    await member.roles.add(welcomeRole).catch(console.error);
  }

  const channel = await client.channels
    .fetch(CONFIG.WELCOME_CHANNEL_ID)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle("👋 أهلاً وسهلاً بك في BARAKAT COMMUNITY")
    .setDescription(
      `**نورت السيرفر يا ${member}!** 🟡\n\n` +
      "نتمنى لك وقتًا ممتعًا معنا ❤️\n\n" +
      "استمتع معنا والتزم بقوانين السيرفر."
    )
    .setThumbnail(member.user.displayAvatarURL({
      size: 512,
      extension: "png"
    }))
    .setFooter({
      text: "BARAKAT COMMUNITY"
    })
    .setTimestamp();

  if (CONFIG.BANNER_URL) {
    embed.setImage(CONFIG.BANNER_URL);
  }

  await channel.send({
    content: `${member}`,
    embeds: [embed]
  });
});

// =========================
// بدء التقديم
// =========================

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton() &&
      !interaction.isModalSubmit()) return;

  // زر تقديم Streamer Mod
  if (
    interaction.isButton() &&
    interaction.customId === "streamer_apply"
  ) {
    await interaction.deferReply({ ephemeral: true });

    let dm;

    try {
      dm = await interaction.user.createDM();

      await dm.send(
        "🎥 **BARAKAT COMMUNITY | STREAMER MOD**\n\n" +
        "أهلًا بك في نموذج التقديم.\n" +
        "سأرسل لك الأسئلة واحدًا تلو الآخر.\n\n" +
        "⏱️ لديك 5 دقائق للإجابة على كل سؤال.\n" +
        "❌ اكتب `إلغاء` إذا أردت إلغاء التقديم."
      );

    } catch {
      return interaction.editReply(
        "❌ لا أستطيع إرسال رسالة لك في الخاص. افتح الـDM ثم حاول مرة أخرى."
      );
    }

    const answers = [];

    for (let i = 0; i < questions.length; i++) {

      await dm.send(
        `**السؤال ${i + 1}/${questions.length}**\n\n${questions[i]}`
      );

      const collected = await dm.awaitMessages({
        filter: msg => msg.author.id === interaction.user.id,
        max: 1,
        time: 5 * 60 * 1000
      });

      if (!collected.size) {
        await dm.send("❌ انتهى وقت الإجابة وتم إلغاء التقديم.");
        return interaction.editReply(
          "❌ انتهى وقت التقديم."
        );
      }

      const answer = collected.first().content;

      if (
        answer.toLowerCase() === "إلغاء" ||
        answer.toLowerCase() === "cancel"
      ) {
        await dm.send("❌ تم إلغاء التقديم.");
        return interaction.editReply(
          "❌ تم إلغاء التقديم."
        );
      }

      answers.push(answer);
    }

    // إرسال التقديم للمراجعة
    const reviewChannel = await client.channels
      .fetch(CONFIG.REVIEW_CHANNEL_ID)
      .catch(() => null);

    if (!reviewChannel || !reviewChannel.isTextBased()) {
      await dm.send("❌ حدث خطأ في روم المراجعة.");
      return interaction.editReply("❌ روم المراجعة غير موجود.");
    }

    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle("📋 طلب Streamer Mod جديد")
      .setThumbnail(
        interaction.user.displayAvatarURL({
          size: 512,
          extension: "png"
        })
      )
      .setDescription(
        `👤 **المتقدم:** ${interaction.user}\n` +
        `🆔 **Discord ID:** \`${interaction.user.id}\`\n` +
        `🟡 **الحالة:** قيد المراجعة`
      )
      .setTimestamp()
      .setFooter({
        text: "BARAKAT COMMUNITY • Review System"
      });

    questions.forEach((question, index) => {
      embed.addFields({
        name: `${index + 1}️⃣ ${question}`,
        value: answers[index].slice(0, 1024),
        inline: false
      });
    });

    const buttons = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId(`accept_${interaction.user.id}`)
        .setLabel("قبول")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`reject_${interaction.user.id}`)
        .setLabel("رفض")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)
    );

    await reviewChannel.send({
      embeds: [embed],
      components: [buttons]
    });

    await dm.send(
      "✅ **تم إرسال تقديمك بنجاح!**\n\n" +
      "سيتم مراجعته من فريق BARAKAT COMMUNITY، " +
      "وستصلك النتيجة في الخاص."
    );

    await interaction.editReply(
      "✅ تم إرسال تقديمك إلى فريق المراجعة بنجاح."
    );
  }

  // =========================
  // قبول
  // =========================

  if (
    interaction.isButton() &&
    interaction.customId.startsWith("accept_")
  ) {

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      ) &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ ليس لديك صلاحية مراجعة التقديمات.",
        ephemeral: true
      });
    }

    const userId =
      interaction.customId.replace("accept_", "");

    const member =
      await interaction.guild.members
        .fetch(userId)
        .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ العضو غير موجود في السيرفر.",
        ephemeral: true
      });
    }

    const role =
      await interaction.guild.roles
        .fetch(CONFIG.STREAMER_MOD_ROLE_ID)
        .catch(() => null);

    if (!role) {
      return interaction.reply({
        content: "❌ رول Streamer Mod غير موجود.",
        ephemeral: true
      });
    }

    try {
      await member.roles.add(role);
    } catch {
      return interaction.reply({
        content:
          "❌ لم أستطع إعطاء الرول. تأكد أن رتبة البوت أعلى من رول Streamer Mod.",
        ephemeral: true
      });
    }

    const oldEmbed = interaction.message.embeds[0];

    const newEmbed = EmbedBuilder
      .from(oldEmbed)
      .setColor(0x2ECC71)
      .setDescription(
        `${oldEmbed.description}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `## ✅ تم قبول التقديم\n` +
        `👮 **تم قبوله بواسطة:** ${interaction.user}`
      );

    await interaction.update({
      embeds: [newEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("done")
            .setLabel("تم قبول التقديم")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        )
      ]
    });

    const user =
      await client.users.fetch(userId).catch(() => null);

    if (user) {
      await user.send(
        `🎉 **مبروك! تم قبول تقديمك كـ Streamer Mod**\n\n` +
        `في **BARAKAT COMMUNITY** 🟡\n\n` +
        `👮 تم قبولك بواسطة: **${interaction.user.username}**\n` +
        `🎭 تم إعطاؤك الرول بنجاح.`
      ).catch(() => {});
    }
  }

  // =========================
  // زر الرفض
  // =========================

  if (
    interaction.isButton() &&
    interaction.customId.startsWith("reject_")
  ) {

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      ) &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ ليس لديك صلاحية مراجعة التقديمات.",
        ephemeral: true
      });
    }

    const userId =
      interaction.customId.replace("reject_", "");

    const modal = new ModalBuilder()
      .setCustomId(`reject_modal_${userId}`)
      .setTitle("❌ رفض تقديم Streamer Mod");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("سبب الرفض")
      .setPlaceholder("اكتب سبب رفض التقديم...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(reason)
    );

    await interaction.showModal(modal);
  }

  // =========================
  // تأكيد الرفض
  // =========================

  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("reject_modal_")
  ) {

    const userId =
      interaction.customId.replace(
        "reject_modal_",
        ""
      );

    const reason =
      interaction.fields.getTextInputValue("reason");

    const oldEmbed = interaction.message.embeds[0];

    const newEmbed = EmbedBuilder
      .from(oldEmbed)
      .setColor(0xE74C3C)
      .setDescription(
        `${oldEmbed.description}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `## ❌ تم رفض التقديم\n` +
        `📝 **السبب:** ${reason}\n` +
        `👮 **تم رفضه بواسطة:** ${interaction.user}`
      );

    await interaction.update({
      embeds: [newEmbed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("done")
            .setLabel("تم رفض التقديم")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        )
      ]
    });

    const user =
      await client.users.fetch(userId).catch(() => null);

    if (user) {
      await user.send(
        `❌ **تم رفض تقديمك كـ Streamer Mod**\n\n` +
        `في **BARAKAT COMMUNITY**.\n\n` +
        `📝 **سبب الرفض:** ${reason}\n` +
        `👮 **بواسطة:** ${interaction.user.username}`
      ).catch(() => {});
    }
  }
});

client.login(process.env.BOT_TOKEN);
