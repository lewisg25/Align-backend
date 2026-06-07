const ServiceError = require('./serviceError');

const DEFAULT_TIME = '09:00';
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function reminderPayload(user) {
  return {
    reminderEnabled: Boolean(user.reminderEnabled),
    reminderTime: user.reminderTime || DEFAULT_TIME
  };
}

async function updateReminder(user, body) {
  const reminderTime =
    body.reminderTime ||
    body.time ||
    user.reminderTime ||
    DEFAULT_TIME;
  const enabled = body.reminderEnabled ?? body.enabled;

  if (!TIME_RE.test(reminderTime)) {
    throw new ServiceError(400, 'Reminder time must look like 09:00.', 'message');
  }

  if (enabled !== undefined) user.reminderEnabled = Boolean(enabled);
  user.reminderTime = reminderTime;
  await user.save();

  return {
    message: 'Reminder updated.',
    ...reminderPayload(user)
  };
}

module.exports = {
  reminderPayload,
  updateReminder
};
