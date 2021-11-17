import React from 'react'

import { render, screen } from '../../test/utils'
import Dashboard from './Dashboard'

test('Dashboard: Display error', () => {
  render(<Dashboard />, {
    dashboard: {
      groups: [],
      landscapes: [],
      fetching: false,
      error: 'Load error',
      refresh: false
    }
  })
  expect(screen.getByText(/Error loading data. Error: Load error/i)).toBeInTheDocument()
})
test('Dashboard: Display loader', () => {
  render(<Dashboard />, {
    dashboard: {
      groups: [],
      landscapes: [],
      fetching: true,
      error: null,
      refresh: false
    }
  })
  expect(screen.getByRole('progressbar', { name: '', hidden: true })).toBeInTheDocument()
})
test('Dashboard: Display user', () => {
  render(<Dashboard />, {
    user: {
      user: {
        first_name: 'First Name',
        last_name: 'Last Name',
        email: 'email@email.com'
      }
    },
    dashboard: {
      groups: [],
      landscapes: [],
      fetching: false,
      error: null,
      refresh: false
    }
  })
  expect(screen.getByText(/First Name/i)).toBeInTheDocument()
  expect(screen.getByText(/Last Name/i)).toBeInTheDocument()
  expect(screen.getByText(/email@email.com/i)).toBeInTheDocument()
})
test('Dashboard: Display landscapes', () => {
  render(<Dashboard />, {
    dashboard: {
      groups: [],
      landscapes: [{
        id: 'id-1',
        name: 'Landscape 1',
        role: 'member'
      }, {
        id: 'id-2',
        name: 'Landscape 2',
        role: 'manager'
      }],
      fetching: false,
      error: null,
      refresh: false
    }
  })
  expect(screen.getByText(/Landscape 1/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Member/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape 2/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Manager/i)).toBeInTheDocument()
})
test('Dashboard: Display groups', () => {
  render(<Dashboard />, {
    dashboard: {
      landscapes: [],
      groups: [{
        id: 'id-1',
        name: 'Group 1',
        role: 'member'
      }, {
        id: 'id-2',
        name: 'Group 2',
        role: 'manager'
      }],
      fetching: false,
      error: null,
      refresh: false
    }
  })
  expect(screen.getByText(/Group 1/i)).toBeInTheDocument()
  expect(screen.getByText(/Group Member/i)).toBeInTheDocument()
  expect(screen.getByText(/Group 2/i)).toBeInTheDocument()
  expect(screen.getByText(/Group Manager/i)).toBeInTheDocument()
})
