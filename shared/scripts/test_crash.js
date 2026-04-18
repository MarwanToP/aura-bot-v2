import 'dotenv/config';
import monitor from '../src/systems/monitor/monitorService.js';
import redis from '../src/database/redis.js';

async function simulateCrash() {
    console.log("Simulating a bot crash in Redis...");
    // Set bot heartbeat to 5 minutes ago to trigger the failure condition (older than 3 minutes)
    const fiveMinutesAgo = Date.now() - (60000 * 5);
    await redis.set(`aura:monitor:heartbeat:bot`, fiveMinutesAgo);
    
    // Clear any previous alert states so it fires
    await redis.del(`aura:monitor:alerted:bot`);
    
    console.log("Running health check manually...");
    await monitor.checkServices();
    
    console.log("Check complete. You should receive a CRITICAL offline alert on Telegram right now!");
    
    // Cleanup: Set it back to online and clear alert state to send a recovery!
    console.log("Simulating service recovery...");
    await redis.set(`aura:monitor:heartbeat:bot`, Date.now());
    await monitor.checkServices();
    console.log("Check complete. You should also receive a Recovery alert!");
    
    process.exit(0);
}

simulateCrash();
