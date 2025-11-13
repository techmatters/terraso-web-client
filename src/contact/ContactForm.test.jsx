/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { act, render, screen } from 'terraso-web-client/tests/utils';
import _ from 'lodash/fp';

import { useScript } from 'terraso-web-client/custom-hooks';

import ContactForm from 'terraso-web-client/contact/ContactForm';

jest.mock('@mui/material/useMediaQuery');
jest.mock('js-cookie');
jest.mock('terraso-web-client/custom-hooks');

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
