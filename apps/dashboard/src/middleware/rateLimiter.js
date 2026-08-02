// ================================================================
//  @aura/dashboard — Express Rate Limiter Middleware
// ================================================================

import rateLimit from 'express-rate-limit';
import logger from '@aura/logger';

export const createApiRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
    handler: (req, res, next, options) => {
      logger.warn(`[RateLimit] IP ${req.ip} exceeded rate limit on endpoint ${req.originalUrl}`);
      res.status(options.statusCode).send(options.message);
    },
  });
};

export default createApiRateLimiter;
