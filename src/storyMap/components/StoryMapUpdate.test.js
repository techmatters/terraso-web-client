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

import * as terrasoApi from 'state/terrasoBackend/api';

import StoryMapUpdate from './StoryMapUpdate';

jest.mock('state/terrasoBackend/api');

jest.mock('./StoryMap', () => props => <div>Test</div>);

const CONFIG = {
  title: 'Story Map Title',
  subtitle: 'Story Map Subtitle',
  byline: 'by User',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Chapter 1 description',
      media: { type: 'image/png', signedUrl: 'https://test.com/image.png' },
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2',
      description: 'Chapter 2 description',
    },
  ],
};

test('StoryMapUpdate: Renders editor', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue({
    storyMaps: {
      edges: [
        {
          node: {
            id: 'story-1',
            configuration: JSON.stringify(CONFIG),
          },
        },
      ],
    },
  });
  await render(<StoryMapUpdate />);

  expect(
    screen.getByRole('region', { name: 'Story editor Header' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Chapters sidebar' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Story Map Title' })
  ).toBeInTheDocument();
});

test('StoryMapUpdate: Save', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue({
    storyMaps: {
      edges: [
        {
          node: {
            id: 'story-1',
            configuration: JSON.stringify(CONFIG),
          },
        },
      ],
    },
  });
  await render(<StoryMapUpdate />);

  const saveButton = screen.getByRole('button', { name: 'Save draft' });
  await act(async () => fireEvent.click(saveButton));

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
});
