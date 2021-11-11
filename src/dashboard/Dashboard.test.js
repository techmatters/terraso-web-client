import React from 'react'
import { render, screen } from '@testing-library/react'

import Dashboard from './Dashboard'

test('Dashboard: check if rendered', () => {
  render(<Dashboard />)
  const linkElement = screen.getByText(/Your Stuff/i)
  expect(linkElement).toBeInTheDocument()
})
