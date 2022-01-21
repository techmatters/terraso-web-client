import React from 'react';
import { act } from 'react-dom/test-utils';

import { render, screen, fireEvent } from 'tests/utils';
import GroupMembershipCard from 'group/components/GroupMembershipCard';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

const setup = async initialState => {
  await act(async () =>
    render(
      <GroupMembershipCard
        ownerName="Owner Name"
        groupSlug="group-slug"
        joinLabel="Join Label"
        leaveLabel="Leave Label"
        confirmMessageText="Confirm Message Text"
        confirmMessageTitle="Confirm Message Title"
        confirmButtonLabel="Confirm Button Label"
      />,
      {
        account: {
          hasToken: true,
          currentUser: {
            fetching: false,
            data: {
              email: 'email@email.com',
              firstName: 'First',
              lastName: 'Last',
            },
          },
        },
        ...initialState,
      }
    )
  );
};

test('GroupMembershipCard: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}));
  await setup({
    group: {
      memberships: {
        'group-slug': {
          fetching: true,
        },
      },
    },
  });
  expect(
    screen.getByRole('progressbar', { name: '', hidden: true })
  ).toBeInTheDocument();
});
test('GroupMembershipCard: Display join button', async () => {
  await setup();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
});
test('GroupMembershipCard: Display description', async () => {
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
            members: Array(8)
              .fill(0)
              .map(() => ({
                firstName: 'First',
                lastName: 'Last',
              })),
          },
        },
      },
    },
  });
  expect(
    screen.getByText(
      '8 Terraso members have affiliated themselves with Owner Name.'
    )
  ).toBeInTheDocument();
});
test('GroupMembershipCard: Join error', async () => {
  terrasoApi.request.mockRejectedValueOnce('Join error');
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
          },
        },
      },
    },
  });
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Join Label' }))
  );
  expect(screen.getByText(/Join error/i)).toBeInTheDocument();
});
test('GroupMembershipCard: Join (not found)', async () => {
  terrasoApi.request.mockReturnValueOnce(
    Promise.resolve({
      addMembership: {
        membership: {
          group: null,
        },
      },
    })
  );
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
          },
        },
      },
    },
  });
  expect(
    screen.getByText(
      '0 Terraso members have affiliated themselves with Owner Name.'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Join Label' }))
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Group not found')).toBeInTheDocument();
});
test('GroupMembershipCard: Join', async () => {
  terrasoApi.request.mockReturnValueOnce(
    Promise.resolve({
      addMembership: {
        membership: {
          group: {
            slug: 'group-slug',
            memberships: {
              edges: [
                {
                  node: {
                    user: {
                      email: 'email@email.com',
                      firstName: 'First',
                      lastName: 'Last',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    })
  );
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
          },
        },
      },
    },
  });
  expect(
    screen.getByText(
      '0 Terraso members have affiliated themselves with Owner Name.'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Join Label' }))
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText('1 Terraso member has affiliated with Owner Name.')
  ).toBeInTheDocument();
  expect(() => screen.getByRole('progressbar')).toThrow();
  expect(() => screen.getByRole('button', { name: 'Join Label' })).toThrow();
});
test('GroupMembershipCard: Leave error', async () => {
  terrasoApi.request.mockRejectedValueOnce('Leave error');
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
            members: [
              {
                membershipId: 'membership-id',
                email: 'email@email.com',
                firstName: 'John',
                lastName: 'Doe',
              },
            ],
          },
        },
      },
    },
  });
  expect(
    screen.getByText('1 Terraso member has affiliated with Owner Name.')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'LEAVE LABEL' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'LEAVE LABEL' }))
  );
  // Confirm dialog
  expect(screen.getByText('Confirm Message Title')).toBeInTheDocument();
  expect(screen.getByText('Confirm Message Text')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Confirm Button Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm Button Label' })
    )
  );

  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Leave error/i)).toBeInTheDocument();
});
test('GroupMembershipCard: Leave', async () => {
  terrasoApi.request.mockReturnValueOnce(
    Promise.resolve({
      deleteMembership: {
        membership: {
          group: {
            slug: 'group-slug',
          },
        },
      },
    })
  );
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
            members: [
              {
                membershipId: 'membership-id',
                email: 'email@email.com',
                firstName: 'John',
                lastName: 'Doe',
              },
            ],
          },
        },
      },
    },
  });
  expect(
    screen.getByText('1 Terraso member has affiliated with Owner Name.')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'LEAVE LABEL' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'LEAVE LABEL' }))
  );
  // Confirm dialog
  expect(
    screen.getByRole('button', { name: 'Confirm Button Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm Button Label' })
    )
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);

  expect(
    screen.getByText(
      '0 Terraso members have affiliated themselves with Owner Name.'
    )
  ).toBeInTheDocument();
  expect(() => screen.getByRole('progressbar')).toThrow();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
});
