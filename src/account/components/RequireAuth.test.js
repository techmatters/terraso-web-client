import React from 'react'
import _ from 'lodash'
import { useParams } from 'react-router-dom'

import { render, screen, act } from 'tests/utils'
import GroupView from 'group/components/GroupView'
import * as terrasoApi from 'terrasoBackend/api'
import RequireAuth from 'account/components/RequireAuth'
import { getUserEmail } from 'account/auth'

jest.mock('terrasoBackend/api')

jest.mock('account/auth')

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  Navigate: props => (
    <div>To: {props.to}</div>
  )
}))

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
  getUserEmail.mockReturnValue(Promise.resolve('test@email.com'))
  terrasoApi.request.mockReturnValue(Promise.resolve(_.set({}, 'users.edges[0].node', {
    firstName: 'John',
    lastName: 'Doe'
  })))
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
  expect(terrasoApi.request).toHaveBeenCalledTimes(1)
})
