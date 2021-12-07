import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen, fireEvent } from 'tests/utils'
import Navigation from 'navigation/Navigation'

test('Navigation: Show tabs', async () => {
  await act(async () => render(<Navigation />))
  expect(screen.getByRole('tab', { name: 'HOME' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'LANDSCAPES' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'GROUPS' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'HOME' })).toHaveAttribute('aria-selected', 'true')
})
test('Navigation: Test navigation', async () => {
  await act(async () => render(<Navigation />))
  await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'LANDSCAPES' })))
  expect(screen.getByRole('tab', { name: 'HOME' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByRole('tab', { name: 'LANDSCAPES' })).toHaveAttribute('aria-selected', 'true')
})
