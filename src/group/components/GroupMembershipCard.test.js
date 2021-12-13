import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen, fireEvent } from 'tests/utils'
import GroupMembershipCard from 'group/components/GroupMembershipCard'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

const setup = async initialState => {
  await act(async () => render(<GroupMembershipCard
    ownerName="Owner Name"
    groupSlug="group-slug"
    joinLabel="Join Label"
  />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    },
    ...initialState
  }))
}

test('GroupMembershipCard: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  await setup({
    group: {
      memberships: {
        'group-slug': {
          fetching: true
        }
      }
    }
  })
  expect(screen.getByRole('progressbar', { name: '', hidden: true })).toBeInTheDocument()
})
test('GroupMembershipCard: Display join button', async () => {
  await setup()
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
})
test('GroupMembershipCard: Display description', async () => {
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug',
            members: Array(8).fill(0).map(() => ({
              firstName: 'First',
              lastName: 'Last'
            }))
          }
        }
      }
    }
  })
  expect(screen.getByText('8 Owner Name members have created accounts in Terraso.')).toBeInTheDocument()
})
test('GroupMembershipCard: Join error', async () => {
  terrasoApi.request.mockRejectedValueOnce('Join error')
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug'
          }
        }
      }
    }
  })
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Join Label' })))
  expect(screen.getByText(/Join error/i)).toBeInTheDocument()
})
test('GroupMembershipCard: Join', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    addMembership: {
      membership: {
        group: {
          slug: 'group-slug',
          memberships: {
            edges: [{
              node: {
                user: {
                  email: 'email@email.com',
                  firstName: 'First',
                  lastName: 'Last'
                }
              }
            }]
          }
        }
      }
    }
  }))
  await setup({
    group: {
      memberships: {
        'group-slug': {
          group: {
            slug: 'group-slug'
          }
        }
      }
    }
  })
  expect(screen.getByText('0 Owner Name members have created accounts in Terraso.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Join Label' })))
  expect(terrasoApi.request).toHaveBeenCalledTimes(1)
  expect(screen.getByText('1 Owner Name member has created an account in Terraso.')).toBeInTheDocument()
  expect(() => screen.getByRole('progressbar')).toThrow()
  expect(() => screen.getByRole('button', { name: 'Join Label' })).toThrow()
})
