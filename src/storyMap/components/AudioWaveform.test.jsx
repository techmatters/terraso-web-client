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
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';
import logger from 'terraso-client-shared/monitoring/logger';
import WaveSurfer from 'wavesurfer.js';

import {
  CarouselPresentation,
  GalleryPresentation,
  MediaViewer,
} from 'terraso-web-client/storyMap/components/StoryMapMedia';

jest.mock('wavesurfer.js', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));
jest.mock('terraso-client-shared/monitoring/logger');

const item = { type: 'audio/mpeg', url: 'https://example.com/audio.mp3' };
const peaks = [[0.1, -0.3, 0.5]];
const OriginalIntersectionObserver = globalThis.IntersectionObserver;
let onIntersection;
let waveforms;
let decoders;
let waveformDuration;
let intersections;

beforeEach(() => {
  waveforms = [];
  decoders = [];
  waveformDuration = 3;
  intersections = [];
  globalThis.IntersectionObserver = jest.fn(callback => {
    onIntersection = callback;
    intersections.push(callback);
    return { observe: jest.fn(), disconnect: jest.fn() };
  });
  WaveSurfer.create.mockImplementation(options => {
    const listeners = {};
    const waveform = {
      load: jest.fn().mockResolvedValue(),
      exportPeaks: jest.fn(() => peaks),
      getDuration: jest.fn(() => waveformDuration),
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

afterEach(() => {
  globalThis.IntersectionObserver = OriginalIntersectionObserver;
});

test('expanded cached audio initializes the real WaveSurfer renderer without competing loads', async () => {
  const RealWaveSurfer = jest.requireActual('wavesurfer.js');
  const originalFetch = global.fetch;
  const ready = jest.fn();
  const load = jest.spyOn(RealWaveSurfer.prototype, 'load');
  const pause = jest
    .spyOn(HTMLMediaElement.prototype, 'pause')
    .mockImplementation(() => {});
  const mediaDuration = jest
    .spyOn(HTMLMediaElement.prototype, 'duration', 'get')
    .mockReturnValue(3);
  global.fetch = jest.fn(
    (url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        );
      })
  );
  WaveSurfer.create.mockReturnValueOnce({
    load: jest.fn().mockResolvedValue(),
    exportPeaks: jest.fn(() => peaks),
    getDuration: jest.fn(() => 3),
    destroy: jest.fn(),
  });
  WaveSurfer.create.mockImplementation(options => {
    const waveform = RealWaveSurfer.create(options);
    waveform.on('ready', ready);
    return waveform;
  });
  let unmount;
  try {
    ({ unmount } = await render(<MediaViewer item={item} />));
    await waitFor(() => {
      expect(logger.error.mock.calls.map(([, error]) => error.stack)).toEqual(
        []
      );
      expect(ready).toHaveBeenCalledWith(3);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(logger.error).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(item.url, peaks, 3);
  } finally {
    unmount?.();
    global.fetch = originalFetch;
    pause.mockRestore();
    mediaDuration.mockRestore();
    load.mockRestore();
  }
});

test('removing the first same-source preview during decoding preserves the remaining preview', async () => {
  let finishDecoding;
  let rejectDecoding;
  const decoding = new Promise((resolve, reject) => {
    finishDecoding = resolve;
    rejectDecoding = reject;
  });
  const firstWaveform = {
    load: jest.fn(() => decoding),
    exportPeaks: jest.fn(() => peaks),
    getDuration: jest.fn(() => 3),
    destroy: jest.fn(() =>
      rejectDecoding(new DOMException('Aborted', 'AbortError'))
    ),
  };
  WaveSurfer.create.mockReturnValueOnce(firstWaveform);
  const first = { ...item, id: 'first' };
  const second = { ...item, id: 'second' };
  const { rerender } = await render(
    <GalleryPresentation items={[first, second]} />
  );
  act(() => intersections[0]([{ isIntersecting: true }]));
  await waitFor(() => expect(firstWaveform.load).toHaveBeenCalledTimes(1));
  await act(async () => intersections[1]([{ isIntersecting: true }]));
  expect(WaveSurfer.create).toHaveBeenCalledTimes(1);

  await act(async () => {
    rerender(<GalleryPresentation items={[second]} />);
  });
  expect(firstWaveform.destroy).not.toHaveBeenCalled();
  await act(async () => finishDecoding());

  expect(await screen.findByText('0:03')).toBeInTheDocument();
  expect(firstWaveform.destroy).toHaveBeenCalledTimes(1);
  expect(firstWaveform.exportPeaks).toHaveBeenCalledWith({ maxLength: 1024 });
  expect(waveforms).toHaveLength(1);
  expect(waveforms[0].load).toHaveBeenCalledWith('', peaks, 3);
  expect(screen.queryByRole('status')).toBeNull();
  expect(logger.error).not.toHaveBeenCalled();
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

test('unmounting the collection cancels pending acquisition without reporting a preview failure', async () => {
  let rejectDecoding;
  const decoder = {
    load: jest.fn(
      () =>
        new Promise((resolve, reject) => {
          rejectDecoding = reject;
        })
    ),
    destroy: jest.fn(() =>
      rejectDecoding(new DOMException('Aborted', 'AbortError'))
    ),
  };
  WaveSurfer.create.mockReturnValueOnce(decoder);
  const { unmount } = await render(<GalleryPresentation items={[item]} />);
  act(() => onIntersection([{ isIntersecting: true }]));
  await waitFor(() => expect(decoder.load).toHaveBeenCalledTimes(1));

  await act(async () => unmount());

  expect(decoder.destroy).toHaveBeenCalledTimes(1);
  expect(waveforms).toHaveLength(0);
  expect(logger.error).not.toHaveBeenCalled();
});

test.each([
  {
    name: 'Gallery',
    Presentation: GalleryPresentation,
    duration: 3.9,
    durationLabel: '0:03',
  },
  {
    name: 'Carousel',
    Presentation: CarouselPresentation,
    duration: 83.9,
    durationLabel: '1:23',
  },
])(
  '$name audio preview loads a non-interactive waveform only near the viewport',
  async ({ Presentation, duration, durationLabel }) => {
    waveformDuration = duration;
    await render(<Presentation items={[item]} />);
    const previewButton = screen.getByRole('button', {
      name: /^(Open|Expand) /,
    });
    expect(
      within(previewButton).getByTestId('VolumeUpIcon')
    ).toBeInTheDocument();
    expect(WaveSurfer.create).not.toHaveBeenCalled();
    expect(within(previewButton).queryByText(durationLabel)).toBeNull();

    act(() => onIntersection([{ isIntersecting: true }]));

    await waitFor(() => expect(waveforms).toHaveLength(1));
    expect(WaveSurfer.create).toHaveBeenCalledWith(
      expect.objectContaining({ interact: false })
    );
    expect(decoders[0].load).toHaveBeenCalledWith(item.url);
    expect(waveforms[0].load).toHaveBeenCalledWith('', peaks, duration);
    expect(
      await within(previewButton).findByText(durationLabel)
    ).toBeInTheDocument();
    expect(
      within(previewButton).getByTestId('VolumeUpIcon')
    ).toBeInTheDocument();
    expect(within(previewButton).queryByLabelText('audio media')).toBeNull();
    act(() => onIntersection([{ isIntersecting: false }]));
    act(() => onIntersection([{ isIntersecting: true }]));
    expect(decoders).toHaveLength(1);
    expect(waveforms).toHaveLength(1);
  }
);

test('expansion shares in-flight preview decoding and reuses peaks when reopened', async () => {
  let finishDecoding;
  const previewWaveform = {
    load: jest.fn(
      () =>
        new Promise(resolve => {
          finishDecoding = resolve;
        })
    ),
    exportPeaks: jest.fn(() => peaks),
    getDuration: jest.fn(() => 3),
    destroy: jest.fn(),
  };
  WaveSurfer.create.mockReturnValueOnce(previewWaveform);

  await render(<GalleryPresentation items={[item]} />);
  act(() => onIntersection([{ isIntersecting: true }]));
  await waitFor(() => expect(previewWaveform.load).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Open audio media 1' }));
  expect(
    within(screen.getByRole('dialog')).getByLabelText('audio media')
  ).toHaveAttribute('controls');
  expect(waveforms).toHaveLength(0);
  expect(WaveSurfer.create).toHaveBeenCalledTimes(1);

  await act(async () => finishDecoding());

  await waitFor(() => expect(waveforms).toHaveLength(2));
  expect(waveforms[0].load).toHaveBeenCalledWith('', peaks, 3);
  expect(waveforms[1].load).toHaveBeenCalledWith(item.url, peaks, 3);
  expect(previewWaveform.destroy).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Close media viewer' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open audio media 1' }));
  await waitFor(() => expect(waveforms).toHaveLength(3));
  expect(waveforms[2].load).toHaveBeenCalledWith(item.url, peaks, 3);
  expect(previewWaveform.load).toHaveBeenCalledTimes(1);
});

test('waveform decoding failure leaves native playback available', async () => {
  WaveSurfer.create.mockReturnValueOnce({
    load: jest.fn().mockRejectedValue(new Error('Audio decoding failed')),
    destroy: jest.fn(),
  });
  await render(<MediaViewer item={item} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Waveform unavailable. You can still use the audio controls.'
  );
  expect(
    screen.getByLabelText('audio media', { selector: 'audio' })
  ).toHaveAttribute('controls');
  expect(logger.error).toHaveBeenCalledWith(
    'Error loading Story Map audio waveform',
    expect.any(Error)
  );
});

test('failed preview keeps the speaker fallback and expansion can retry decoding', async () => {
  WaveSurfer.create.mockReturnValueOnce({
    load: jest.fn().mockRejectedValue(new Error('Audio decoding failed')),
    destroy: jest.fn(),
  });
  await render(<GalleryPresentation items={[item]} />);
  act(() => onIntersection([{ isIntersecting: true }]));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Waveform preview unavailable'
  );
  expect(screen.getByTestId('VolumeUpIcon')).toBeInTheDocument();
  expect(logger.error).toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Open audio media 1' }));

  await waitFor(() => expect(waveforms).toHaveLength(1));
  expect(decoders[0].load).toHaveBeenCalledWith(item.url);
  expect(waveforms[0].load).toHaveBeenCalledWith(item.url, peaks, 3);
  expect(
    within(screen.getByRole('dialog')).getByLabelText('audio media')
  ).toHaveAttribute('controls');
});
