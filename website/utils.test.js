const test = require('node:test');
const assert = require('node:assert');

const { normalizeDeviceType, getPowerColor, getAlarmColor } = require('./utils.js');

test('normalizeDeviceType removes trailing s from plural forms', () => {
  assert.strictEqual(normalizeDeviceType('escalators'), 'escalator');
  assert.strictEqual(normalizeDeviceType('elevators'), 'elevator');
  assert.strictEqual(normalizeDeviceType('sidewalks'), 'sidewalk');
});

test('normalizeDeviceType leaves singular forms unchanged', () => {
  assert.strictEqual(normalizeDeviceType('escalator'), 'escalator');
  assert.strictEqual(normalizeDeviceType('ELEVATOR'), 'elevator');
});

test('getPowerColor returns green for true and red for false', () => {
  assert.strictEqual(getPowerColor(true), 'green');
  assert.strictEqual(getPowerColor(false), 'red');
});

test('getAlarmColor returns red for true and green for false', () => {
  assert.strictEqual(getAlarmColor(true), 'red');
  assert.strictEqual(getAlarmColor(false), 'green');
});
