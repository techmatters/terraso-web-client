import React from 'react'
import { act } from 'react-dom/test-utils'
import { useLocation } from 'react-router-dom'

import { render, screen, fireEvent } from 'tests/utils'
import Navigation from 'navigation/Navigation'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn()
}))

test('Navigation: Show tabs', async () => {
  useLocation.mockReturnValue({
    pathname: '/'
  })
  await act(async () => render(<Navigation />))
  expect(screen.getByRole('tab', { name: 'HOME' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'LANDSCAPES' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'GROUPS' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'HOME' })).toHaveAttribute('aria-selected', 'true')
})
test('Navigation: Test initial', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes'
  })
  await act(async () => render(<Navigation />))
  expect(screen.getByRole('tab', { name: 'HOME' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByRole('tab', { name: 'LANDSCAPES' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'GROUPS' })).toHaveAttribute('aria-selected', 'false')
})
test('Navigation: Test navigation', async () => {
  useLocation.mockReturnValue({
    pathname: '/'
  })
  await act(async () => render(<Navigation />))
  await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'LANDSCAPES' })))
  expect(screen.getByRole('tab', { name: 'HOME' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByRole('tab', { name: 'LANDSCAPES' })).toHaveAttribute('aria-selected', 'true')
})
test('Navigation: none selected', async () => {
  useLocation.mockReturnValue({
    pathname: '/other'
  })
  await act(async () => render(<Navigation />))
  expect(screen.getByRole('tab', { name: 'HOME' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByRole('tab', { name: 'LANDSCAPES' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByRole('tab', { name: 'GROUPS' })).toHaveAttribute('aria-selected', 'false')
})
