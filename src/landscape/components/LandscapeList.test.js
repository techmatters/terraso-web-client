import React from 'react'
import { act } from 'react-dom/test-utils'
import useMediaQuery from '@mui/material/useMediaQuery'

import { render, screen, within } from 'tests/utils'
import LandscapeList from 'landscape/components/LandscapeList'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('@mui/material/useMediaQuery')

test('LandscapeList: Display error', async () => {
  terrasoApi.request.mockRejectedValue('Load error')
  await act(async () => render(<LandscapeList />))
  expect(screen.getByText(/Load error/i)).toBeInTheDocument()
})
test('LandscapeList: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<LandscapeList />)
  const loader = screen.getByRole('progressbar', { name: '', hidden: true })
  expect(loader).toBeInTheDocument()
})
test('LandscapeList: Empty', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapes: {
      edges: []
    }
  }))
  await act(async () => render(<LandscapeList />))
  expect(screen.getByText(/No Landscapes/i)).toBeInTheDocument()
})
test('LandscapeList: Display list', async () => {
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

  const landscapes = Array(15).fill(0).map((i, landscapeIndex) => ({
    node: {
      slug: `landscape-${landscapeIndex}`,
      id: `landscape-${landscapeIndex}`,
      name: `Landscape Name ${landscapeIndex}`,
      description: 'Landscape Description',
      website: 'www.landscape.org',
      location: 'Ecuador, Quito',
      defaultGroup: {
        edges: [{
          node: {
            group: {
              slug: `test-group-slug-${landscapeIndex}`,
              memberships: generateMemberhips(landscapeIndex, membersCounts[landscapeIndex])
            }
          }
        }]
      }
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapes: {
      edges: landscapes
    }
  }))
  await act(async () => render(<LandscapeList />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    }
  }))

  // Landscape info
  expect(screen.getByRole('heading', { name: 'Landscapes' })).toBeInTheDocument()
  const rows = screen.getAllByRole('row')
  expect(rows.length).toBe(11) // 10 displayed + header
  expect(within(rows[2]).getByRole('cell', { name: 'Landscape Name 1' })).toHaveAttribute('data-field', 'name')
  expect(within(rows[2]).getByRole('cell', { name: '23' })).toHaveAttribute('data-field', 'members')
  expect(within(rows[2]).getByRole('cell', { name: 'Connect' })).toHaveAttribute('data-field', 'actions')
  expect(within(rows[4]).getByRole('cell', { name: 'MEMBER' })).toHaveAttribute('data-field', 'actions')
})
test('LandscapeList: Display list (small screen)', async () => {
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

  const landscapes = Array(15).fill(0).map((i, landscapeIndex) => ({
    node: {
      slug: `landscape-${landscapeIndex}`,
      id: `landscape-${landscapeIndex}`,
      name: `Landscape Name ${landscapeIndex}`,
      description: 'Landscape Description',
      website: 'https://www.landscape.org',
      location: 'Ecuador, Quito',
      defaultGroup: {
        edges: [{
          node: {
            group: {
              slug: `test-group-slug-${landscapeIndex}`,
              memberships: generateMemberhips(landscapeIndex, membersCounts[landscapeIndex])
            }
          }
        }]
      }
    }
  }))

  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapes: {
      edges: landscapes
    }
  }))
  await act(async () => render(<LandscapeList />, {
    user: {
      user: {
        email: 'email@email.com'
      }
    }
  }))

  // Landscape info
  expect(screen.getByRole('heading', { name: 'Landscapes' })).toBeInTheDocument()

  const rows = screen.getAllByRole('listitem')
  expect(rows.length).toBe(15)
  expect(within(rows[1]).getByText('Landscape Name 1')).toBeInTheDocument()
  expect(within(rows[1]).getByText('https://www.landscape.org')).toBeInTheDocument()
  expect(within(rows[1]).getByText('23')).toBeInTheDocument()
  expect(within(rows[1]).getByText('Connect')).toBeInTheDocument()
  expect(within(rows[3]).getByText('MEMBER')).toBeInTheDocument()
})
