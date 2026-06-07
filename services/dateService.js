const DAY_MS = 86400000;
const DEFAULT_TZ = 'America/New_York';

function currentWeek() {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const dayNumber = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((date - yearStart) / DAY_MS + 1) / 7);

  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function dateKey(date, timeZone = DEFAULT_TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
}

function utcTime(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function tomorrowKey(timeZone = DEFAULT_TZ) {
  const tomorrowTime = utcTime(dateKey(new Date(), timeZone)) + DAY_MS;
  return new Date(tomorrowTime).toISOString().slice(0, 10);
}

module.exports = {
  currentWeek,
  dateKey,
  tomorrowKey,
  utcTime,
  validDate
};
