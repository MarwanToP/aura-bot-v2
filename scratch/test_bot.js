import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function test() {
    console.log('Testing Discord Token...');
    try {
        await client.login(process.env.DISCORD_TOKEN);
        console.log(`Success! Logged in as ${client.user.tag}`);
        process.exit(0);
    } catch (err) {
        console.error('Login failed:', err.message);
        process.exit(1);
    }
}

test();
