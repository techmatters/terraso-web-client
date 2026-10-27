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

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import StoryMapGalleryCard from 'terraso-web-client/storyMap/components/StoryMapGalleryCard';

const storyMap = {
  id: 'featured-1',
  slug: 'featured-story-1',
  storyMapId: 'featured-1',
  title: 'Fallback title',
  config: {
    title: 'Configured story map title',
    description: 'Configured description',
    featuredImage: {
      signedUrl: 'https://example.com/broken-image.png',
      description: 'Configured featured image',
    },
  },
};

test('StoryMapGalleryCard: falls back to default image when featured image fails to load', () => {
  render(
    <MemoryRouter>
      <StoryMapGalleryCard storyMap={storyMap} />
    </MemoryRouter>
  );

  const image = screen.getByAltText('Configured featured image');

  expect(image).toHaveAttribute('src', 'https://example.com/broken-image.png');

  fireEvent.error(image);

  expect(image).toHaveAttribute('src', '/storyMap/terraso-story-maps-img.jpg');
});

test('StoryMapGalleryCard: uses default image when no featured image is configured', () => {
  render(
    <MemoryRouter>
      <StoryMapGalleryCard
        storyMap={{
          ...storyMap,
          config: {
            title: 'No image story map',
            chapters: [],
          },
        }}
      />
    </MemoryRouter>
  );

  expect(screen.getByAltText('No image story map')).toHaveAttribute(
    'src',
    '/storyMap/terraso-story-maps-img.jpg'
  );
});

const firstImage = {
  type: 'image/jpeg',
  signedUrl: 'https://example.com/first.jpg',
  altText: 'First chapter image',
};
const secondImage = {
  type: 'image/png',
  url: 'https://example.com/second.png',
};
const mixedChapters = [
  { mediaItems: [{ type: 'audio/mpeg', signedUrl: 'audio.mp3' }] },
  {
    mediaItems: [
      { type: 'embedded', source: 'youtube', url: 'video-url' },
      { type: 'image/jpeg', contentId: 'unresolved-upload' },
      firstImage,
      secondImage,
    ],
  },
];

test.each([
  {
    name: 'explicit featured image takes precedence over chapter images',
    config: { ...storyMap.config, chapters: mixedChapters },
    src: storyMap.config.featuredImage.signedUrl,
    alt: storyMap.config.featuredImage.description,
  },
  {
    name: 'first available image in mixed ordered chapter media',
    config: { chapters: mixedChapters },
    src: firstImage.signedUrl,
    alt: firstImage.altText,
  },
  {
    name: 'legacy single-media chapter',
    config: { chapters: [{ media: firstImage }] },
    src: firstImage.signedUrl,
    alt: firstImage.altText,
  },
  {
    name: 'explicitly empty collection overrides legacy media',
    config: { chapters: [{ media: firstImage, mediaItems: [] }] },
    src: '/storyMap/terraso-story-maps-img.jpg',
    alt: storyMap.title,
  },
  {
    name: 'missing featured source uses chapter image and its alt text',
    config: {
      featuredImage: { description: 'Unused featured description' },
      chapters: [{ mediaItems: [secondImage] }],
    },
    src: secondImage.url,
    alt: storyMap.title,
  },
])('StoryMapGalleryCard: $name', ({ config, src, alt }) => {
  render(
    <MemoryRouter>
      <StoryMapGalleryCard storyMap={{ ...storyMap, config }} />
    </MemoryRouter>
  );
  expect(screen.getByRole('img', { name: alt })).toHaveAttribute('src', src);
});

test('StoryMapGalleryCard: reordered and removed images update the automatic cover, with load-error fallback', () => {
  const renderCard = mediaItems => (
    <MemoryRouter>
      <StoryMapGalleryCard
        storyMap={{
          ...storyMap,
          config: { chapters: [{ mediaItems }] },
        }}
      />
    </MemoryRouter>
  );
  const { rerender } = render(renderCard([firstImage, secondImage]));
  expect(screen.getByRole('img')).toHaveAttribute('src', firstImage.signedUrl);
  rerender(renderCard([secondImage, firstImage]));
  expect(screen.getByRole('img')).toHaveAttribute('src', secondImage.url);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    '/storyMap/terraso-story-maps-img.jpg'
  );
  rerender(renderCard([firstImage]));
  expect(screen.getByRole('img')).toHaveAttribute('src', firstImage.signedUrl);
  rerender(renderCard([]));
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    '/storyMap/terraso-story-maps-img.jpg'
  );
});
