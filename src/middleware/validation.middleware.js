const { z } = require('zod');
const { ValidationError } = require('../utils/errors');

function validateBody(schema) {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      schema.parse(body);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Request body validation failed', error.errors);
      }
      throw error;
    }
  };
}

function validateQuery(schema) {
  return async (c, next) => {
    try {
      const query = c.req.query();
      schema.parse(query);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Query parameter validation failed', error.errors);
      }
      throw error;
    }
  };
}

function validateParams(schema) {
  return async (c, next) => {
    try {
      const params = c.req.param();
      schema.parse(params);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('URL parameter validation failed', error.errors);
      }
      throw error;
    }
  };
}

module.exports = { validateBody, validateQuery, validateParams };
