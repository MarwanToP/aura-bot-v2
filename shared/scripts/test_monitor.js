import 'dotenv/config';
import monitor from '../systems/monitor/monitorService.js';

async function test() {
    console.log("Sending test alert to Telegram...");
    await monitor.sendAlert("✅ **Test Alert**: Aura Bot Monitor is proudly connected and working perfectly!");
    console.log("Alert sent successfully. Check your Telegram!");
    process.exit(0);
}

test();
