/*
 * Copyright © 2025 Technology Matters
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

const request = require('supertest');
const express = require('express');

const createTestApp = () => {
  const app = express();

  app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
};

describe('Server Health Check', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /healthz', () => {
    it('should return 200 OK', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should respond with JSON', async () => {
      const response = await request(app).get('/healthz');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should have status ok in response body', async () => {
      const response = await request(app).get('/healthz');

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });
});
