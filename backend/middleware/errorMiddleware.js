function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred',
    details: err.details || undefined,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
