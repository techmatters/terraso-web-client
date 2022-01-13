import React from 'react'
import { useParams } from 'react-router-dom'

import { render, screen, act } from 'tests/utils'
import GroupView from 'group/components/GroupView'
import * as terrasoApi from 'terrasoBackend/api'
import RequireAuth from 'account/components/RequireAuth'

jest.mock('terrasoBackend/api')

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  Navigate: props => (
    <div>To: {props.to}</div>
  )
}))

global.fetch = jest.fn()

test('Auth: test redirect', async () => {
  useParams.mockReturnValue({
    slug: 'slug-1'
  })
  terrasoApi.request.mockRejectedValue('UNAUTHENTICATED')
  await act(async () => render(
    <RequireAuth><GroupView /></RequireAuth>,
    {
      account: {
        hasToken: true,
        currentUser: {
          fetching: false,
          data: {
            email: 'email@email.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      }
    }
  ))
  expect(screen.getByText('To: /account')).toBeInTheDocument()
})
test('Auth: test fetch user', async () => {
  global.fetch.mockReturnValue(Promise.resolve({
    json: () => ({
      user: {
        first_name: 'John',
        last_name: 'Doe'
      }
    })
  }))
  await act(async () => render(
    <RequireAuth><div /></RequireAuth>,
    {
      account: {
        hasToken: true,
        currentUser: {
          fetching: true,
          data: null
        }
      }
    }
  ))
  expect(global.fetch).toHaveBeenCalledTimes(1)
})
