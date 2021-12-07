import React from 'react'
import { act } from 'react-dom/test-utils'
import { useParams } from 'react-router-dom'

import { render, screen, fireEvent } from 'tests/utils'
import LandscapeForm from 'landscape/components/LandscapeForm'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}))

const setup = async () => {
  await act(async () => render(<LandscapeForm />))
  const name = screen.getByRole('textbox', { name: 'LANDSCAPE NAME (Required)' })
  const description = screen.getByRole('textbox', { name: 'LANDSCAPE DESCRIPTION (Required)' })
  const website = screen.getByRole('textbox', { name: 'LANDSCAPE WEBSITE' })
  return {
    inputs: {
      name, description, website
    }
  }
}

beforeEach(() => {
  useParams.mockReturnValue({
    id: '1'
  })
})

test('LandscapeForm: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error'])
  await act(async () => render(<LandscapeForm />))
  expect(screen.getByText(/Load error/i)).toBeInTheDocument()
})
test('LandscapeForm: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<LandscapeForm />)
  const loader = screen.getByRole('progressbar', { name: '', hidden: true })
  expect(loader).toBeInTheDocument()
})
test('LandscapeForm: Fill form', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscape: {
      name: 'Landscape Name',
      description: 'Landscape Description',
      website: 'www.landscape.org'
    }
  }))
  const { inputs } = await setup()

  expect(terrasoApi.request).toHaveBeenCalledTimes(1)
  expect(inputs.name).toHaveValue('Landscape Name')
  expect(inputs.description).toHaveValue('Landscape Description')
  expect(inputs.website).toHaveValue('www.landscape.org')
})
test('LandscapeForm: Input change', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    landscape: {
      name: 'Landscape Name',
      description: 'Landscape Description',
      website: 'www.landscape.org'
    }
  }))
  const { inputs } = await setup()

  expect(inputs.name).toHaveValue('Landscape Name')
  fireEvent.change(inputs.name, { target: { value: 'New name' } })
  expect(inputs.name).toHaveValue('New name')

  expect(inputs.description).toHaveValue('Landscape Description')
  fireEvent.change(inputs.description, { target: { value: 'New description' } })
  expect(inputs.description).toHaveValue('New description')

  expect(inputs.website).toHaveValue('www.landscape.org')
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } })
  expect(inputs.website).toHaveValue('www.other.org')
})
test('LandscapeForm: Input validation', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    landscape: {
      name: 'Landscape Name',
      description: 'Landscape Description',
      website: 'www.landscape.org'
    }
  }))
  const { inputs } = await setup()

  expect(inputs.name).toHaveValue('Landscape Name')
  fireEvent.change(inputs.name, { target: { value: '' } })
  expect(inputs.name).toHaveValue('')

  expect(inputs.description).toHaveValue('Landscape Description')
  fireEvent.change(inputs.description, { target: { value: '' } })
  expect(inputs.description).toHaveValue('')

  expect(inputs.website).toHaveValue('www.landscape.org')
  fireEvent.change(inputs.website, { target: { value: 'wwwotherorg' } })
  expect(inputs.website).toHaveValue('wwwotherorg')

  await act(async () => fireEvent.click(screen.getByText(/Submit Landscape Info/i)))
  expect(screen.getByText(/name is a required field/i)).toBeInTheDocument()
  expect(screen.getByText(/description is a required field/i)).toBeInTheDocument()
  expect(screen.getByText(/website must be a valid URL/i)).toBeInTheDocument()
})
test('LandscapeForm: Save form', async () => {
  terrasoApi.request
    .mockResolvedValueOnce({
      landscape: {
        id: '1',
        name: 'Landscape Name',
        description: 'Landscape Description',
        website: 'www.landscape.org'
      }
    })
    .mockResolvedValueOnce({
      updateLandscape: {
        landscape: {
          id: '1',
          name: 'Landscape Name',
          description: 'Landscape Description',
          website: 'www.landscape.org'
        }
      }
    })

  const { inputs } = await setup()

  fireEvent.change(inputs.name, { target: { value: 'New name' } })
  fireEvent.change(inputs.description, { target: { value: 'New description' } })
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } })

  await act(async () => fireEvent.click(screen.getByText(/Submit Landscape Info/i)))
  expect(terrasoApi.request).toHaveBeenCalledTimes(2)
  const saveCall = terrasoApi.request.mock.calls[1]
  expect(saveCall[1]).toStrictEqual({
    input: {
      id: '1',
      description: 'New description',
      name: 'New name',
      website: 'www.other.org'
    }
  })
})
test('LandscapeForm: Save form error', async () => {
  terrasoApi.request
    .mockReturnValueOnce(Promise.resolve({
      landscape: {
        name: 'Landscape Name',
        description: 'Landscape Description',
        website: 'www.landscape.org'
      }
    }))
    .mockRejectedValueOnce('Save Error')

  const { inputs } = await setup()

  fireEvent.change(inputs.name, { target: { value: 'New name' } })
  fireEvent.change(inputs.description, { target: { value: 'New description' } })
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } })

  await act(async () => fireEvent.click(screen.getByText(/Submit Landscape Info/i)))

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument()

  // Test update values still in the form
  expect(inputs.name).toHaveValue('New name')
  expect(inputs.description).toHaveValue('New description')
  expect(inputs.website).toHaveValue('www.other.org')

  expect(terrasoApi.request).toHaveBeenCalledTimes(2)
})
test('LandscapeForm: Avoid fetch', async () => {
  useParams.mockReturnValue({ id: 'new' })
  const { inputs } = await setup()

  expect(terrasoApi.request).toHaveBeenCalledTimes(0)

  expect(inputs.name).toHaveValue('')
  expect(inputs.description).toHaveValue('')
  expect(inputs.website).toHaveValue('')

  expect(() => screen.getByRole('progressbar', { name: '', hidden: true }))
    .toThrow('Unable to find an element')
})
