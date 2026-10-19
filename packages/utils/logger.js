// ================================================================
//  Logger — re-export of the shared @aura/logger singleton.
//  This file previously duplicated the full Winston configuration;
//  it is kept as a compatibility shim for existing imports.
// ================================================================
export { logger, default } from '../logger/index.js';
