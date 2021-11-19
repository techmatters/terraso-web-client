import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen } from 'tests/utils'
import AppBar from 'common/components/AppBar'


test('AppBar: Dont display if no user', async () => {
  await act( async () => render(<AppBar />, {
    user: {
      user: null
    }
  }))
  const title = screen.queryByText('Terraso')
  expect(title).not.toBeInTheDocument()
})
test('AppBar: Display terraso title', async () => {
  await act( async () => render(<AppBar />))
  const title = screen.queryByText('Terraso')
  expect(title).toBeInTheDocument()
})
