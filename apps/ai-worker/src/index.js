export default {
  async fetch(request, env, ctx) {
    return new Response("Aura AI Worker is running!", { status: 200 });
  },

  async scheduled(event, env, ctx) {
    console.log("cron processed");
  }
};
