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
const fs = require('fs');

const MOCK_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Terraso</title>
  <meta name="description" content="Default description" data-rh="true"/>
  <meta property="og:title" content="Terraso" data-rh="true"/>
  <meta property="og:description" content="Default description" data-rh="true"/>
  <meta property="og:image" content="https://example.com/default.jpg" data-rh="true"/>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

const ROOT_SELECTOR = '<div id="root">';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
}));

jest.mock('../config', () => ({
  apiUrl: 'https://api.test.terraso.org',
  baseUrl: 'https://test.terraso.org',
  port: 10000,
  nodeEnv: 'test',
  apiTimeout: 10000,
}));

const storyMapRoutes = require('./routes');

const createTestApp = () => {
  const app = express();
  app.use('/tools/story-maps', storyMapRoutes);
  app.use((req, res) => res.send(MOCK_HTML));
  app.use((err, req, res, next) => res.send(MOCK_HTML));
  return app;
};

const mockStoryMapResponse = config => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: {
      storyMaps: {
        edges: config
          ? [{ node: { publishedConfiguration: JSON.stringify(config) } }]
          : [],
      },
    },
  }),
});

const mockFetch = response => {
  global.fetch = jest.fn().mockResolvedValue(response);
};

describe('Story Map Routes - Integration Tests', () => {
  let app;
  let originalFetch;

  const suppressExpectedErrors = () =>
    jest.spyOn(console, 'error').mockImplementation((msg, ...args) => {
      const isExpected =
        typeof msg === 'string' &&
        (msg.includes('Error processing story map') ||
          msg.includes('Test error:'));
      if (!isExpected) {
        console.warn('Unexpected error in test:', msg, ...args);
      }
    });

  beforeAll(() => {
    fs.readFileSync.mockReturnValue(MOCK_HTML);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    app = createTestApp();
    originalFetch = global.fetch;
    suppressExpectedErrors();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('GET /tools/story-maps/:storyMapId/:slug', () => {
    it('injects meta tags when story map has full metadata', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'My Amazing Story Map',
          description: 'A story about regenerative agriculture',
          featuredImage: { signedUrl: 'https://cdn.example.com/image.jpg' },
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/my-story-map')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(text).toContain('<title>My Amazing Story Map</title>');
      expect(text).toContain('content="My Amazing Story Map"');
      expect(text).toContain('A story about regenerative agriculture');
      expect(text).toContain('https://cdn.example.com/image.jpg');
    });

    it('injects meta tags when story map has no featured image', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'Story Without Image',
          description: 'This story has no image',
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/no-image-story')
        .expect(200);

      expect(text).toContain('<title>Story Without Image</title>');
      expect(text).toContain('This story has no image');
    });

    const fallbackScenarios = [
      ['story map not found', () => mockFetch(mockStoryMapResponse(null))],
      [
        'API unreachable',
        () => {
          global.fetch = jest
            .fn()
            .mockRejectedValue(new Error('Network error'));
        },
      ],
      [
        'API times out',
        () => {
          const error = new Error('Request timeout');
          error.name = 'AbortError';
          global.fetch = jest.fn().mockRejectedValue(error);
        },
      ],
      [
        'invalid JSON response',
        () => {
          global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
              throw new Error('Invalid JSON');
            },
          });
        },
      ],
      [
        'malformed configuration',
        () => {
          global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                storyMaps: {
                  edges: [{ node: { publishedConfiguration: 'invalid{' } }],
                },
              },
            }),
          });
        },
      ],
    ];

    fallbackScenarios.forEach(([scenario, setup]) => {
      it(`falls back to client bundle when ${scenario}`, async () => {
        setup();

        const { text } = await request(app)
          .get('/tools/story-maps/abc123/test')
          .expect(200);

        expect(text).toContain(ROOT_SELECTOR);
      });
    });
  });

  describe('GET /tools/story-maps/:storyMapId/:slug/embed', () => {
    it('injects meta tags when story map exists', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'Embedded Story Map',
          description: 'An embedded story',
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/embedded-story/embed')
        .expect(200);

      expect(text).toContain('<title>Embedded Story Map</title>');
      expect(text).toContain('An embedded story');
    });

    it('falls back to client bundle when story map not found', async () => {
      mockFetch(mockStoryMapResponse(null));

      const { text } = await request(app)
        .get('/tools/story-maps/nonexistent/missing/embed')
        .expect(200);

      expect(text).toContain(ROOT_SELECTOR);
    });
  });

  describe('API Integration', () => {
    it('calls GraphQL API with correct query and variables', async () => {
      const fetch = jest
        .fn()
        .mockResolvedValue(mockStoryMapResponse({ title: 'Test' }));
      global.fetch = fetch;

      await request(app).get('/tools/story-maps/test-id/test-slug');

      expect(fetch).toHaveBeenCalledTimes(1);

      const [url, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(url).toContain('/graphql/');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(body.variables).toEqual({
        storyMapId: 'test-id',
        slug: 'test-slug',
      });
      expect(body.query).toContain('storyMaps');
    });
  });
});
