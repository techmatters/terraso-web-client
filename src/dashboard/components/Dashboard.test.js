import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen } from 'tests/utils'
import Dashboard from 'dashboard/components/Dashboard'
import { fetchDashboardData } from 'dashboard/dashboardService'

jest.mock('user/dashboard/dashboardService')

test('Dashboard: Display error', async () => {
  fetchDashboardData.mockReturnValue(Promise.reject(
    'Load error'
  ))
  await act(async () => render(<Dashboard />))
  expect(screen.getByText(/Error loading data. Error: Load error/i)).toBeInTheDocument()
})
test('Dashboard: Display loader', () => {
  fetchDashboardData.mockReturnValue(new Promise(() => {}))
  render(<Dashboard />)
  const loaders = screen.getAllByRole('loader', { name: '', hidden: true })
  expect(loaders.length).toBe(2)
  loaders.forEach(role =>
    expect(role).toBeInTheDocument()
  )
})
test('Dashboard: Display user', async () => {
  fetchDashboardData.mockReturnValue(Promise.resolve({
    groups: [],
    landscapes: []
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
  fetchDashboardData.mockReturnValue(Promise.resolve({
    groups: [],
    landscapes: [{
      id: 'id-1',
      name: 'Landscape 1',
      role: 'member'
    }, {
      id: 'id-2',
      name: 'Landscape 2',
      role: 'manager'
    }]
  }))
  await act(async () => render(<Dashboard />))
  expect(screen.getByText(/Landscape 1/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Member/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape 2/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Manager/i)).toBeInTheDocument()
})
test('Dashboard: Display groups', async () => {
  fetchDashboardData.mockReturnValue(Promise.resolve({
    groups: [{
      id: 'id-1',
      name: 'Group 1',
      role: 'member'
    }, {
      id: 'id-2',
      name: 'Group 2',
      role: 'manager'
    }],
    landscapes: [{
      id: 'id-1',
      name: 'Landscape 1',
      role: 'member'
    }, {
      id: 'id-2',
      name: 'Landscape 2',
      role: 'manager'
    }]
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
