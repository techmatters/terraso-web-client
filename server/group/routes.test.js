/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

const express = require('express');
const request = require('supertest');

jest.mock('../config', () => ({
  apiUrl: 'https://api.example.org',
  baseUrl: 'https://terraso.example',
  apiTimeout: 10000,
}));
jest.mock('../utils/clientBundle', () => ({
  getCachedHtml: () => '<html><head><title>Default</title><meta name="description" content="Default"/><meta property="og:title" content="Default"/><meta property="og:description" content="Default"/></head></html>',
}));

const routes = require('./routes');
const app = express();
app.use('/groups', routes);
app.use((req, res) => res.send('fallback'));
const response = nodes => ({
  ok: true,
  json: async () => ({ data: { groups: { edges: nodes.map(node => ({ node })) } } }),
});
const group = { slug: 'river', name: 'River & Valley', description: 'Public description' };
let originalFetch;
beforeEach(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

test('uses anonymous exact-slug data for escaped group metadata and canonical URL', async () => {
  global.fetch = jest.fn().mockResolvedValue(response([group]));
  const { text } = await request(app).get('/groups/river?tracking=1').set('Cookie', 'session=private').expect(200);
  expect(text).toContain('<title>River &amp; Valley | Terraso</title>');
  expect(text).toContain('Public description');
  expect(text).toContain('<link rel="canonical" href="https://terraso.example/groups/river"/>');
  const options = global.fetch.mock.calls[0][1];
  expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
  expect(JSON.parse(options.body).variables).toEqual({ slug: 'river' });
});

test('uses a group-specific fallback for an empty description', async () => {
  global.fetch = jest.fn().mockResolvedValue(response([{ ...group, description: '  ' }]));
  const { text } = await request(app).get('/groups/river').expect(200);
  expect(text).toContain('content="River &amp; Valley | Terraso"');
});

test('normalizes a trailing slash only for a verified group', async () => {
  global.fetch = jest.fn().mockResolvedValue(response([group]));
  await request(app).get('/groups/river/?a=1').expect(301).expect('Location', '/groups/river?a=1');
});

test('does not inject metadata for missing, mismatched, ambiguous or partial results', async () => {
  for (const result of [response([]), response([{ ...group, slug: 'other' }]), response([{ ...group, name: '' }]), response([group, group]), { ok: true, json: async () => ({ errors: [{}], data: { groups: { edges: [{ node: group }] } } }) }, { ok: false }]) {
    global.fetch = jest.fn().mockResolvedValue(result);
    const { text } = await request(app).get('/groups/river').expect(200);
    expect(text).toBe('fallback');
  }
});

test('falls back when the API request fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await request(app).get('/groups/river').expect(200, 'fallback');
  } finally {
    log.mockRestore();
  }
});

test('does not request metadata for authoring routes or unsafe slugs', async () => {
  global.fetch = jest.fn();
  await request(app).get('/groups/new').expect(200, 'fallback');
  await request(app).get('/groups/river/edit').expect(200, 'fallback');
  await request(app).get('/groups/a%20b').expect(200, 'fallback');
  expect(global.fetch).not.toHaveBeenCalled();
});
