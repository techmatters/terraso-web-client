import { render, screen } from 'tests/utils';

import ContactForm from 'contact/ContactForm';
import { useScript } from 'custom-hooks';
import _ from 'lodash/fp';
import React from 'react';
import { act } from 'react-dom/test-utils';

jest.mock('@mui/material/useMediaQuery');
jest.mock('js-cookie');
jest.mock('custom-hooks');

const setup = async () => {
  await render(<ContactForm />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'First',
          lastName: 'Last',
          email: 'email@test.org',
        },
      },
    },
  });
};

beforeEach(() => {
  global.hbspt = _.set('forms.create', jest.fn(), {});
});

test('ContactForm: Load and Submit', async () => {
  useScript.mockReturnValue(false);
  const form = {
    hasField: jest.fn(),
    setFieldValue: jest.fn(),
  };
  global.hbspt.forms.create.mockReturnValue(form);

  form.hasField.mockReturnValue(true);

  await setup();

  await act(async () =>
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'hsFormCallback',
          eventName: 'onFormReady',
        },
      })
    )
  );

  expect(form.setFieldValue).toHaveBeenCalledTimes(1);

  await act(async () =>
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'hsFormCallback',
          eventName: 'onFormSubmit',
        },
      })
    )
  );

  expect(
    screen.getByText(
      'Your message has been sent. Terraso will follow up within two business days.'
    )
  ).toBeInTheDocument();
});
