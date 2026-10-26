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

import { act, render, screen, waitFor } from 'terraso-web-client/tests/utils';
import WaveSurfer from 'wavesurfer.js';

import {
  GalleryPresentation,
  MediaViewer,
} from 'terraso-web-client/storyMap/components/StoryMapMedia';

jest.mock('wavesurfer.js', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const item = { type: 'audio/mpeg', url: 'https://example.com/audio.mp3' };

test('expanded audio shares native playback and cleans up when changing media or closing', async () => {
  const destroy = jest.fn();
  WaveSurfer.create.mockReturnValue({ on: jest.fn(), destroy });
  const { rerender } = await render(<MediaViewer item={item} />);

  await waitFor(() => expect(WaveSurfer.create).toHaveBeenCalledTimes(1));
  const audio = screen.getByLabelText('audio media', { selector: 'audio' });
  expect(audio).toHaveAttribute('controls');
  expect(WaveSurfer.create).toHaveBeenCalledWith(
    expect.objectContaining({ media: audio, url: item.url })
  );
  const nextItem = { ...item, url: 'https://example.com/next.mp3' };
  rerender(<MediaViewer item={nextItem} />);
  expect(destroy).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(WaveSurfer.create).toHaveBeenCalledTimes(2));
  expect(WaveSurfer.create).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: nextItem.url })
  );
  rerender(<MediaViewer item={null} />);
  expect(destroy).toHaveBeenCalledTimes(2);
});

test('Gallery audio keeps its speaker preview without initializing waveform decoding', async () => {
  await render(<GalleryPresentation items={[item]} />);
  expect(screen.getByTestId('VolumeUpIcon')).toBeInTheDocument();
  expect(WaveSurfer.create).not.toHaveBeenCalled();
});

test('waveform decoding failure leaves native playback available', async () => {
  const on = jest.fn();
  WaveSurfer.create.mockReturnValue({ on, destroy: jest.fn() });
  await render(<MediaViewer item={item} />);
  await waitFor(() =>
    expect(on).toHaveBeenCalledWith('error', expect.any(Function))
  );
  const errorHandler = on.mock.calls.find(([event]) => event === 'error')[1];
  act(() => errorHandler(new Error('Audio decoding failed')));

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Waveform unavailable. You can still use the audio controls.'
  );
  expect(
    screen.getByLabelText('audio media', { selector: 'audio' })
  ).toHaveAttribute('controls');
});
