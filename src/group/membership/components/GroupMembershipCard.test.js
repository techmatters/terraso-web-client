import { fireEvent, render, screen } from 'tests/utils';

import React from 'react';

import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';

import { GroupContextProvider } from 'group/groupContext';
import GroupMemberJoin from 'group/membership/components/GroupMemberJoin';
import GroupMemberLeave from 'group/membership/components/GroupMemberLeave';
import GroupMembershipCard from 'group/membership/components/GroupMembershipCard';
import * as terrasoApi from 'terrasoBackend/api';

import GroupMemberRequestCancel from './GroupMemberRequestCancel';

jest.mock('terrasoBackend/api');

const setup = async initialState => {
  await render(
    <GroupContextProvider
      owner={{
        name: 'Owner Name',
      }}
      group={{
        membershipType: 'OPEN',
      }}
      groupSlug="group-slug"
      MemberJoinButton={props => (
        <GroupMemberJoin label="Join Label" {...props} />
      )}
      MemberLeaveButton={props => (
        <GroupMemberLeave label="Leave Label" {...props} />
      )}
      MemberRequestJoinButton={props => (
        <GroupMemberJoin label="Request Join Label" {...props} />
      )}
      MemberRequestCancelButton={props => (
        <GroupMemberRequestCancel label="Request Cancel Label" {...props} />
      )}
    >
      <GroupMembershipCard />
    </GroupContextProvider>,
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
  );
};

test('GroupMembershipCard: Display loader', async () => {
  terrasoApi.requestGraphQL.mockReturnValue(new Promise(() => {}));
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
    screen.getByRole('progressbar', { name: 'Loading', hidden: true })
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
            membersInfo: {
              totalCount: 8,
              membersSample: Array(5)
                .fill(0)
                .map(() => ({
                  firstName: 'First',
                  lastName: 'Last',
                })),
            },
          },
        },
      },
    },
  });
  expect(
    screen.getByText('8 Terraso members joined Owner Name.')
  ).toBeInTheDocument();
});
test('GroupMembershipCard: Join error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValueOnce('Join error');
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
  terrasoApi.requestGraphQL.mockReturnValueOnce(
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
    screen.getByText('0 Terraso members joined Owner Name.')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Join Label' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Group not found')).toBeInTheDocument();
});
test('GroupMembershipCard: Join', async () => {
  terrasoApi.requestGraphQL.mockReturnValueOnce(
    Promise.resolve({
      addMembership: {
        membership: {
          group: {
            slug: 'group-slug',
            accountMembership: _.set('edges[0].node.userRole', 'MEMBER', {}),
            memberships: {
              totalCount: 1,
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
    screen.getByText('0 Terraso members joined Owner Name.')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Join Label' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText('1 Terraso member joined Owner Name.')
  ).toBeInTheDocument();
  expect(() => screen.getByRole('progressbar')).toThrow();
  expect(() => screen.getByRole('button', { name: 'Join Label' })).toThrow();
});
test('GroupMembershipCard: Request Join', async () => {
  terrasoApi.requestGraphQL.mockReturnValueOnce(
    Promise.resolve({
      addMembership: {
        membership: {
          group: {
            slug: 'group-slug',
            membershipType: 'CLOSED',
            accountMembership: _.flow(
              _.set('edges[0].node.userRole', 'MEMBER'),
              _.set('edges[0].node.membershipStatus', 'PENDING')
            )({}),
            memberships: {
              totalCount: 1,
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
            membershipType: 'CLOSED',
          },
        },
      },
    },
  });
  expect(
    screen.getByText(
      'Owner Name is a closed group, so the member list is not visible to non-members.'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Request Join Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Request Join Label' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText(/Your request has been sent to group manager/i)
  ).toBeInTheDocument();
  expect(() => screen.getByRole('progressbar')).toThrow();
  expect(() => screen.getByRole('button', { name: 'Join Label' })).toThrow();
  expect(
    screen.getByRole('button', { name: 'Request Cancel Label' })
  ).toBeInTheDocument();
});
test('GroupMembershipCard: Leave error', async () => {
  terrasoApi.requestGraphQL.mockRejectedValueOnce('Leave error');
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
            membersInfo: {
              totalCount: 1,
              membersSample: [
                {
                  membershipId: 'membership-id',
                  email: 'email@email.com',
                  firstName: 'John',
                  lastName: 'Doe',
                },
              ],
              accountMembership: { userRole: 'MEMBER' },
            },
          },
        },
      },
    },
  });
  expect(
    screen.getByText('1 Terraso member joined Owner Name.')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Leave Label' }))
  );
  // Confirm dialog
  expect(screen.getByText('Leave “Owner Name”')).toBeInTheDocument();
  expect(
    screen.getByText('Are you sure you want to leave the group “Owner Name”?')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Leave Group' }))
  );

  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Leave error/i)).toBeInTheDocument();
});
test('GroupMembershipCard: Leave', async () => {
  terrasoApi.requestGraphQL.mockReturnValueOnce(
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
            membersInfo: {
              totalCount: 1,
              membersSample: [
                {
                  membershipId: 'membership-id',
                  email: 'email@email.com',
                  firstName: 'John',
                  lastName: 'Doe',
                },
              ],
              accountMembership: { userRole: 'MEMBER' },
            },
          },
        },
      },
    },
  });
  expect(
    screen.getByText('1 Terraso member joined Owner Name.')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Leave Label' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Leave Label' }))
  );
  // Confirm dialog
  expect(
    screen.getByRole('button', { name: 'Leave Group' })
  ).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Leave Group' }))
  );
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(1);

  expect(
    screen.getByText('0 Terraso members joined Owner Name.')
  ).toBeInTheDocument();
  expect(() => screen.getByRole('progressbar')).toThrow();
  expect(
    screen.getByRole('button', { name: 'Join Label' })
  ).toBeInTheDocument();
});
test('GroupMembershipCard: Manager', async () => {
  terrasoApi.requestGraphQL.mockReturnValueOnce(
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
            membersInfo: {
              totalCount: 1,
              pendingCount: 2,
              membersSample: [
                {
                  membershipId: 'membership-id',
                  email: 'email@email.com',
                  firstName: 'John',
                  lastName: 'Doe',
                },
              ],
              accountMembership: {
                userRole: 'MANAGER',
                membershipStatus: 'APPROVED',
              },
            },
          },
        },
      },
    },
  });
  expect(screen.getByText(/2 pending members/i)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Manage Members' })
  ).toBeInTheDocument();
});
