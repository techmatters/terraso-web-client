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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';

import CarouselPresentation from 'terraso-web-client/storyMap/components/CarouselPresentation';

const image = {
  type: 'image/jpeg',
  url: '/image.jpg',
  altText: 'A landscape',
  crop: { scale: 2, position: { x: 0.3, y: 0.4 } },
};

test('a single image uses its natural proportions without changing its saved crop', async () => {
  const { rerender } = await render(<CarouselPresentation items={[image]} />);
  const preview = screen.getByAltText('A landscape');
  expect(preview).toHaveStyle({ width: '100%', maxHeight: 'none' });
  expect(preview.closest('[data-cropped-media-preview]')).toBeNull();
  expect(screen.getByTestId('carousel-viewport')).not.toHaveStyle({
    aspectRatio: '16 / 9',
  });

  await rerender(
    <CarouselPresentation items={[image, { ...image, url: '/other.jpg' }]} />
  );
  expect(
    screen.getByAltText('A landscape').closest('[data-cropped-media-preview]')
  ).not.toBeNull();
  expect(image.crop).toEqual({ scale: 2, position: { x: 0.3, y: 0.4 } });
});

test('a single uploaded video uses its intrinsic aspect ratio when metadata loads', async () => {
  const originalObserver = globalThis.IntersectionObserver;
  let onIntersection;
  globalThis.IntersectionObserver = jest.fn(callback => {
    onIntersection = callback;
    return { observe: jest.fn(), disconnect: jest.fn() };
  });
  try {
    await render(
      <CarouselPresentation
        items={[{ type: 'video/mp4', url: '/video.mp4' }]}
      />
    );
    act(() => onIntersection([{ isIntersecting: true }]));
    const video = screen
      .getByTestId('carousel-viewport')
      .querySelector('video');
    expect(video).toBeInTheDocument();
    Object.defineProperties(video, {
      videoWidth: { value: 720 },
      videoHeight: { value: 1280 },
    });
    fireEvent.loadedMetadata(video);
    expect(screen.getByTestId('carousel-viewport')).toHaveStyle({
      aspectRatio: '0.5625',
    });
  } finally {
    globalThis.IntersectionObserver = originalObserver;
  }
});
