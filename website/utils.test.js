const test = require('node:test');
const assert = require('node:assert');

const { normalizeDeviceType } = require('./utils.js');

test('normalizeDeviceType removes trailing s from plural forms', () => {
  assert.strictEqual(normalizeDeviceType('escalators'), 'escalator');
  assert.strictEqual(normalizeDeviceType('elevators'), 'elevator');
  assert.strictEqual(normalizeDeviceType('sidewalks'), 'sidewalk');
});

test('normalizeDeviceType leaves singular forms unchanged', () => {
  assert.strictEqual(normalizeDeviceType('escalator'), 'escalator');
  assert.strictEqual(normalizeDeviceType('ELEVATOR'), 'elevator');
});
