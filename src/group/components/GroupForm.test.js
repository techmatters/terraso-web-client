import React from 'react'
import { act } from 'react-dom/test-utils'
import { useParams } from 'react-router-dom'

import { render, screen, fireEvent } from 'tests/utils'
import GroupForm from 'group/components/GroupForm'
import * as terrasoApi from 'terrasoBackend/api'

jest.mock('terrasoBackend/api')

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}))

const setup = async () => {
  await act(async () => render(<GroupForm />))
  const name = screen.getByRole('textbox', { name: 'GROUP NAME (Required)' })
  const description = screen.getByRole('textbox', { name: 'GROUP DESCRIPTION (Required)' })
  const email = screen.getByRole('textbox', { name: 'GROUP CONTACT EMAIL ADDRESS' })
  const website = screen.getByRole('textbox', { name: 'GROUP WEBSITE' })
  return {
    inputs: {
      name, description, email, website
    }
  }
}

beforeEach(() => {
  useParams.mockReturnValue({
    id: '1'
  })
})

test('GroupForm: Display error', async () => {
  terrasoApi.request.mockRejectedValue(['Load error'])
  await act(async () => render(<GroupForm />))
  expect(screen.getByText(/Load error/i)).toBeInTheDocument()
})
test('GroupForm: Display loader', () => {
  terrasoApi.request.mockReturnValue(new Promise(() => {}))
  render(<GroupForm />)
  const loader = screen.getByRole('progressbar', { name: '', hidden: true })
  expect(loader).toBeInTheDocument()
})
test('GroupForm: Fill form', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    group: {
      name: 'Group Name',
      description: 'Group Description',
      email: 'group@group.org',
      website: 'www.group.org'
    }
  }))
  const { inputs } = await setup()

  expect(terrasoApi.request).toHaveBeenCalledTimes(1)
  expect(inputs.name).toHaveValue('Group Name')
  expect(inputs.description).toHaveValue('Group Description')
  expect(inputs.email).toHaveValue('group@group.org')
  expect(inputs.website).toHaveValue('www.group.org')
})
test('GroupForm: Input change', async () => {
  terrasoApi.request.mockReturnValueOnce(Promise.resolve({
    group: {
      name: 'Group Name',
      description: 'Group Description',
      email: 'group@group.org',
      website: 'www.group.org'
    }
  }))
  const { inputs } = await setup()

  expect(inputs.name).toHaveValue('Group Name')
  fireEvent.change(inputs.name, { target: { value: 'New name' } })
  expect(inputs.name).toHaveValue('New name')

  expect(inputs.description).toHaveValue('Group Description')
  fireEvent.change(inputs.description, { target: { value: 'New description' } })
  expect(inputs.description).toHaveValue('New description')

  expect(inputs.email).toHaveValue('group@group.org')
  fireEvent.change(inputs.email, { target: { value: 'new.email@group.org' } })
  expect(inputs.email).toHaveValue('new.email@group.org')

  expect(inputs.website).toHaveValue('www.group.org')
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } })
  expect(inputs.website).toHaveValue('www.other.org')
})
test('GroupForm: Input validation', async () => {
  terrasoApi.request.mockReturnValue(Promise.resolve({
    group: {
      name: 'Group Name',
      description: 'Group Description',
      email: 'group@group.org',
      website: 'www.group.org'
    }
  }))
  const { inputs } = await setup()

  expect(inputs.name).toHaveValue('Group Name')
  fireEvent.change(inputs.name, { target: { value: '' } })
  expect(inputs.name).toHaveValue('')

  expect(inputs.description).toHaveValue('Group Description')
  fireEvent.change(inputs.description, { target: { value: '' } })
  expect(inputs.description).toHaveValue('')

  expect(inputs.email).toHaveValue('group@group.org')
  fireEvent.change(inputs.email, { target: { value: 'new.emailgrouporg' } })
  expect(inputs.email).toHaveValue('new.emailgrouporg')

  expect(inputs.website).toHaveValue('www.group.org')
  fireEvent.change(inputs.website, { target: { value: 'wwwotherorg' } })
  expect(inputs.website).toHaveValue('wwwotherorg')

  await act(async () => fireEvent.click(screen.getByText(/Submit Group Info/i)))
  expect(screen.getByText(/name is a required field/i)).toBeInTheDocument()
  expect(screen.getByText(/description is a required field/i)).toBeInTheDocument()
  expect(screen.getByText(/email must be a valid email/i)).toBeInTheDocument()
  expect(screen.getByText(/website must be a valid URL/i)).toBeInTheDocument()
})
test('GroupForm: Save form', async () => {
  terrasoApi.request
    .mockResolvedValueOnce({
      group: {
        id: '1',
        name: 'Group Name',
        description: 'Group Description',
        email: 'group@group.org',
        website: 'www.group.org'
      }
    })
    .mockResolvedValueOnce({
      updateGroup: {
        group: {
          id: '1',
          name: 'Group Name',
          description: 'Group Description',
          email: 'group@group.org',
          website: 'www.group.org'
        }
      }
    })

  const { inputs } = await setup()

  fireEvent.change(inputs.name, { target: { value: 'New name' } })
  fireEvent.change(inputs.description, { target: { value: 'New description' } })
  fireEvent.change(inputs.email, { target: { value: 'new.email@group.org' } })
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } })

  await act(async () => fireEvent.click(screen.getByText(/Submit Group Info/i)))
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
test('GroupForm: Save form error', async () => {
  terrasoApi.request
    .mockReturnValueOnce(Promise.resolve({
      group: {
        name: 'Group Name',
        description: 'Group Description',
        email: 'group@group.org',
        website: 'www.group.org'
      }
    }))
    .mockRejectedValueOnce('Save Error')

  const { inputs } = await setup()

  fireEvent.change(inputs.name, { target: { value: 'New name' } })
  fireEvent.change(inputs.description, { target: { value: 'New description' } })
  fireEvent.change(inputs.email, { target: { value: 'new.email@group.org' } })
  fireEvent.change(inputs.website, { target: { value: 'www.other.org' } })

  await act(async () => fireEvent.click(screen.getByText(/Submit Group Info/i)))

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument()

  // Test update values still in the form
  expect(inputs.name).toHaveValue('New name')
  expect(inputs.description).toHaveValue('New description')
  expect(inputs.email).toHaveValue('new.email@group.org')
  expect(inputs.website).toHaveValue('www.other.org')

  expect(terrasoApi.request).toHaveBeenCalledTimes(2)
})
test('GroupForm: Avoid fetch', async () => {
  useParams.mockReturnValue({ id: 'new' })
  const { inputs } = await setup()

  expect(terrasoApi.request).toHaveBeenCalledTimes(0)

  expect(inputs.name).toHaveValue('')
  expect(inputs.description).toHaveValue('')
  expect(inputs.email).toHaveValue('')
  expect(inputs.website).toHaveValue('')

  expect(() => screen.getByRole('progressbar', { name: '', hidden: true }))
    .toThrow('Unable to find an element')
})
