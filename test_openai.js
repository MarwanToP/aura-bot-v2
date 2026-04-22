import { toFile } from 'openai';
import fs from 'fs';

async function run() {
  const wavHeader = Buffer.alloc(44);
  const buffer = Buffer.alloc(100);
  const combined = Buffer.concat([wavHeader, buffer]);

  const file = await toFile(combined, 'audio.wav');
  console.log(file);
}
run();
