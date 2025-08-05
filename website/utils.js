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

// Count the number of devices that are online. A device is considered online
// when `power` is true and `alarm` is false. The `monitored` flag is ignored;
// devices without a `monitored` property should still be counted if their
// power and alarm values indicate an online state.
function countOnlineDevices(devices) {
  if (!Array.isArray(devices)) return 0;
  return devices.filter((device) => device && device.power && !device.alarm).length;
}

if (typeof module !== 'undefined') {
  module.exports = {
    normalizeDeviceType,
    getPowerColor,
    getAlarmColor,
    countOnlineDevices,
  };
}
