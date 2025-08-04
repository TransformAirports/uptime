function normalizeDeviceType(type) {
  if (!type) return '';
  return type.toLowerCase().replace(/s$/, '');
}

if (typeof module !== 'undefined') {
  module.exports = { normalizeDeviceType };
}
