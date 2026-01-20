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

import { fireEvent, render, screen } from 'terraso-web-client/tests/utils';

import RightSidebar from 'terraso-web-client/storyMap/components/StoryMapForm/RightSidebar';
import { StoryMapConfigContextProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/ShareDialog',
  () => ({
    __esModule: true,
    default: ({ open }) => (
      <div data-testid="share-dialog" data-open={open ? 'true' : 'false'} />
    ),
  })
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/FeaturedImage',
  () => ({
    __esModule: true,
    default: () => <div data-testid="featured-image" />,
  })
);

jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/ShortDescription',
  () => ({
    __esModule: true,
    default: () => <div data-testid="short-description" />,
  })
);

jest.mock('terraso-web-client/storyMap/storyMapUtils', () => ({
  ...jest.requireActual('terraso-web-client/storyMap/storyMapUtils'),
  generateStoryMapUrl: () => 'https://example.com/story-map',
}));

const storyMap = {
  id: 'story-map-1',
  title: 'Story Map Title',
  publishedAt: '2024-01-01T00:00:00Z',
  createdBy: {
    id: 'user-1',
    firstName: 'Jose',
    lastName: 'Buitron',
  },
  memberships: [
    {
      membershipId: 'membership-1',
      user: {
        id: 'user-2',
        firstName: 'Garo',
        lastName: 'Brik',
      },
    },
  ],
};

const renderRightSidebar = props =>
  render(
    <StoryMapConfigContextProvider
      baseConfig={{ chapters: [] }}
      storyMap={storyMap}
    >
      <RightSidebar open onClose={jest.fn()} {...props} />
    </StoryMapConfigContextProvider>
  );

describe('RightSidebar', () => {
  it('renders status, link, contributors, and opens share dialog', async () => {
    await renderRightSidebar();

    expect(screen.getByText(/status:/i)).toBeInTheDocument();
    expect(screen.getByText(/published/i)).toBeInTheDocument();
    expect(
      screen.getByText('https://example.com/story-map')
    ).toBeInTheDocument();

    expect(screen.getByText(/contributors:/i)).toBeInTheDocument();
    expect(screen.getByText('Jose Buitron')).toBeInTheDocument();
    expect(screen.getByText('Garo Brik')).toBeInTheDocument();

    const inviteButton = screen.getByRole('button', {
      name: /invite contributor/i,
    });
    fireEvent.click(inviteButton);

    expect(screen.getByTestId('share-dialog')).toHaveAttribute(
      'data-open',
      'true'
    );
  });
});
