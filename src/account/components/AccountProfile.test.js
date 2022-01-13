import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen } from 'tests/utils'
import AccountProfile from 'account/components/AccountProfile'

jest.mock('account/accountService')

test('AccountProfile: Display Avatar', async () => {
  await act(async () => render(<AccountProfile />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          profileImage: 'test.com'
        }
      }
    }
  }))
  expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument()
})
test('AccountProfile: Display Avatar with missing image', async () => {
  await act(async () => render(<AccountProfile />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          profileImage: ''
        }
      }
    }
  }))
  expect(screen.queryByRole('img', { name: 'John Doe' })).not.toBeInTheDocument()
  expect(screen.getByLabelText('John Doe')).toBeInTheDocument()
})
