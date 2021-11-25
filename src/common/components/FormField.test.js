import React from 'react'
import { act } from 'react-dom/test-utils'

import { render, screen } from 'tests/utils'
import FormField from 'common/components/FormField'

test('FormField: Display Field', async () => {
  await act(async () => render(
    <FormField
      id="field-id"
      label="Field Label"
      info="Field info"
      value="Field Value"
      inputProps={{
        type: 'email',
        placeholder: 'Place holder'
      }}
    />
  ))
  const input = screen.getByRole('textbox', { name: 'Field Label' })
  expect(input).toHaveValue('Field Value')
  expect(screen.queryByText('Field info')).toBeInTheDocument()
})
test('FormField: Display Field error', async () => {
  await act(async () => render(
    <FormField
      id="field-id"
      label="Field Label"
      info="Field info"
      error="Field error"
      value="Field Value"
      inputProps={{
        type: 'email',
        placeholder: 'Place holder'
      }}
    />
  ))
  expect(screen.queryByText('Field error')).toBeInTheDocument()
  expect(screen.queryByText('Field info')).not.toBeInTheDocument()
})
