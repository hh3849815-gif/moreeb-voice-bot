const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');

const MEETING_ROOM = '1246606351552217158';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('clientReady', () => {
  console.log(`✅ بوت التتبع شغال: ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.member?.id || oldState.member?.id;
  if (!userId) return;
  if (newState.member?.user?.bot || oldState.member?.user?.bot) return;
  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;
  if (oldChannelId === newChannelId) return;
  console.log(`🔊 ${userId}: ${oldChannelId || 'خارج'} → ${newChannelId || 'خارج'}`);
  sendToWorker('/voice', { userId, oldChannelId, newChannelId });
  const guild = client.guilds.cache.get(newState.guild?.id || oldState.guild?.id);
  if (guild) {
    const channel = guild.channels.cache.get(MEETING_ROOM);
    if (channel) {
      const members = channel.members.filter(m => !m.user.bot).map(m => m.id);
      sendToWorker('/api/meeting-members', { members });
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== '1245870300579762236') return;
  if (message.mentions.users.size === 0) return;
  for (const [userId, user] of message.mentions.users) {
    if (user.bot) continue;
    try {
      await user.send({
        embeds: [{
          title: '⚠️ إنذار إداري',
          description: 'تم إعطائك إنذار إداري من إدارة مرعب سيرفر.\nيرجى الالتزام بقوانين السيرفر.',
          color: 0xED4245,
          timestamp: new Date().toISOString(),
          footer: { text: 'مرعب سيرفر' }
        }]
      });
      console.log(`✅ تم إرسال إنذار لـ ${user.tag}`);
    } catch(e) {
      console.log(`❌ ما قدر يرسل لـ ${user.tag}`);
    }
  }
});

function sendToWorker(path, data) {
  try {
    const workerUrl = new URL(process.env.WORKER_URL);
    const body = JSON.stringify(data);
    const options = {
      hostname: workerUrl.hostname,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options);
    req.write(body);
    req.end();
  } catch(e) {
    console.error('خطأ:', e);
  }
}

client.login(process.env.DISCORD_TOKEN);
