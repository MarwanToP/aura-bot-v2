// ================================================================
//  AURA BOT v2.0 — Aura Voice Assistant (AVA)
// ================================================================
import { joinVoiceChannel, VoiceReceiver, EndBehaviorType } from '@discordjs/voice';
import prism from 'prism-media';
import OpenAI from 'openai';
import logger from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * The Aura Voice Assistant (AVA)
 * Handles voice-to-command execution using Whisper + Gemini
 */
export async function startListening(client, member, channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  logger.info(`[AVA] Joined ${channel.name} to listen to ${member.user.tag}`);

  // We listen to the specific member who called the bot
  const receiver = connection.receiver;
  
  // Create a listener for when the user speaks
  const audioStream = receiver.subscribe(member.id, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1500, // Wait for 1.5s of silence
    },
  });

  // Transcode Opus -> PCM
  const opusDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
  const pcmStream   = audioStream.pipe(opusDecoder);

  const chunks = [];
  pcmStream.on('data', (chunk) => chunks.push(chunk));

  audioStream.on('end', async () => {
    logger.debug('[AVA] User finished speaking. Processing...');
    
    if (chunks.length === 0) return;

    const buffer = Buffer.concat(chunks);
    
    // We need to send this to Whisper. 
    // OpenAI expects a file, so we'll use a virtual file approach or temp file.
    try {
      const transcription = await transcribeAudio(buffer);
      if (!transcription) return;

      logger.info(`[AVA] Transcribed: "${transcription}"`);

      // Check for wake word "Aura"
      if (!transcription.toLowerCase().includes('aura')) {
        logger.debug('[AVA] Wake word not found. Ignoring.');
        return;
      }

      // Process intent with Gemini
      const intent = await parseIntent(client, transcription);
      if (intent) {
        await executeIntent(client, member, channel, intent);
      }
    } catch (err) {
      logger.error('[AVA] Processing error:', err.message);
    }

    // Re-subscribe to keep listening if we are still in the channel
    if (connection.state.status !== 'destroyed') {
      startListening(client, member, channel);
    }
  });
}

import { createTicket } from '../tickets/ticketSystem.js';
import * as economy from '../economy/economySystem.js';

/**
 * Convert raw PCM buffer to Whisper transcription (with WAV Header)
 */
async function transcribeAudio(buffer) {
  const tempFile = path.join(__dirname, `temp_voice_${Date.now()}.wav`);
  
  // Create WAV header
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + buffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20); // PCM
  wavHeader.writeUInt16LE(2, 22); // Channels
  wavHeader.writeUInt32LE(48000, 24); // Sample Rate
  wavHeader.writeUInt32LE(48000 * 4, 28); // Byte Rate
  wavHeader.writeUInt16LE(4, 32); // Block Align
  wavHeader.writeUInt16LE(16, 34); // Bits per Sample
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(buffer.length, 40);

  fs.writeFileSync(tempFile, Buffer.concat([wavHeader, buffer]));
  
  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: 'whisper-1',
    });
    return response.text;
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

/**
 * Use Gemini to map spoken text to a bot command
 */
async function parseIntent(client, text) {
  const prompt = `
    You are the Aura Voice Assistant. A user just said: "${text}".
    Standardize this into a Discord bot command action.
    
    Supported Actions:
    - action: "balance", params: {}
    - action: "work", params: {}
    - action: "daily", params: {}
    - action: "ticket_open", params: { reason: string }
    - action: "rep_give", params: { user: string }
    - action: "none"
    
    Output ONLY valid JSON.
    Example: { "action": "ticket_open", "params": { "reason": "billing help" } }
  `;

  const result = await client.ai.generateResponse(prompt, 'system');
  try {
    return JSON.parse(result.content);
  } catch {
    return null;
  }
}

/**
 * Execute the recognized command
 */
async function executeIntent(client, member, channel, intent) {
  logger.info(`[AVA] Executing intent: ${intent.action}`);
  
  const guild = channel.guild;
  let statusMsg = '';

  switch (intent.action) {
    case 'ticket_open':
      const tRes = await createTicket(client, guild, member.user, { category: intent.params.reason || 'Voice Request' });
      statusMsg = tRes.error ? `❌ ${tRes.error}` : `🎫 Ticket opened: <#${tRes.channel.id}>`;
      break;

    case 'balance':
      const wallet = await economy.credits.execute(client, { user: member.user, guildId: guild.id, deferReply: () => {}, editReply: (obj) => channel.send(obj) });
      return; // Handled by standard command

    case 'work':
      await economy.work.execute(client, { user: member.user, guildId: guild.id, deferReply: () => {}, editReply: (obj) => channel.send(obj) });
      return;

    default:
      statusMsg = `❓ I understood "${intent.action}", but I can't do that yet.`;
  }

  if (statusMsg) {
    const msg = await channel.send(`🎙️ **Voice Assistant:** ${statusMsg}`);
    setTimeout(() => msg.delete().catch(() => {}), 10000);
  }
}
