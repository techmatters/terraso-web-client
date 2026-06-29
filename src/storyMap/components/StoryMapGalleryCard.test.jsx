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
