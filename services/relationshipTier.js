const SPECIFIC_TIERS = ['1-3_years', '5-7_years'];

function findTier(yearsTogether, savedTier) {
  if (SPECIFIC_TIERS.includes(savedTier)) return savedTier;

  const years = Number(yearsTogether);
  if (years >= 1 && years <= 3) return '1-3_years';
  if (years >= 5 && years <= 7) return '5-7_years';

  return 'other';
}

module.exports = {
  findTier
};
