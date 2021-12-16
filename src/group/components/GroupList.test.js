import React from 'react'
import { act } from 'react-dom/test-utils'
import useMediaQuery from '@mui/material/useMediaQuery'

import { render, screen, within, fireEvent } from 'tests/utils'
import GroupList from 'group/components/GroupList'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('@mui/material/useMediaQuery')

test('GroupList: Display error', async () => {
  terrasoApi.request.mockRejectedValue('Load error')
  await act(async () => render(<GroupList />))
  expect(screen.getByText(/Load error/i)).toBeInTheDocument()
})
test('GroupList: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<GroupList />)
  const loader = screen.getByRole('progressbar', { name: '', hidden: true })
  expect(loader).toBeInTheDocument()
})
test('GroupList: Empty', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: []
    }
  }))
  await act(async () => render(<GroupList />))
  expect(screen.getByText(/No Groups/i)).toBeInTheDocument()
})
test('GroupList: Display list', async () => {
  const isMember = {
    3: true
  }

  const generateMemberhips = (index, count) => ({
    edges: Array(count).fill(0).map(() => ({
      node: {
        user: {
          firstName: 'Member name',
          lastName: 'Member Last Name',
          email: isMember[index]
            ? 'email@email.com'
            : 'other@email.com'
        }
      }
    }))
  })

  const membersCounts = [
    0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5
  ]

  const groups = Array(15).fill(0).map((i, groupIndex) => ({
    node: {
      slug: `group-${groupIndex}`,
      id: `group-${groupIndex}`,
      name: `Group Name ${groupIndex}`,
      description: 'Group Description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: generateMemberhips(groupIndex, membersCounts[groupIndex])
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    }
  }))

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()
  const rows = screen.getAllByRole('row')
  expect(rows.length).toBe(11) // 10 displayed + header
  expect(within(rows[2]).getByRole('cell', { name: 'Group Name 1' })).toHaveAttribute('data-field', 'name')
  expect(within(rows[2]).getByRole('cell', { name: 'https://www.group.org' })).toHaveAttribute('data-field', 'website')
  expect(within(rows[2]).getByRole('cell', { name: 'email@email.com' })).toHaveAttribute('data-field', 'email')
  expect(within(rows[2]).getByRole('cell', { name: '23' })).toHaveAttribute('data-field', 'members')
  expect(within(rows[2]).getByRole('cell', { name: 'Connect' })).toHaveAttribute('data-field', 'actions')
  expect(within(rows[9]).getByRole('cell', { name: 'MEMBER' })).toHaveAttribute('data-field', 'actions')
})
test('GroupList: List sort', async () => {
  const isMember = {
    3: true
  }

  const generateMemberhips = (index, count) => ({
    edges: Array(count).fill(0).map(() => ({
      node: {
        user: {
          firstName: 'Member name',
          lastName: 'Member Last Name',
          email: isMember[index]
            ? 'email@email.com'
            : 'other@email.com'
        }
      }
    }))
  })

  const membersCounts = [
    0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5
  ]

  const groups = Array(15).fill(0).map((i, groupIndex) => ({
    node: {
      slug: `group-${groupIndex}`,
      id: `group-${groupIndex}`,
      name: `Group Name ${groupIndex}`,
      description: 'Group Description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: generateMemberhips(groupIndex, membersCounts[groupIndex])
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    }
  }))

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()
  const rows = screen.getAllByRole('row')
  expect(rows.length).toBe(11) // 10 displayed + header

  // Sorting
  expect(within(rows[1]).getByRole('cell', { name: 'Group Name 0' })).toHaveAttribute('data-field', 'name')
  await act(async () => fireEvent.click(within(rows[0]).getByRole('columnheader', { name: 'Group Name' })))
  expect(within(rows[1]).getByRole('cell', { name: 'Group Name 9' })).toHaveAttribute('data-field', 'name')
})
test('GroupList: Display list (small screen)', async () => {
  useMediaQuery.mockReturnValue(true)
  const isMember = {
    3: true
  }

  const generateMemberhips = (index, count) => ({
    edges: Array(count).fill(0).map(() => ({
      node: {
        user: {
          firstName: 'Member name',
          lastName: 'Member Last Name',
          email: isMember[index]
            ? 'email@email.com'
            : 'other@email.com'
        }
      }
    }))
  })

  const membersCounts = [
    0, 23, 59, 2, 1, 28, 6, 23, 9, 11, 1, 2, 3, 4, 5
  ]

  const groups = Array(15).fill(0).map((i, groupIndex) => ({
    node: {
      slug: `group-${groupIndex}`,
      id: `group-${groupIndex}`,
      name: `Group Name ${groupIndex}`,
      description: 'Group Description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: generateMemberhips(groupIndex, membersCounts[groupIndex])
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    }
  }))

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()

  const rows = screen.getAllByRole('listitem')
  expect(rows.length).toBe(15)
  expect(within(rows[1]).getByText('Group Name 1')).toBeInTheDocument()
  expect(within(rows[1]).getByText('https://www.group.org')).toBeInTheDocument()
  expect(within(rows[1]).getByText('email@email.com')).toBeInTheDocument()
  expect(within(rows[1]).getByText('23')).toBeInTheDocument()
  expect(within(rows[1]).getByText('Connect')).toBeInTheDocument()
  expect(within(rows[8]).getByText('MEMBER')).toBeInTheDocument()
})
