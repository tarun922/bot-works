const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const ytdlp = require('yt-dlp-exec').raw;
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');

const TOKEN = 'YOUR_DISCORD_BOT_TOKEN';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (!msg.content.startsWith('!play') || msg.author.bot) return;

  const url = msg.content.split(' ')[1];
  if (!url) return msg.reply('❌ Provide a YouTube link');

  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel) return msg.reply('❌ Join a voice channel first');

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: msg.guild.id,
    adapterCreator: msg.guild.voiceAdapterCreator,
  });

  const stream = spawn(ytdlp, ['-f', 'bestaudio', '-o', '-', url], {
    stdio: ['ignore', 'pipe', 'ignore']
  });

  const ffmpegStream = spawn(ffmpeg, [
    '-i', 'pipe:0',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1'
  ], {
    stdio: ['pipe', 'pipe', 'ignore']
  });

  stream.stdout.pipe(ffmpegStream.stdin);

  const resource = createAudioResource(ffmpegStream.stdout);
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    }
  });

  player.play(resource);
  connection.subscribe(player);

  msg.reply('🎶 Now playing...');
});

client.login(TOKEN);
