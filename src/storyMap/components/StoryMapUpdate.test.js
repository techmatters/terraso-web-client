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
import { act, fireEvent, render, screen, within } from 'tests/utils';
import _ from 'lodash/fp';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { mockTerrasoAPIrequestGraphQL } from 'tests/apiUtils';
import { changeCombobox } from 'tests/uiUtils';

import i18n from 'localization/i18n';
import { useAnalytics } from 'monitoring/analytics';
import { MEMBERSHIP_ROLE_EDITOR } from 'storyMap/storyMapConstants';

import StoryMapUpdate from './StoryMapUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('./StoryMap', () => props => <div>Test</div>);

jest.mock('monitoring/analytics', () => ({
  ...jest.requireActual('monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

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

const API_STORY_MAP = {
  id: '2b8b8352-2d41-4c92-9b97-0d5eb019d5ee',
  slug: 'test-slug',
  storyMapId: 'c4411282',
  title: 'Story Map Title',
  configuration: JSON.stringify(CONFIG),
  createdBy: {
    id: 'dc695d00-d6b4-45b2-ab8d-f48206d998da',
    email: 'jose@techmatters.org',
    firstName: 'Pedro',
    lastName: 'Paez',
  },
  membershipList: {
    memberships: {
      totalCount: 2,
      edges: [
        {
          node: {
            id: '08a06380-911e-49ea-b44b-24c7ddafce1f',
            userRole: MEMBERSHIP_ROLE_EDITOR,
            membershipStatus: 'PENDING',
            pendingEmail: 'pending@test.com',
            user: null,
          },
        },
        {
          node: {
            id: '75bdc04e-9bdc-4c46-b8cb-916a93e8f4b8',
            userRole: MEMBERSHIP_ROLE_EDITOR,
            membershipStatus: 'APPROVED',
            pendingEmail: null,
            user: {
              id: '890ac05b-9c38-4e11-987f-8781b441b23f',
              email: 'test@techmatters.org',
              firstName: 'Jose',
              lastName: 'Perez',
            },
          },
        },
      ],
    },
  },
};

beforeEach(() => {
  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
});

const setup = async user => {
  await render(<StoryMapUpdate />, {
    account: {
      currentUser: {
        data: user,
      },
    },
  });
};

test('StoryMapUpdate: Renders editor', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue({
    storyMaps: {
      edges: [
        {
          node: API_STORY_MAP,
        },
      ],
    },
  });
  await setup({ id: API_STORY_MAP.createdBy.id });

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
          node: API_STORY_MAP,
        },
      ],
    },
  });
  await setup({ id: API_STORY_MAP.createdBy.id });

  const saveButton = screen.getByRole('button', { name: 'Save draft' });
  await act(async () => fireEvent.click(saveButton));

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
});

test('StoryMapUpdate: Show Share Dialog', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue({
    storyMaps: {
      edges: [{ node: API_STORY_MAP }],
    },
  });
  await setup({ id: API_STORY_MAP.createdBy.id });

  const shareButton = screen.getByRole('button', { name: 'Invite' });
  await act(async () => fireEvent.click(shareButton));

  expect(
    screen.getByRole('dialog', { name: 'Invite Editors' })
  ).toBeInTheDocument();

  // Show members list
  const membersList = screen.getByRole('list', { name: 'People with access' });
  expect(membersList).toBeInTheDocument();
  expect(within(membersList).getAllByRole('listitem')).toHaveLength(3);
  API_STORY_MAP.membershipList.memberships.edges.forEach(({ node }) => {
    expect(
      within(membersList).getByRole('listitem', {
        name:
          node.pendingEmail || i18n.t('user.full_name', { user: node.user }),
      })
    ).toBeInTheDocument();
  });

  // Show cancel button
  const cancelButton = screen.getByRole('button', { name: 'Cancel' });
  expect(cancelButton).toBeInTheDocument();
});

test('StoryMapUpdate: Share Dialog invite members', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
  mockTerrasoAPIrequestGraphQL({
    'query fetchStoryMap': Promise.resolve({
      storyMaps: {
        edges: [{ node: API_STORY_MAP }],
      },
    }),
    'mutation addMemberships': Promise.resolve({
      saveStoryMapMembership: {
        memberships: [
          {
            id: 'new-id-1',
            userRole: MEMBERSHIP_ROLE_EDITOR,
            membershipStatus: 'PENDING',
            pendingEmail: 'email2@test.com',
          },
          {
            id: 'new-id-2',
            userRole: MEMBERSHIP_ROLE_EDITOR,
            membershipStatus: 'PENDING',
            user: {
              firstName: 'Manuel',
              lastName: 'Perez',
              email: 'manuel.perez@test.com',
            },
          },
        ],
      },
    }),
  });

  await setup({ id: API_STORY_MAP.createdBy.id });
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }))
  );

  const inviteButton = within(
    screen.getByRole('dialog', { name: 'Invite Editors' })
  ).getByRole('button', { name: 'Invite' });
  expect(inviteButton).toBeInTheDocument();

  changeCombobox(screen, 'Editors', 'email1@text.com email2@test.com');

  await act(async () => fireEvent.click(inviteButton));

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);

  const inviteCall = terrasoApi.requestGraphQL.mock.calls[2][1];

  expect(inviteCall).toMatchObject({
    input: {
      userEmails: ['email1@text.com', 'email2@test.com'],
      userRole: MEMBERSHIP_ROLE_EDITOR,
      storyMapId: API_STORY_MAP.storyMapId,
      storyMapSlug: API_STORY_MAP.slug,
    },
  });

  const membersList = screen.getByRole('list', { name: 'People with access' });
  expect(membersList).toBeInTheDocument();
  expect(within(membersList).getAllByRole('listitem')).toHaveLength(5);
  expect(
    within(membersList).getByRole('listitem', { name: 'email2@test.com' })
  ).toBeInTheDocument();
  expect(
    within(membersList).getByRole('listitem', { name: 'Manuel Perez' })
  ).toBeInTheDocument();

  expect(trackEvent).toHaveBeenCalledWith('storymap.share.invite', {
    props: {
      count: 2,
    },
  });
});

test('StoryMapUpdate: Share Dialog remove members', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });
  mockTerrasoAPIrequestGraphQL({
    'query fetchStoryMap': Promise.resolve({
      storyMaps: {
        edges: [{ node: API_STORY_MAP }],
      },
    }),
    'mutation deleteMembership': Promise.resolve(
      _.set('deleteStoryMapMembership.membership', {}, {})
    ),
  });

  await setup({ id: API_STORY_MAP.createdBy.id });
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }))
  );

  const removeButton = within(
    screen.getByRole('listitem', { name: 'Jose Perez' })
  ).getByRole('button', { name: 'Remove' });
  expect(removeButton).toBeInTheDocument();

  await act(async () => fireEvent.click(removeButton));

  const confirmationButton = screen.getByRole('button', {
    name: 'Remove',
  });

  await act(async () => fireEvent.click(confirmationButton));

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(3);

  const removeCall = terrasoApi.requestGraphQL.mock.calls[2][1];

  expect(removeCall).toMatchObject({
    input: {
      id: '75bdc04e-9bdc-4c46-b8cb-916a93e8f4b8',
      storyMapId: 'c4411282',
      storyMapSlug: 'test-slug',
    },
  });

  expect(trackEvent).toHaveBeenCalledWith('storymap.share.remove');
});

test('StoryMapUpdate: See story map as editor', async () => {
  mockTerrasoAPIrequestGraphQL({
    'query fetchStoryMap': Promise.resolve({
      storyMaps: {
        edges: [
          {
            node: {
              ...API_STORY_MAP,
              membershipList: {
                ...API_STORY_MAP.membershipList,
                accountMembership: {
                  id: API_STORY_MAP.membershipList.memberships.edges[1].node.id,
                  userRole: MEMBERSHIP_ROLE_EDITOR,
                  membershipStatus: 'APPROVED',
                },
              },
            },
          },
        ],
      },
    }),
  });

  await setup(API_STORY_MAP.membershipList.memberships.edges[1].node.user);

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);

  expect(
    screen.getByRole('button', { name: 'Save draft' })
  ).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }))
  );

  const membersList = screen.getByRole('list', { name: 'People with access' });
  API_STORY_MAP.membershipList.memberships.edges.forEach(({ node }) => {
    expect(
      within(membersList).getByRole('listitem', {
        name:
          node.pendingEmail || i18n.t('user.full_name', { user: node.user }),
      })
    ).toBeInTheDocument();
  });

  expect(screen.queryAllByRole('button', { name: 'Remove' }).length).toBe(1);
});
