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
  getCachedHtml: () => '<html><head><title>Default</title><meta name="description" content="Default"/><meta property="og:title" content="Default"/><meta property="og:description" content="Default"/><meta property="og:image" content="default"/></head></html>',
}));

const routes = require('./routes');
const app = express();
app.use('/landscapes', routes);
app.use((req, res) => res.send('fallback'));
const response = nodes => ({
  ok: true,
  json: async () => ({ data: { landscapes: { edges: nodes.map(node => ({ node })) } } }),
});
const landscape = { slug: 'river', name: 'River & Valley', description: 'Public description', profileImage: 'https://example.org/a?x=1&y=2' };
let originalFetch;
beforeEach(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

test('uses anonymous exact-slug data for escaped metadata and a canonical profile URL', async () => {
  global.fetch = jest.fn().mockResolvedValue(response([landscape]));
  const { text } = await request(app).get('/landscapes/river/profile?tracking=1').set('Cookie', 'session=private').expect(200);
  expect(text).toContain('<title>River &amp; Valley Profile | Terraso</title>');
  expect(text).toContain('Public description');
  expect(text).toContain('https://example.org/a?x=1&amp;y=2');
  expect(text).toContain('<link rel="canonical" href="https://terraso.example/landscapes/river/profile"/>');
  const options = global.fetch.mock.calls[0][1];
  expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
  expect(JSON.parse(options.body).variables).toEqual({ slug: 'river' });
});

test('escapes markup and preserves replacement characters in public content', async () => {
  global.fetch = jest.fn().mockResolvedValue(response([{ ...landscape, name: '<$&>', description: '"quoted" $&' }]));
  const { text } = await request(app).get('/landscapes/river/profile').expect(200);
  expect(text).toContain('&lt;$&amp;&gt; Profile | Terraso');
  expect(text).toContain('&quot;quoted&quot; $&amp;');
});

test('normalizes the trailing slash only for a verified landscape', async () => {
  global.fetch = jest.fn().mockResolvedValue(response([landscape]));
  await request(app).get('/landscapes/river/profile/?a=1').expect(301).expect('Location', '/landscapes/river/profile?a=1');
});

test('does not inject metadata for missing, mismatched, ambiguous or partial results', async () => {
  for (const result of [response([]), response([{ ...landscape, slug: 'other' }]), response([{ ...landscape, name: '' }]), response([landscape, landscape]), { ok: false }, { ok: true, json: async () => ({ errors: [{}], data: { landscapes: { edges: [{ node: landscape }] } } }) }]) {
    global.fetch = jest.fn().mockResolvedValue(result);
    const { text } = await request(app).get('/landscapes/river/profile').expect(200);
    expect(text).toBe('fallback');
  }
});

test('falls back when the API request fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await request(app).get('/landscapes/river/profile').expect(200, 'fallback');
  } finally {
    log.mockRestore();
  }
});

test('does not request metadata for an edit route or unsafe slug', async () => {
  global.fetch = jest.fn();
  await request(app).get('/landscapes/river/profile/edit').expect(200, 'fallback');
  await request(app).get('/landscapes/a%20b/profile').expect(200, 'fallback');
  expect(global.fetch).not.toHaveBeenCalled();
});
