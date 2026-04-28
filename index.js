const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.on('ready', () => {
  console.log(`✅ بوت التتبع شغال: ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.member?.id || oldState.member?.id;
  if (!userId) return;
  if (newState.member?.user?.bot) return;

  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;
  if (oldChannelId === newChannelId) return;

  console.log(`🔊 ${userId}: ${oldChannelId || 'خارج'} → ${newChannelId || 'خارج'}`);

  const data = JSON.stringify({ userId, oldChannelId, newChannelId });
  const workerUrl = new URL(process.env.WORKER_URL);

  const options = {
    hostname: workerUrl.hostname,
    path: workerUrl.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options);
  req.write(data);
  req.end();
});

client.login(process.env.DISCORD_TOKEN);
