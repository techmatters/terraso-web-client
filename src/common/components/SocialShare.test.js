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
import { act, fireEvent, render, screen } from 'tests/utils';

import SocialShare from './SocialShare';

const setup = async () => {
  await render(<SocialShare name="Test Name" />);
};

beforeEach(() => {
  global.window.open = jest.fn();
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
    },
  });
});

test('SocialShare: Show buttons', async () => {
  await setup();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
  );

  expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Facebook' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Copy Link' })).toBeInTheDocument();
});

test('SocialShare: Test links', async () => {
  await setup();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
  );

  // Email
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Email' }))
  );
  const emailCall = global.window.open.mock.calls[0];
  expect(emailCall[0]).toStrictEqual(
    `mailto:?subject=${encodeURIComponent(
      'Join Test Name on Terraso'
    )}&body=${encodeURIComponent(
      'Check out Test Name on Terraso and join me: http://localhost/'
    )}`
  );

  // WhatsApp
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'WhatsApp' }))
  );
  const whatsAppCall = global.window.open.mock.calls[1];
  expect(whatsAppCall[0]).toStrictEqual(
    `https://wa.me/?text=${encodeURIComponent(
      'Check out Test Name on Terraso and join me: http://localhost/'
    )}`
  );

  // Facebook
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Facebook' }))
  );
  const facebookCall = global.window.open.mock.calls[2];
  expect(facebookCall[0]).toStrictEqual(
    `http://www.facebook.com/share.php?u=${encodeURIComponent(
      'http://localhost/'
    )}`
  );

  // Copy
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }))
  );
  const copyCall = navigator.clipboard.writeText.mock.calls[0];
  expect(copyCall[0].toString()).toStrictEqual('http://localhost/');
});
