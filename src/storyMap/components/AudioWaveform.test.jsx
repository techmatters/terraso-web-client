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
  fireEvent,
  render,
  screen,
  waitFor,
} from 'terraso-web-client/tests/utils';
import logger from 'terraso-client-shared/monitoring/logger';
import WaveSurfer from 'wavesurfer.js';

import MediaPreview from 'terraso-web-client/storyMap/components/MediaPreview';
import MediaViewer from 'terraso-web-client/storyMap/components/MediaViewer';

jest.mock('wavesurfer.js', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));
jest.mock('terraso-client-shared/monitoring/logger');

const item = { type: 'audio/mpeg', url: 'https://example.com/audio.mp3' };
const peaks = [[0.1, -0.3, 0.5]];
let waveforms;
let decoders;

beforeEach(() => {
  waveforms = [];
  decoders = [];
  WaveSurfer.create.mockImplementation(options => {
    const listeners = {};
    const waveform = {
      load: jest.fn().mockResolvedValue(),
      exportPeaks: jest.fn(() => peaks),
      getDuration: jest.fn(() => 3),
      destroy: jest.fn(),
      on: jest.fn((event, listener) => {
        listeners[event] = listener;
      }),
    };
    if (options.peaks) {
      Promise.resolve().then(async () => {
        await waveform.load(options.url, options.peaks, options.duration);
        listeners.ready?.();
      });
    }
    (options.container.isConnected ? waveforms : decoders).push(waveform);
    return waveform;
  });
});

test('expanded audio shares native playback and cleans up when changing media or closing', async () => {
  const { rerender } = await render(<MediaViewer item={item} />);

  await waitFor(() => expect(waveforms).toHaveLength(1));
  const audio = screen.getByLabelText('audio media', { selector: 'audio' });
  expect(audio).toHaveAttribute('controls');
  expect(WaveSurfer.create).toHaveBeenCalledWith(
    expect.objectContaining({ media: audio })
  );
  expect(decoders[0].load).toHaveBeenCalledWith(item.url);
  expect(decoders[0].destroy).toHaveBeenCalledTimes(1);
  expect(waveforms[0].load).toHaveBeenCalledWith(item.url, peaks, 3);
  const nextItem = { ...item, url: 'https://example.com/next.mp3' };
  rerender(<MediaViewer item={nextItem} />);
  expect(waveforms[0].destroy).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(waveforms).toHaveLength(2));
  expect(waveforms[1].load).toHaveBeenCalledWith(nextItem.url, peaks, 3);
  rerender(<MediaViewer item={null} />);
  expect(waveforms[1].destroy).toHaveBeenCalledTimes(1);
});

test('image preview loads lazily while the expanded image loads eagerly', async () => {
  const image = {
    type: 'image/jpeg',
    url: 'https://example.com/image.jpg',
    altText: 'A landscape',
  };
  const { unmount } = await render(<MediaPreview item={image} />);
  expect(screen.getByAltText('A landscape')).toHaveAttribute('loading', 'lazy');
  unmount();
  await render(<MediaViewer item={image} />);
  expect(screen.getByAltText('A landscape')).toHaveAttribute(
    'loading',
    'eager'
  );
  fireEvent.error(screen.getByAltText('A landscape'));
  expect(screen.getByRole('alert')).toHaveTextContent('Media unavailable');
});

test('waveform decoding failure leaves native playback available', async () => {
  WaveSurfer.create.mockReturnValueOnce({
    load: jest.fn().mockRejectedValue(new Error('Audio decoding failed')),
    destroy: jest.fn(),
  });
  await render(<MediaViewer item={item} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Audio preview unavailable. You can still play the audio.'
  );
  expect(
    screen.getByLabelText('audio media', { selector: 'audio' })
  ).toHaveAttribute('controls');
  expect(logger.error).toHaveBeenCalledWith(
    'Error loading Story Map audio waveform',
    expect.any(Error)
  );
});
