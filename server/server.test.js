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
const appPaths = require('./appPaths.cjs');

const createTestApp = () => {
  const app = express();

  app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
};

describe('Server indexing headers', () => {
  let app;
  let listen;
  let staticMiddleware;

  beforeAll(() => {
    jest.doMock('./config', () => ({ port: 10000, nodeEnv: 'test' }));
    jest.doMock('./middleware/logger', () => ({
      requestLogger: (req, res, next) => next(),
    }));
    jest.doMock('./middleware/rateLimiter', () => ({
      rateLimiter: (req, res, next) =>
        req.query.limited ? res.sendStatus(429) : next(),
    }));
    jest.doMock('./utils/clientBundle', () => ({
      initializeCache: () => {},
      serveClientBundle: (res, next, status = 200) =>
        res.status(status).send('<html>client</html>'),
    }));
    jest.doMock('./storyMap/routes', () => {
      const router = express.Router();
      router.get('/:id/:slug', (req, res, next) => {
        if (req.params.id === 'failure') return next(new Error('API unavailable'));
        return res.send('public story map');
      });
      router.get('/:id/:slug/embed', (req, res) => res.send('embed'));
      return router;
    });
    jest.doMock('./group/routes', () => express.Router());
    jest.doMock('./landscape/routes', () => express.Router());
    staticMiddleware = jest
      .spyOn(express, 'static')
      .mockReturnValue((req, res, next) => {
        if (['/account/profile/app.js', '/assets/app.js'].includes(req.path)) {
          return res.send('static asset');
        }
        next();
      });
    listen = jest
      .spyOn(express.application, 'listen')
      .mockImplementation(function () {
        app = this;
      });
    require('../server.cjs');
  });

  afterAll(() => {
    listen.mockRestore();
    staticMiddleware.mockRestore();
    jest.resetModules();
    jest.dontMock('./config');
    jest.dontMock('./middleware/logger');
    jest.dontMock('./middleware/rateLimiter');
    jest.dontMock('./utils/clientBundle');
    jest.dontMock('./storyMap/routes');
    jest.dontMock('./group/routes');
    jest.dontMock('./landscape/routes');
  });

  it.each([
    '/account',
    '/account/auth-callback?code=example',
    '/account/profile/',
    '/account/profile/completeProfile',
    '/tools/story-maps/new',
    '/tools/story-maps/accept?token=example',
    '/tools/story-maps/123/edit',
    '/tools/story-maps/123/a-story/edit/',
  ])('sends noindex for %s', async url => {
    const response = await request(app).get(url).expect(200);
    expect(response.headers['x-robots-tag']).toBe('noindex');
  });

  it('sets noindex before an early rate-limit response', async () => {
    const response = await request(app).get('/account?limited=1').expect(429);
    expect(response.headers['x-robots-tag']).toBe('noindex');
  });

  it.each([
    '/tools/story-maps',
    '/tools/story-maps/123/a-story',
    '/tools/story-maps/123/a-story/embed',
    '/account/profile/app.js',
    '/assets/app.js',
  ])('does not set noindex for %s', async url => {
    const response = await request(app).get(url).expect(200);
    expect(response.headers['x-robots-tag']).toBeUndefined();
  });
  it.each([
    '/definitely-not-a-route',
    '/accounting',
    '/groups/example/unknown',
    '/tools/story-maps/123/slug/unknown',
  ])('returns the client not-found page with HTTP 404 for %s', async url => {
    const response = await request(app).get(url).expect(404);
    expect(response.text).toBe('<html>client</html>');
  });

  it.each(appPaths.map(path => path.replace(/:[^/]+/g, 'example')))(
    'serves the client for defined route %s',
    async url => {
      await request(app).get(url).expect(200);
    }
  );

  it('does not turn a metadata API failure into a 404', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await request(app).get('/tools/story-maps/failure/slug').expect(200);
    } finally {
      log.mockRestore();
    }
  });

  it.each([
    '/contact',
    '/%63ontact',
    '/account/auth-callback?code=example',
    '/groups/example/edit',
    '/groups/example/download/share-id',
    '/landscapes/example/profile/edit',
    '/landscapes/example/map/1/config',
    '/tools/story-maps/123/story/edit',
    '/notifications/unsubscribe?token=example',
  ])('keeps the matched client route %s available', async url => {
    await request(app).get(url).expect(200);
  });
});

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
