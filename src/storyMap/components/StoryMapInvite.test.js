import { render, screen, waitFor, within } from 'tests/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockTerrasoAPIrequestGraphQL } from 'tests/apiUtils';

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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

const setup = async initialState => {
  await render(<StoryMapInvite />, initialState);
};

test('StoryMapInvite: Valid token', async () => {
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
});

test('StoryMapInvite: Invalid token', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  const searchParams = new URLSearchParams();
  searchParams.set('token', TOKEN);
  useSearchParams.mockReturnValue([searchParams]);

  mockTerrasoAPIrequestGraphQL({
    'mutation approveMembershipToken': Promise.reject('Error'),
  });

  await setup();

  await waitFor(() =>
    expect(
      within(screen.getByRole('alert')).getByText(
        /Failed to accept Story Map invite/i
      )
    ).toBeInTheDocument()
  );
});
