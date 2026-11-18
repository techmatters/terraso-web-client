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

import { openFile } from 'terraso-web-client/common/fileUtils';
import AddMediaDialog from 'terraso-web-client/storyMap/components/StoryMapForm/AddMediaDialog';

const mockAddMediaFile = jest.fn(() => 'selected-id');

jest.mock('terraso-web-client/common/fileUtils', () => ({
  openFile: jest.fn(),
}));
jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext',
  () => ({
    useStoryMapMediaContext: () => ({ addMediaFile: mockAddMediaFile }),
  })
);
jest.mock(
  'terraso-web-client/common/components/DropZone',
  () =>
    ({ onDrop }) => (
      <>
        <button
          onClick={() =>
            onDrop([new File(['one'], 'one.png', { type: 'image/png' })])
          }
        >
          Select first
        </button>
        <button
          onClick={() =>
            onDrop([new File(['two'], 'two.png', { type: 'image/png' })])
          }
        >
          Select second
        </button>
      </>
    )
);

const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};

test('only the most recent selection is registered when added', async () => {
  const first = deferred();
  const second = deferred();
  openFile
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  mockAddMediaFile.mockReturnValue('selected-id');
  const onAdd = jest.fn();
  await render(<AddMediaDialog open onAdd={onAdd} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Select first' }));
  fireEvent.click(screen.getByRole('button', { name: 'Select second' }));
  await act(async () => second.resolve('second-preview'));
  await act(async () => first.resolve('first-preview'));
  expect(mockAddMediaFile).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  expect(mockAddMediaFile).toHaveBeenCalledWith(
    'second-preview',
    expect.objectContaining({ name: 'two.png' })
  );
  expect(onAdd).toHaveBeenCalledWith({
    contentId: 'selected-id',
    filename: 'two.png',
    type: 'image/png',
  });
});

test('closing a dialog discards a pending read and does not register its file', async () => {
  const first = deferred();
  openFile.mockReturnValueOnce(first.promise);
  const onAdd = jest.fn();
  const onClose = jest.fn();
  const { rerender } = await render(
    <AddMediaDialog open onAdd={onAdd} onClose={onClose} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Select first' }));
  rerender(<AddMediaDialog open={false} onAdd={onAdd} onClose={onClose} />);
  await act(async () => first.resolve('first-preview'));
  rerender(<AddMediaDialog open onAdd={onAdd} onClose={onClose} />);
  expect(screen.getByRole('button', { name: 'Add media' })).toBeDisabled();
  expect(mockAddMediaFile).not.toHaveBeenCalled();
});
