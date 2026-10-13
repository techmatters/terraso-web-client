import * as api from 'terraso-client-shared/terrasoApi/api';

import {
  fetchStoryMap,
  fetchStoryMapForm,
  updateStoryMap,
} from 'terraso-web-client/storyMap/storyMapService';

jest.mock('terraso-client-shared/terrasoApi/api');

test('draft and published legacy configurations load into the same media model', async () => {
  const draftMedia = { type: 'image/jpeg', signedUrl: 'draft.jpg' };
  const publishedMedia = { type: 'image/jpeg', signedUrl: 'published.jpg' };
  api.requestGraphQL.mockResolvedValue({
    storyMaps: {
      edges: [
        {
          node: {
            configuration: JSON.stringify({
              chapters: [{ media: draftMedia }],
            }),
            publishedConfiguration: JSON.stringify({
              chapters: [{ media: publishedMedia }],
            }),
            membershipList: { memberships: { edges: [] } },
          },
        },
      ],
    },
  });
  const params = { storyMapId: 'story-1' };
  expect(
    (await fetchStoryMapForm(params)).config.chapters[0].mediaItems
  ).toEqual([draftMedia]);
  expect((await fetchStoryMap(params)).config.chapters[0].mediaItems).toEqual([
    publishedMedia,
  ]);
});

test('saving ordered media preserves metadata and uses backend-resolved media on reload', async () => {
  const image = {
    id: 'image-1',
    contentId: 'upload-1',
    type: 'image/jpeg',
    altText: 'Mangroves',
    crop: { position: { x: 0.4, y: 0.6 }, scale: 2 },
  };
  const embedded = {
    id: 'embed-1',
    type: 'embedded',
    url: 'https://www.youtube.com/embed/example',
  };
  const config = {
    chapters: [
      {
        id: 'chapter-1',
        mediaPresentation: 'gallery',
        mediaItems: [embedded, image],
      },
    ],
  };
  const savedConfig = {
    chapters: [
      {
        ...config.chapters[0],
        mediaItems: [
          embedded,
          { ...image, signedUrl: 'https://example.org/resolved.jpg' },
        ],
      },
    ],
  };
  api.request.mockResolvedValue({ configuration: JSON.stringify(savedConfig) });
  const file = new File(['image'], 'mangroves.jpg', { type: 'image/jpeg' });
  const result = await updateStoryMap({
    storyMap: { id: 'story-1', config, publish: false },
    files: { 'upload-1': { file } },
  });
  const body = api.request.mock.calls[0][0].body;
  expect(JSON.parse(body.get('configuration'))).toEqual(config);
  expect(body.get('files').name).toBe('upload-1');
  expect(result.config).toEqual(savedConfig);
});
