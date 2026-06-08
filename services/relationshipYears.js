const { findTier } = require('./relationshipTier');

const yearFields = [
  'yearsTogether',
  'yearsMarried',
  'marriedYears',
  'years_together',
  'years_married'
];

function normalizeYears(value) {
  if (value === undefined || value === null || value === '') return undefined;

  const years = Number(value);
  if (!Number.isFinite(years) || years < 0) return undefined;

  return years;
}

function yearsFromBody(body = {}) {
  for (const field of yearFields) {
    const years = normalizeYears(body[field]);
    if (years !== undefined) return years;
  }

  return undefined;
}

function relationshipData(years) {
  const normalizedYears = normalizeYears(years);
  if (normalizedYears === undefined) return {};

  return {
    yearsTogether: normalizedYears,
    yearsMarried: normalizedYears,
    relationshipTier: findTier(normalizedYears)
  };
}

function yearsForUser(user = {}) {
  const yearsTogether = normalizeYears(user.yearsTogether);
  const yearsMarried = normalizeYears(user.yearsMarried);

  if (yearsMarried !== undefined && (yearsTogether === undefined || yearsTogether === 0)) {
    return yearsMarried;
  }

  return yearsTogether ?? yearsMarried ?? 0;
}

module.exports = {
  normalizeYears,
  relationshipData,
  yearsForUser,
  yearsFromBody
};
