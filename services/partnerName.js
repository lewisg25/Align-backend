const partnerNameFields = [
  'partnerName',
  'partner_name',
  'partnersName'
];

function normalizePartnerName(value) {
  if (typeof value !== 'string') return undefined;

  const partnerName = value.trim();
  return partnerName || undefined;
}

function partnerNameFromBody(body = {}) {
  for (const field of partnerNameFields) {
    const partnerName = normalizePartnerName(body[field]);
    if (partnerName !== undefined) return partnerName;
  }

  return undefined;
}

function partnerNameData(body = {}) {
  const partnerName = partnerNameFromBody(body);
  return partnerName === undefined ? {} : { partnerName };
}

module.exports = {
  normalizePartnerName,
  partnerNameData,
  partnerNameFromBody
};
