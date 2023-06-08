/*
 * Copyright © 2021-2023 Technology Matters
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
import { act, fireEvent, render, screen } from 'tests/utils';
import * as terrasoApi from 'terrasoApi/shared/terrasoApi/api';
import StoryMapNew from './StoryMapNew';

jest.mock('terrasoApi/shared/terrasoApi/api');

jest.mock('./StoryMap', () => props => <div>Test</div>);

test('StoryMapNew: Renders editor', async () => {
  await render(<StoryMapNew />);

  expect(
    screen.getByRole('region', { name: 'Story editor Header' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Chapters sidebar' })
  ).toBeInTheDocument();
});

test('StoryMapNew: Save', async () => {
  await render(<StoryMapNew />);

  const saveButton = screen.getByRole('button', { name: 'Save draft' });
  await act(async () => fireEvent.click(saveButton));

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
});
