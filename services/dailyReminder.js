const User = require("../models/User");
const CheckIn = require("../models/checkIns");
const { currentWeek, dateKey } = require("./dateService");
const { sendReminder } = require("../utils/email");

const defaultReminderTime = "09:00";
const defaultTimezone = "America/New_York";
const reminderIntervalMs = 15 * 60 * 1000;

let reminderBusy = false;

function timeNumber(value = defaultReminderTime) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function localTime(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const entries = parts.map((part) => [part.type, part.value]);
  const value = Object.fromEntries(entries);

  return timeNumber(`${value.hour}:${value.minute}`);
}

function isDue(user, now) {
  const timezone = user.timezone || defaultTimezone;
  const today = dateKey(now, timezone);
  const sentToday =
    user.reminderSent && dateKey(user.reminderSent, timezone) === today;
  const reminderTime = user.reminderTime || defaultReminderTime;

  return !sentToday && localTime(now, timezone) >= timeNumber(reminderTime);
}

async function answeredToday(user, now) {
  const timezone = user.timezone || defaultTimezone;
  const today = dateKey(now, timezone);
  const checkIn = await CheckIn.findOne({
    user: user._id,
    weekIdentifier: currentWeek(),
  });

  return Boolean(
    checkIn?.responses.some((response) => {
      return (
        response.answeredAt && dateKey(response.answeredAt, timezone) === today
      );
    })
  );
}

async function runReminder() {
  if (reminderBusy) return;
  reminderBusy = true;

  try {
    const now = new Date();
    const users = await User.find({ reminderEnabled: true });

    for (const user of users) {
      if (!isDue(user, now) || (await answeredToday(user, now))) continue;

      try {
        await sendReminder(user);
        user.reminderSent = now;
        await user.save();
      } catch (error) {
        console.error(
          `Reminder email failed for ${user.email}: ${error.message}`
        );
      }
    }
  } catch (error) {
    console.error(`Daily reminder failed: ${error.message}`);
  } finally {
    reminderBusy = false;
  }
}

function startReminder() {
  runReminder();
  setInterval(runReminder, reminderIntervalMs);
}

module.exports = {
  runReminder,
  startReminder,
};
