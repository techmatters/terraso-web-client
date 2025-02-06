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

import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';

import { useAnalytics } from 'monitoring/analytics';

import StoryMapNew from './StoryMapNew';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('./StoryMap', () => props => <div>Test</div>);

jest.mock('monitoring/analytics', () => ({
  ...jest.requireActual('monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

beforeEach(() => {
  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
});

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
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });

  terrasoApi.request.mockResolvedValue({
    id: 'story-map-id-1',
  });

  await render(<StoryMapNew />);

  await act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Add new chapter' }));
  });

  const header = screen.getByRole('region', { name: 'Story editor Header' });
  expect(within(header).getByText('Saving...')).toBeInTheDocument();
  await waitFor(() => {
    expect(within(header).getByText('Draft saved')).toBeInTheDocument();
  });

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);

  expect(trackEvent).toHaveBeenCalledWith('storymap.saveDraft', {
    props: {
      'ILM Output': 'Landscape Narratives',
      map: 'story-map-id-1',
    },
  });
});
