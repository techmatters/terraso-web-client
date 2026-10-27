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

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';

import EmbeddedVideoPreview from 'terraso-web-client/storyMap/components/EmbeddedVideoPreview';
import {
  CarouselPresentation,
  GalleryPresentation,
} from 'terraso-web-client/storyMap/components/StoryMapMedia';

const originalFetch = global.fetch;
const OriginalIntersectionObserver = globalThis.IntersectionObserver;
let onIntersection;
let observer;

beforeEach(() => {
  observer = { observe: jest.fn(), disconnect: jest.fn() };
  globalThis.IntersectionObserver = jest.fn(callback => {
    onIntersection = callback;
    return observer;
  });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      title: 'Video title',
      thumbnail_url: 'https://i.vimeocdn.com/video/preview.jpg',
    }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  globalThis.IntersectionObserver = OriginalIntersectionObserver;
});

const youtube = {
  type: 'embedded',
  source: 'youtube',
  url: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
};

test.each([
  {
    item: youtube,
    thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
  },
  {
    item: {
      type: 'embedded',
      source: 'vimeo',
      url: 'https://player.vimeo.com/video/1084537',
    },
    thumbnail: 'https://i.vimeocdn.com/video/preview.jpg',
  },
])(
  '$item.source preview loads only once after approaching the viewport',
  async ({ item, thumbnail }) => {
    await render(<EmbeddedVideoPreview item={item} />);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByAltText('')).not.toBeInTheDocument();

    act(() => onIntersection([{ isIntersecting: false }]));
    expect(global.fetch).not.toHaveBeenCalled();

    act(() => onIntersection([{ isIntersecting: true }]));
    expect(await screen.findByText('Video title')).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute('src', thumbnail);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(observer.disconnect).toHaveBeenCalled();

    act(() => onIntersection([{ isIntersecting: false }]));
    act(() => onIntersection([{ isIntersecting: true }]));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText('')).toHaveAttribute('src', thumbnail);
  }
);

test.each([
  { name: 'Gallery', Presentation: GalleryPresentation },
  { name: 'Carousel', Presentation: CarouselPresentation },
])(
  '$name opens playback before preview resources load',
  async ({ Presentation }) => {
    await render(<Presentation items={[youtube]} />);
    fireEvent.click(screen.getByRole('button', { name: /^(Open|Expand) / }));
    expect(
      within(screen.getByRole('dialog')).getByTitle('Embedded video')
    ).toHaveAttribute('src', youtube.url);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByAltText('')).not.toBeInTheDocument();
  }
);

test('unmounting disconnects visibility observation and aborts pending metadata', async () => {
  global.fetch.mockImplementation(() => new Promise(() => {}));
  const { unmount } = await render(<EmbeddedVideoPreview item={youtube} />);
  expect(observer.observe).toHaveBeenCalledTimes(1);
  act(() => onIntersection([{ isIntersecting: true }]));
  const { signal } = global.fetch.mock.calls[0][1];
  expect(signal.aborted).toBe(false);

  unmount();

  expect(observer.disconnect).toHaveBeenCalled();
  expect(signal.aborted).toBe(true);
});
