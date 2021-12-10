import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen, fireEvent } from 'tests/utils'
import GroupMembershipCard from 'group/components/GroupMembershipCard'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

const setup = async () => {
  await act(async () => render(<GroupMembershipCard
    ownerName="Owner Name"
    groupSlug="group-slug"
    joinLabel="Join Label"
  />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    }
  }))
}

test('GroupMembershipCard: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error'])
  await act(async () => render(<GroupMembershipCard />))
  expect(screen.getByText(/Load error/i)).toBeInTheDocument()
})
test('GroupMembershipCard: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<GroupMembershipCard />)
  expect(screen.getByRole('progressbar', { name: '', hidden: true })).toBeInTheDocument()
})
test('GroupMembershipCard: Display join button', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: [{
        node: {
          memberships: {
            edges: []
          }
        }
      }]
    }
  }))
  await setup()
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
})
test('GroupMembershipCard: Display description', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: [{
        node: {
          memberships: {
            edges: Array(8).fill(0).map(() => ({
              node: {
                user: {
                  firstName: 'First',
                  lastName: 'Last'
                }
              }
            }))
          }
        }
      }]
    }
  }))
  await setup()
  expect(screen.getByText('8 Owner Name members have created accounts in Terraso.')).toBeInTheDocument()
})
test('GroupMembershipCard: Join loader', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    groups: {
      edges: [{
        node: {
          slug: 'group-slug',
          memberships: {
            edges: []
          }
        }
      }]
    }
  }))
  terrasoApi.request.mockReturnValueOnce(new Promise(() => {}))
  await setup()
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Join Label' })))
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})
test('GroupMembershipCard: Join error', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    groups: {
      edges: [{
        node: {
          slug: 'group-slug',
          memberships: {
            edges: []
          }
        }
      }]
    }
  }))
  terrasoApi.request.mockRejectedValueOnce('Join error')
  await setup()
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Join Label' })))
  expect(screen.getByText(/Join error/i)).toBeInTheDocument()
})
test('GroupMembershipCard: Join', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    groups: {
      edges: [{
        node: {
          slug: 'group-slug',
          memberships: {
            edges: []
          }
        }
      }]
    }
  }))
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
  await setup()
  expect(screen.getByText('0 Owner Name members have created accounts in Terraso.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Join Label' })).toBeInTheDocument()
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Join Label' })))
  expect(screen.getByText('1 Owner Name member has created an account in Terraso.')).toBeInTheDocument()
  expect(() => screen.getByRole('progressbar')).toThrow()
  expect(() => screen.getByRole('button', { name: 'Join Label' })).toThrow()
})
