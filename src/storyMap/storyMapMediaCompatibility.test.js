import {
  chapterHasVisualMedia,
  getStoryMapConfig,
  isChapterEmpty,
} from 'terraso-web-client/storyMap/storyMapUtils';

test('legacy stories retain image metadata when loaded into the multi-media model', () => {
  const media = {
    type: 'image/jpeg',
    contentId: 'image-1',
    altText: 'Mangroves',
    crop: { position: { x: 0.3, y: 0.6 }, scale: 2 },
  };
  const config = getStoryMapConfig({
    configuration: JSON.stringify({ chapters: [{ id: 'chapter-1', media }] }),
  });
  expect(config.chapters[0]).toEqual({
    id: 'chapter-1',
    mediaItems: [media],
    mediaPresentation: 'carousel',
  });
  expect(chapterHasVisualMedia(config.chapters[0])).toBe(true);
  expect(isChapterEmpty(config.chapters[0])).toBe(false);
});

test('new stories preserve ordered media and explicit removal of legacy media', () => {
  const mediaItems = [
    { id: 'audio-1', type: 'audio/mpeg' },
    { id: 'image-1', type: 'image/jpeg' },
  ];
  const config = getStoryMapConfig({
    config: {
      chapters: [
        { mediaItems, mediaPresentation: 'gallery' },
        { media: mediaItems[1], mediaItems: [] },
        {},
      ],
    },
  });
  expect(config.chapters[0].mediaItems).toEqual(mediaItems);
  expect(config.chapters[0].mediaPresentation).toBe('gallery');
  expect(config.chapters[1].mediaItems).toEqual([]);
  expect(config.chapters[2].mediaItems).toEqual([]);
  expect(isChapterEmpty(config.chapters[1])).toBe(true);
});
