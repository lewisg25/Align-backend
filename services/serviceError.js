class ServiceError extends Error {
  constructor(status, message, key = 'error') {
    super(message);
    this.status = status;
    this.key = key;
  }
}

module.exports = ServiceError;
