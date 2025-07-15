/*
 * Copyright © 2023 Technology Matters
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

import { render, screen, waitFor, within } from 'tests/utils';
import { useNavigate, useSearchParams } from 'react-router';
import { mockTerrasoAPIrequestGraphQL } from 'tests/apiUtils';

import { useAnalytics } from 'monitoring/analytics';

import StoryMapInvite from './StoryMapInvite';

// Generated token with https://jwt.io/
// {
//   "membershipId": "membership-id-1",
//   "pendingEmail": null,
//   "sub": "user-id-1",
//   "email": "test@test.com"
// }
const TOKEN =
  'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJzaGlwSWQiOiJtZW1iZXJzaGlwLWlkLTEiLCJwZW5kaW5nRW1haWwiOm51bGwsInN1YiI6InVzZXItaWQtMSIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.p_eLvIrnx7vuY_7SgOand9FRoFZM6Hwen9cbGjStwXLy8htHkNW_if2tjaDKjteDKLklvM5ro4WScQAqfTLJag';

jest.mock('terraso-client-shared/terrasoApi/api');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('monitoring/analytics', () => ({
  ...jest.requireActual('monitoring/analytics'),
  useAnalytics: jest.fn(),
}));

beforeEach(() => {
  useAnalytics.mockReturnValue({
    trackEvent: jest.fn(),
  });
});

const setup = async initialState => {
  await render(<StoryMapInvite />, initialState);
};

test('StoryMapInvite: Valid token', async () => {
  const trackEvent = jest.fn();
  useAnalytics.mockReturnValue({
    trackEvent,
  });

  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  const searchParams = new URLSearchParams();
  searchParams.set('token', TOKEN);
  useSearchParams.mockReturnValue([searchParams]);

  mockTerrasoAPIrequestGraphQL({
    'mutation approveMembershipToken': Promise.resolve({
      approveStoryMapMembershipToken: {
        membership: {
          id: 'membership-id-1',
        },
        storyMap: {
          id: 'story-map-id-1',
          title: 'Hello world',
          storyMapId: 'story-map-id-1',
          slug: 'hello-world',
        },
      },
    }),
  });

  await setup();

  await waitFor(() =>
    expect(
      within(screen.getByRole('alert')).getByText(
        /You have been added to “Hello world”/i
      )
    ).toBeInTheDocument()
  );

  expect(navigate.mock.calls[0]).toEqual([
    '/tools/story-maps/story-map-id-1/hello-world/edit',
  ]);

  expect(trackEvent).toHaveBeenCalledWith('storymap.share.accept', {
    props: { map: 'story-map-id-1' },
  });
});

test('StoryMapInvite: Invalid token', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  const searchParams = new URLSearchParams();
  searchParams.set('token', TOKEN);
  useSearchParams.mockReturnValue([searchParams]);

  mockTerrasoAPIrequestGraphQL({
    'mutation approveMembershipToken': Promise.reject({
      content: 'update_not_allowed',
    }),
  });

  await setup();

  await waitFor(() =>
    expect(
      within(screen.getByRole('alert')).getByText(
        /Unable to accept Story Map invitation/i
      )
    ).toBeInTheDocument()
  );
});

test('StoryMapInvite: Different user token', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  const searchParams = new URLSearchParams();
  searchParams.set('token', TOKEN);
  useSearchParams.mockReturnValue([searchParams]);

  mockTerrasoAPIrequestGraphQL({
    'mutation approveMembershipToken': Promise.reject({
      content: 'update_not_allowed_permissions_validation',
      params: {
        response: {
          storyMap: {
            title: 'Story Map title',
          },
        },
      },
    }),
  });

  await setup();

  expect(
    within(screen.getByRole('alert')).getByText(
      /You can't accept the invitation to edit “Story Map title.” You must sign in using the email address shown in the invitation./i
    )
  ).toBeInTheDocument();

  expect(navigate).not.toHaveBeenCalled();
});
