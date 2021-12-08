import React from 'react'
import { act } from 'react-dom/test-utils'
import { useParams } from 'react-router-dom'

import { render, screen, fireEvent } from 'tests/utils'
import LandscapeView from 'landscape/components/LandscapeView'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}))

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ rates: { CAD: 1.42 } }),
  })
)

beforeEach(() => {
  useParams.mockReturnValue({
    id: '1'
  })
})

test('LandscapeView: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error'])
  await act(async () => render(<LandscapeView />))
  expect(screen.getByText(/Load error/i)).toBeInTheDocument()
})
test('LandscapeForm: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<LandscapeView />)
  const loader = screen.getByRole('progressbar', { name: '', hidden: true })
  expect(loader).toBeInTheDocument()
})
test('LandscapeView: Not found', async () => {
  global.fetch.mockReturnValue(Promise.resolve({
    json: () => ([])
  }))
  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscape: null
  }))
  await act(async () => render(<LandscapeView />))
  expect(screen.getByText(/Landscape not found/i)).toBeInTheDocument()
})
test('LandscapeView: Display data', async () => {
  global.fetch.mockReturnValue(Promise.resolve({
    json: () => ([])
  }))
  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscape: {
      name: 'Landscape Name',
      description: 'Landscape Description',
      website: 'www.landscape.org',
      location: 'Ecuador, Quito',
      defaultGroup: {
        edges: [{
          node: {
            group: {
              members: {
                edges: [{
                  node: {
                    firstName: 'Member name',
                    lastName: 'Member Last Name'
                  }
                }, {
                  node: {
                    firstName: 'Member name',
                    lastName: 'Member Last Name'
                  }
                }, {
                  node: {
                    firstName: 'Member name',
                    lastName: 'Member Last Name'
                  }
                }, {
                  node: {
                    firstName: 'Member name',
                    lastName: 'Member Last Name'
                  }
                }, {
                  node: {
                    firstName: 'Member name',
                    lastName: 'Member Last Name'
                  }
                }, {
                  node: {
                    firstName: 'Member name',
                    lastName: 'Member Last Name'
                  }
                }]
              }
            }
          }
        }]
      }
    }
  }))
  await act(async () => render(<LandscapeView />))
  
  // Landscape info
  expect(screen.getByRole('heading', { name: 'Landscape Name' })).toBeInTheDocument()
  expect(screen.getByText(/Ecuador, Quito/i)).toBeInTheDocument()
  expect(screen.getByText(/Landscape Description/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'www.landscape.org' })).toBeInTheDocument()
  
  // Members
  expect(screen.getByText(/6 Landscape Name members have created accounts in Terraso./i)).toBeInTheDocument()
  expect(screen.getByText(/\+2/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Connect to Landscape' })).toBeInTheDocument()

  // Map
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
})
