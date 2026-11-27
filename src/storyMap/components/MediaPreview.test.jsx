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

import MediaPreview from 'terraso-web-client/storyMap/components/MediaPreview';

const OriginalIntersectionObserver = globalThis.IntersectionObserver;
let onIntersection;
let observer;

beforeEach(() => {
  observer = { observe: jest.fn(), disconnect: jest.fn() };
  globalThis.IntersectionObserver = jest.fn(callback => {
    onIntersection = callback;
    return observer;
  });
});

afterEach(() => {
  globalThis.IntersectionObserver = OriginalIntersectionObserver;
});

const video = { type: 'video/mp4', url: 'https://test.com/video.mp4' };

test('video preview loads only when it approaches the viewport', async () => {
  const { unmount } = await render(<MediaPreview item={video} />);
  expect(screen.queryByLabelText('video media')).not.toBeInTheDocument();
  expect(observer.observe).toHaveBeenCalledWith(
    screen.getByTestId('gallery-video-preview')
  );

  act(() => onIntersection([{ isIntersecting: false }]));
  expect(screen.queryByLabelText('video media')).not.toBeInTheDocument();

  act(() => onIntersection([{ isIntersecting: true }]));
  const preview = screen.getByLabelText('video media');
  expect(preview).toHaveAttribute('src', video.url);
  expect(preview).toHaveAttribute('preload', 'metadata');
  Object.defineProperty(preview, 'duration', { configurable: true, value: 5 });
  fireEvent.loadedMetadata(preview);
  expect(preview.currentTime).toBe(0.1);
  expect(observer.disconnect).toHaveBeenCalled();

  unmount();
  expect(observer.disconnect).toHaveBeenCalled();
});

test('replacing a video waits for the replacement to approach the viewport', async () => {
  const { rerender } = await render(<MediaPreview item={video} />);
  act(() => onIntersection([{ isIntersecting: true }]));
  expect(screen.getByLabelText('video media')).toHaveAttribute(
    'src',
    video.url
  );

  const replacement = { ...video, url: 'https://test.com/other.mp4' };
  rerender(<MediaPreview item={replacement} />);
  expect(screen.queryByLabelText('video media')).not.toBeInTheDocument();
  act(() => onIntersection([{ isIntersecting: true }]));
  expect(screen.getByLabelText('video media')).toHaveAttribute(
    'src',
    replacement.url
  );
});
