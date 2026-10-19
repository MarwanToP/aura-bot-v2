// Dev API launcher (`npm run server`): forces development mode BEFORE the
// config package loads, so a shared root .env with NODE_ENV=production cannot
// leak into the local dev instance (port 3000 collision with next dev,
// production-only secure cookies, missing Next production build, etc.).
// Production deployments use `npm start` (node src/server.js) and keep their
// real NODE_ENV.
process.env.NODE_ENV = 'development';
console.warn('⚠️ dev-api.js forces NODE_ENV=development — never use this entrypoint in production.');
await import('./server.js');
