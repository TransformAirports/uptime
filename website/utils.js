function normalizeDeviceType(type) {
  if (!type) return '';
  return type.toLowerCase().replace(/s$/, '');
}

// Map a power status boolean to the corresponding indicator color.
// `true` indicates the device has power and returns green, otherwise red.
function getPowerColor(power) {
  return power ? 'green' : 'red';
}

// Map an alarm status boolean to the corresponding indicator color.
// `true` indicates an alarm condition and returns red, otherwise green.
function getAlarmColor(alarm) {
  return alarm ? 'red' : 'green';
}

if (typeof module !== 'undefined') {
  module.exports = { normalizeDeviceType, getPowerColor, getAlarmColor };
}
