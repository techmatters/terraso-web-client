import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen } from 'tests/utils'
import Home from 'home/components/Home'
import { fetchHomeData } from 'home/homeService'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('home/homeService', () => ({
  ...jest.requireActual('home/homeService'),
  fetchHomeData: jest.fn()
}))

const setup = async () => {
  await act(async () => render(<Home />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'First',
          lastName: 'Last'
        }
      }
    }
  }))
}

beforeEach(() => {
  fetchHomeData.mockImplementation(jest.requireActual('home/homeService').fetchHomeData)
})

test('Home: Display error', async () => {
  terrasoApi.request.mockRejectedValue('Load error')
  await setup()
  expect(screen.getByText(/Error loading data. Load error/i)).toBeInTheDocument()
})
test('Home: Display loader', async () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  await setup()
  const loaders = screen.getAllByRole('loader', { name: '', hidden: true })
  expect(loaders.length).toBe(2)
  loaders.forEach(role =>
    expect(role).toBeInTheDocument()
  )
})
test('Home: Display landscapes', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: []
    },
    landscapeGroups: {
      edges: [{
        node: {
          associatedLandscapes: {
            edges: [{
              node: {
                landscape: {
                  id: 'id-1',
                  slug: 'id-1',
                  name: 'Landscape 1',
                  role: 'member'
                }
              }
            }, {
              node: {
                landscape: {
                  id: 'id-2',
                  slug: 'id-2',
                  name: 'Landscape 2',
                  role: 'manager'
                }
              }
            }]
          }
        }
      }]
    }
  }))
  await setup()
  expect(screen.getByText(/Landscape 1/i)).toBeInTheDocument()
  expect(screen.getByText(/Member/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape 2/i)).toBeInTheDocument()
  expect(screen.getByText(/Manager/i)).toBeInTheDocument()
})
test('Home: Display groups', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    userIndependentGroups: {
      edges: [{
        node: {
          id: 'id-1',
          slug: 'id-1',
          name: 'Group 1',
          role: 'member'
        }
      }]
    },
    userLandscapeGroups: {
      edges: [{
        node: {
          id: 'id-2',
          slug: 'id-2',
          name: 'Group 2',
          role: 'manager'
        }
      }]
    }
  }))
  await setup()
  expect(screen.getByText('Group 1')).toBeInTheDocument()
  expect(screen.getByText('(Member)')).toBeInTheDocument()
  expect(screen.getByText('Group 2')).toBeInTheDocument()
  expect(screen.getByText('(Manager)')).toBeInTheDocument()
})
test('Home: Display defaults', async () => {
  fetchHomeData.mockReturnValue(Promise.resolve({
    groups: [],
    landscapes: [],
    landscapesDiscovery: []
  }))
  await setup()
  expect(screen.getByText(/EXPLORE LANDSCAPES/i)).toBeInTheDocument()
  expect(screen.getByText(/Groups connect people/i)).toBeInTheDocument()
})
