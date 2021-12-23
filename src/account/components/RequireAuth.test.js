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
            firstName: 'First',
            lastName: 'Last'
          }
        }
      }
    }
  ))
  expect(screen.getByText('To: /account')).toBeInTheDocument()
})
