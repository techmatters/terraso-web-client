import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen } from 'tests/utils'
import Dashboard from 'dashboard/components/Dashboard'
import { fetchDashboardData } from 'dashboard/dashboardService'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('dashboard/dashboardService', () => ({
  ...jest.requireActual('dashboard/dashboardService'),
  fetchDashboardData: jest.fn()
}))

beforeEach(() => {
  fetchDashboardData.mockImplementation(jest.requireActual('dashboard/dashboardService').fetchDashboardData)
})

test('Dashboard: Display error', async () => {
  terrasoApi.request.mockRejectedValue('Load error')
  await act(async () => render(<Dashboard />))
  expect(screen.getByText(/Error loading data. Load error/i)).toBeInTheDocument()
})
test('Dashboard: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<Dashboard />)
  const loaders = screen.getAllByRole('loader', { name: '', hidden: true })
  expect(loaders.length).toBe(2)
  loaders.forEach(role =>
    expect(role).toBeInTheDocument()
  )
})
test('Dashboard: Display user', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    groups: {
      edges: []
    }
  }))
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    landscapes: {
      edges: []
    }
  }))
  await act(async () => render(<Dashboard />, {
    user: {
      user: {
        first_name: 'First Name',
        last_name: 'Last Name',
        email: 'email@email.com'
      }
    }
  }))
  expect(screen.getByText(/First Name/i)).toBeInTheDocument()
  expect(screen.getByText(/Last Name/i)).toBeInTheDocument()
  expect(screen.getByText(/email@email.com/i)).toBeInTheDocument()
})
test('Dashboard: Display landscapes', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    groups: {
      edges: []
    },
    landscapes: {
      edges: [{
        node: {
          id: 'id-1',
          name: 'Landscape 1',
          role: 'member'
        }
      }, {
        node: {
          id: 'id-2',
          name: 'Landscape 2',
          role: 'manager'
        }
      }]
    }
  }))
  await act(async () => render(<Dashboard />))
  expect(screen.getByText(/Landscape 1/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Member/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape 2/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Manager/i)).toBeInTheDocument()
})
test('Dashboard: Display groups', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscapes: {
      edges: []
    },
    groups: {
      edges: [{
        node: {
          id: 'id-1',
          name: 'Group 1',
          role: 'member'
        }
      }, {
        node: {
          id: 'id-2',
          name: 'Group 2',
          role: 'manager'
        }
      }]
    }
  }))
  await act(async () => render(<Dashboard />))
  expect(screen.getByText(/Group 1/i)).toBeInTheDocument()
  expect(screen.getByText(/Group Member/i)).toBeInTheDocument()
  expect(screen.getByText(/Group 2/i)).toBeInTheDocument()
  expect(screen.getByText(/Group Manager/i)).toBeInTheDocument()
})
test('Dashboard: Display defaults', async () => {
  fetchDashboardData.mockReturnValue(Promise.resolve({
    groups: [],
    landscapes: []
  }))
  await act(async () => render(<Dashboard />))
  expect(screen.getByText(/Connect to Landscape/i)).toBeInTheDocument()
  expect(screen.getByText(/Terraso groups connect people/i)).toBeInTheDocument()
})
