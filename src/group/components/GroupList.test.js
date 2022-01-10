import React from 'react'
import { act } from 'react-dom/test-utils'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useSearchParams } from 'react-router-dom'

import { render, screen, within, fireEvent } from 'tests/utils'
import GroupList from 'group/components/GroupList'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('@mui/material/useMediaQuery')

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}))

beforeEach(() => {
  useSearchParams.mockReturnValue([
    new URLSearchParams(),
    () => {}
  ])
})

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
      name: `Group name ${groupIndex}`,
      description: 'Group description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: generateMemberhips(groupIndex, membersCounts[groupIndex])
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapeGroups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          email: 'email@email.com'
        }
      }
    }
  }))

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()
  const rows = screen.getAllByRole('row')
  expect(rows.length).toBe(16) // 15 displayed + header
  expect(within(rows[2]).getByRole('cell', { name: 'Group name 1' })).toHaveAttribute('data-field', 'name')
  expect(within(rows[2]).getByRole('cell', { name: 'https://www.group.org' })).toHaveAttribute('data-field', 'website')
  expect(within(rows[2]).getByRole('cell', { name: 'email@email.com' })).toHaveAttribute('data-field', 'email')
  expect(within(rows[2]).getByRole('cell', { name: '23' })).toHaveAttribute('data-field', 'members')
  expect(within(rows[2]).getByRole('cell', { name: 'Join' })).toHaveAttribute('data-field', 'actions')
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
      name: `Group name ${groupIndex}`,
      description: 'Group description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: generateMemberhips(groupIndex, membersCounts[groupIndex])
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapeGroups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          email: 'email@email.com'
        }
      }
    }
  }))

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()
  const rows = screen.getAllByRole('row')
  expect(rows.length).toBe(16) // 11 displayed + header

  // Sorting
  expect(within(rows[1]).getByRole('cell', { name: 'Group name 0' })).toHaveAttribute('data-field', 'name')
  await act(async () => fireEvent.click(within(rows[0]).getByRole('columnheader', { name: 'Group name' })))
  expect(within(rows[1]).getByRole('cell', { name: 'Group name 9' })).toHaveAttribute('data-field', 'name')
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
      name: `Group name ${groupIndex}`,
      description: 'Group description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: generateMemberhips(groupIndex, membersCounts[groupIndex])
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    independentGroups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          email: 'email@email.com'
        }
      }
    }
  }))

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()

  const rows = screen.getAllByRole('listitem')
  expect(rows.length).toBe(15)
  expect(within(rows[1]).getByText('Group name 1')).toBeInTheDocument()
  expect(within(rows[1]).getByText('https://www.group.org')).toBeInTheDocument()
  expect(within(rows[1]).getByText('email@email.com')).toBeInTheDocument()
  expect(within(rows[1]).getByText('23')).toBeInTheDocument()
  expect(within(rows[1]).getByText('Join')).toBeInTheDocument()
  expect(within(rows[8]).getByText('MEMBER')).toBeInTheDocument()
})
test('GroupList: URL params', async () => {
  const entriesSpy = jest.spyOn(URLSearchParams.prototype, "entries")
  entriesSpy.mockReturnValue(
    new Map([['page', '1']])
  )

  const setParamsMock = jest.fn()
  useSearchParams.mockReturnValue([
    new URLSearchParams(),
    setParamsMock
  ])

  const groups = Array(21).fill(0).map((i, groupIndex) => ({
    node: {
      slug: `group-${groupIndex}`,
      id: `group-${groupIndex}`,
      name: `Group name ${groupIndex}`,
      description: 'Group description',
      website: 'https://www.group.org',
      email: 'email@email.com',
      memberships: { edges: [] }
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapeGroups: {
      edges: groups
    }
  }))
  await act(async () => render(<GroupList />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          email: 'email@email.com'
        }
      }
    }
  }))
  expect(entriesSpy).toHaveBeenCalledTimes(2)

  // Group info
  expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument()
  const rows = screen.getAllByRole('row')
  expect(rows.length).toBe(7) // Second page + header

  // Sorting
  await act(async () => fireEvent.click(within(rows[0]).getByRole('columnheader', { name: 'Group name' })))
  expect(setParamsMock).toHaveBeenCalledTimes(1)
  const setCallSort = setParamsMock.mock.calls[0]
  expect(setCallSort[0]).toStrictEqual({
    page: '1',
    sort: '-name'
  })

  // Page
  await act(async () => fireEvent.click(screen.getByLabelText('Go to previous page')))
  const setCallPage = setParamsMock.mock.calls[1]
  expect(setCallPage[0]).toStrictEqual({
    page: 0
  })
})
