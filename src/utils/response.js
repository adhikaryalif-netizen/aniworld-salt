function sendSuccess(c, data, message, statusCode = 200) {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  c.status(statusCode);
  return c.json(response);
}

function sendError(c, error, statusCode = 500, message) {
  const errorMessage = error instanceof Error ? error.message : error;
  const response = {
    success: false,
    error: errorMessage,
    message,
    timestamp: new Date().toISOString(),
  };
  c.status(statusCode);
  return c.json(response);
}

function sendPaginated(c, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const response = {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
    timestamp: new Date().toISOString(),
  };
  c.status(200);
  return c.json(response);
}

module.exports = { sendSuccess, sendError, sendPaginated };
