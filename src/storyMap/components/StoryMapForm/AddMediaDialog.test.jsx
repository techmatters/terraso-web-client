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

import { fireEvent, render, screen } from 'terraso-web-client/tests/utils';

import AddMediaDialog from 'terraso-web-client/storyMap/components/StoryMapForm/AddMediaDialog';

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext',
  () => ({ useStoryMapMediaContext: () => ({ addMediaFile: jest.fn() }) })
);

test('AddMediaDialog: a YouTube link is validated and added as embedded media', async () => {
  const onAdd = jest.fn();
  await render(<AddMediaDialog open onClose={jest.fn()} onAdd={onAdd} />);
  const link = screen.getByRole('textbox', {
    name: 'Link to a YouTube or Vimeo video',
  });
  fireEvent.change(link, {
    target: { value: 'https://www.youtube.com/watch?v=abcdefghijk' },
  });
  fireEvent.blur(link);
  fireEvent.click(screen.getByRole('button', { name: 'Add media' }));
  expect(onAdd).toHaveBeenCalledWith({
    type: 'embedded',
    source: 'youtube',
    url: 'https://www.youtube.com/embed/abcdefghijk',
  });
});
