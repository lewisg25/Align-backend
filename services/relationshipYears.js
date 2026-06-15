const { findTier } = require('./relationshipTier');

const yearsTogetherFields = [
  'yearsTogether',
  'years_together'
];

const yearsMarriedFields = [
  'yearsMarried',
  'marriedYears',
  'marriageYears',
  'yearsBeenMarried',
  'years_married',
  'marriage_years',
  'years_been_married',
  'howLongMarried',
  'how_long_married'
];

const yearFields = [
  ...yearsTogetherFields,
  ...yearsMarriedFields
];

function normalizeYears(value) {
  if (value === undefined || value === null || value === '') return undefined;

  const years = Number(value);
  if (!Number.isFinite(years) || years < 0) return undefined;

  return years;
}

function yearsFromBody(body = {}) {
  return yearsFromFields(body, yearFields);
}

function yearsFromFields(body = {}, fields = []) {
  for (const field of fields) {
    const years = normalizeYears(body[field]);
    if (years !== undefined) return years;
  }

  return undefined;
}

function yearsMarriedFromBody(body = {}) {
  return yearsFromFields(body, yearsMarriedFields);
}

function yearsTogetherFromBody(body = {}) {
  return yearsFromFields(body, yearsTogetherFields);
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
  yearsMarriedFromBody,
  yearsForUser,
  yearsFromBody,
  yearsTogetherFromBody
};
