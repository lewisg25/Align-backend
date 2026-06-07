function findTier(yearsTogether, savedTier) {
  if (savedTier && savedTier !== 'other') return savedTier;

  const years = Number(yearsTogether);
  if (years >= 1 && years <= 3) return '1-3_years';
  if (years >= 5 && years <= 7) return '5-7_years';

  return 'other';
}

module.exports = {
  findTier
};
