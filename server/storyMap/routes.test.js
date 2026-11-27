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
  <meta
    name="description"
    content="Default description"
  />
  <meta
    property="og:title"
    content="Terraso"
  />
  <meta
    property="og:description"
    content="Default description"
  />
  <meta
    property="og:image"
    content="https://example.com/default.jpg"
  />
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
          ? [
              {
                node: {
                  isPublished: true,
                  publishedConfiguration: JSON.stringify(config),
                },
              },
            ]
          : [],
      },
    },
  }),
});

const mockFetch = response => {
  global.fetch = jest.fn().mockResolvedValue(response);
};

const storyMapLookup = (nodes, pageInfo = { hasNextPage: false }) => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: {
      storyMaps: { edges: nodes.map(node => ({ node })), pageInfo },
    },
  }),
});

const publishedMap = (slug = 'my-story') => ({
  slug,
  isPublished: true,
  publishedConfiguration: JSON.stringify({ title: 'Public story' }),
});

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

  it.each([
    '/tools/story-maps/abcdefghijk/story',
    '/tools/story-maps/abcdefghijk/story/embed',
    '/tools/story-maps/abcdefghijk',
  ])('returns 404 for a story map ID exceeding the database limit: %s', async url => {
    global.fetch = jest.fn();
    const { text } = await request(app).get(url).expect(404);
    expect(text).toContain(ROOT_SELECTOR);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each(['abcdefghij', '😀😀😀😀😀😀😀😀😀😀'])(
    'does not infer absence from an anonymous empty result for a valid-length ID: %s',
    async id => {
      mockFetch(storyMapLookup([]));
      await request(app).get(`/tools/story-maps/${encodeURIComponent(id)}/story`).expect(200);
      expect(global.fetch).toHaveBeenCalled();
    }
  );

  it('does not turn a backend failure into a 404 for a valid-length ID', async () => {
    mockFetch({ ok: false, status: 503 });
    await request(app).get('/tools/story-maps/abcdefghij/story').expect(200);
  });

  describe('GET /tools/story-maps/:storyMapId/:slug', () => {
    it('injects meta tags when story map has full metadata', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'My Amazing Story Map',
          description: 'A story about regenerative agriculture',
          subtitle: 'A less specific subtitle',
          featuredImage: { signedUrl: 'https://cdn.example.com/image.jpg' },
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/my-story-map')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(text).toContain(
        '<title>My Amazing Story Map | Terraso Story Maps</title>'
      );
      expect(text).toContain(
        'property="og:title" content="My Amazing Story Map | Terraso Story Maps"'
      );
      expect(text).toContain('A story about regenerative agriculture');
      expect(text).not.toContain('A less specific subtitle');
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

      expect(text).toContain(
        '<title>Story Without Image | Terraso Story Maps</title>'
      );
      expect(text).toContain('This story has no image');
      expect(text).toContain(
        'https://test.terraso.org/storyMap/terraso-story-maps-img.jpg'
      );
    });

    it('uses the first chapter image when no featured image is configured', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'Story With Chapter Image',
          chapters: [
            {
              media: {
                type: 'video/mp4',
                signedUrl: 'https://cdn.example.com/video.mp4',
              },
            },
            {
              media: {
                type: 'image/jpeg',
                signedUrl: 'https://cdn.example.com/chapter.jpg',
              },
            },
          ],
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/chapter-image-story')
        .expect(200);

      expect(text).toContain('https://cdn.example.com/chapter.jpg');
    });

    it('falls back to first chapter content when short description is missing', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'Story Without Short Description',
          chapters: [
            {
              title: 'Chapter 1',
              description:
                'This first chapter explains the story context with enough detail that it should be truncated for social previews and search listings to keep metadata concise and readable.',
            },
          ],
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/no-short-description')
        .expect(200);

      expect(text).toContain(
        '<title>Story Without Short Description | Terraso Story Maps</title>'
      );
      expect(text).toContain(
        'This first chapter explains the story context with enough detail that it should be truncated for social previews and search listings to keep...'
      );
    });

    it('uses the story map subtitle when short description is missing', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'Story With Subtitle',
          subtitle: 'A subtitle for the link preview',
          chapters: [{ description: 'Chapter text should not take priority.' }],
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/subtitle-story')
        .expect(200);

      expect(text).toContain(
        'property="og:description" content="A subtitle for the link preview"'
      );
      expect(text).not.toContain('Chapter text should not take priority.');
    });

    it('uses a title-specific description when short description, subtitle, and chapter content are missing', async () => {
      mockFetch(
        mockStoryMapResponse({
          title: 'Story Without Description Data',
          chapters: [{ title: 'Chapter 1' }],
        })
      );

      const { text } = await request(app)
        .get('/tools/story-maps/abc123/no-description-data')
        .expect(200);

      expect(text).toContain(
        '<title>Story Without Description Data | Terraso Story Maps</title>'
      );
      expect(text).toContain(
        'Story Without Description Data: an interactive story map made with Terraso Story Maps, the free, open-source app for place-based storytelling.'
      );
    });

    it.each([undefined, '', '   '])(
      'uses the generic title for a missing or blank title (%p) without replacing chapter text',
      async title => {
        mockFetch(
          mockStoryMapResponse({
            title,
            chapters: [{ description: 'A story told through chapter text.' }],
          })
        );

        const { text } = await request(app)
          .get('/tools/story-maps/abc123/no-title')
          .expect(200);

        expect(text).toContain(
          '<title>Terraso Story Maps - Free and Open Source Storymapping</title>'
        );
        expect(text).toContain(
          'property="og:title" content="Terraso Story Maps - Free and Open Source Storymapping"'
        );
        expect(text).toContain(
          'property="og:description" content="A story told through chapter text."'
        );
      }
    );

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

      expect(text).toContain(
        '<title>Embedded Story Map | Terraso Story Maps</title>'
      );
      expect(text).toContain('An embedded story');
    });

    it('falls back to client bundle when story map not found', async () => {
      mockFetch(mockStoryMapResponse(null));

      const { text } = await request(app)
        .get('/tools/story-maps/missing/missing/embed')
        .expect(200);

      expect(text).toContain(ROOT_SELECTOR);
    });
  });

  describe('canonical URLs and redirects', () => {
    it('uses the configured origin and omits the query for a published viewer and embed', async () => {
      mockFetch(storyMapLookup([publishedMap()]));
      for (const path of [
        '/tools/story-maps/abc123/my-story?utm_source=example',
        '/tools/story-maps/abc123/my-story/embed?x=1',
      ]) {
        const { text } = await request(app)
          .get(path)
          .set('Host', 'untrusted.example')
          .expect(200);
        expect(text).toContain(
          '<link rel="canonical" href="https://test.terraso.org/tools/story-maps/abc123/my-story"/>'
        );
        expect(text).not.toContain('untrusted.example');
      }
    });

    it('redirects a published viewer trailing slash while preserving the raw query', async () => {
      mockFetch(storyMapLookup([publishedMap()]));
      await request(app)
        .get('/tools/story-maps/abc123/my-story/?x=a%2Fb&x=two')
        .expect(301)
        .expect('Location', '/tools/story-maps/abc123/my-story?x=a%2Fb&x=two');
      await request(app)
        .get('/tools/story-maps/abc123/my-story/embed/')
        .expect(200);
    });

    it('uses only an exact empty-slug map for ID-only viewer and embed', async () => {
      mockFetch(storyMapLookup([publishedMap('other'), publishedMap('')]));
      await request(app)
        .get('/tools/story-maps/abc123?a=1&a=2')
        .expect(301)
        .expect('Location', '/tools/story-maps/abc123/?a=1&a=2');
      for (const path of ['/tools/story-maps/abc123/', '/tools/story-maps/abc123/embed']) {
        const { text } = await request(app).get(path).expect(200);
        expect(text).toContain('Public story');
        expect(text).toContain('href="https://test.terraso.org/tools/story-maps/abc123/"');
      }
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.variables).toEqual({ storyMapId: 'abc123', slug: '' });
    });

    it('does not redirect or inject metadata for a slugged or unpublished ID match', async () => {
      for (const nodes of [[publishedMap()], [{ ...publishedMap(''), isPublished: false }]]) {
        mockFetch(storyMapLookup(nodes));
        const { text } = await request(app).get('/tools/story-maps/abc123').expect(200);
        expect(text).toContain(ROOT_SELECTOR);
        expect(text).not.toContain('Public story');
        expect(text).not.toContain('rel="canonical"');
      }
    });

    it('does not add canonical metadata or redirect an unpublished map', async () => {
      mockFetch(storyMapLookup([{ ...publishedMap(), isPublished: false }]));
      const { text } = await request(app)
        .get('/tools/story-maps/abc123/my-story/')
        .expect(200);
      expect(text).not.toContain('rel="canonical"');
      expect(text).not.toContain('Public story');
    });

    it('does not redirect a response whose slug does not match the request', async () => {
      mockFetch(storyMapLookup([publishedMap('different')]));
      const { text } = await request(app)
        .get('/tools/story-maps/abc123/my-story/')
        .expect(200);
      expect(text).not.toContain('rel="canonical"');
    });

    it('leaves reserved and edit routes alone', async () => {
      mockFetch(storyMapLookup([publishedMap()]));
      await request(app).get('/tools/story-maps/new').expect(200);
      await request(app).get('/tools/story-maps/accept').expect(200);
      expect(global.fetch).not.toHaveBeenCalled();
      await request(app)
        .get('/tools/story-maps/abc123/my-story/edit')
        .expect(200);
      await request(app).get('/tools/story-maps/abc123/edit').expect(200);
      await request(app).get('/tools/story-maps/abc123/embed').expect(200);
    });

    it('preserves fallback behavior for an unknown map or lookup failure with a trailing slash', async () => {
      mockFetch(storyMapLookup([]));
      await request(app)
        .get('/tools/story-maps/abc123/missing/')
        .expect(200);
      global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
      await request(app)
        .get('/tools/story-maps/abc123/missing/')
        .expect(200);
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
