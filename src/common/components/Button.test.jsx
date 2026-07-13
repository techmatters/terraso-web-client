/*
 * Copyright © 2026 Technology Matters
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

import { render, screen } from 'terraso-web-client/tests/utils';

import Button from 'terraso-web-client/common/components/Button';

test('Button applies Figma size spacing for small contained secondary', async () => {
  await render(
    <Button color="secondary" size="small" variant="contained">
      Sign in
    </Button>
  );

  expect(screen.getByRole('button', { name: 'Sign in' })).toHaveStyle({
    padding: '4px 10px',
    borderRadius: '4px',
    backgroundColor: '#028843',
    color: '#FFFFFF',
    gap: '8px',
    fontFamily: 'Lato, Helvetica, Arial, sans-serif',
    fontSize: '13px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '26px',
  });
});

test('Button applies Figma outlined primary styles', async () => {
  await render(
    <Button color="primary" variant="outlined">
      Learn more
    </Button>
  );

  expect(screen.getByRole('button', { name: 'Learn more' })).toHaveStyle({
    padding: '6px 16px',
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    color: '#00344D',
    border: '1px solid #00344D',
    fontFamily: 'Lato, Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '26px',
  });
});

test('Button applies Figma outlined focus styles', async () => {
  await render(
    <Button color="primary" variant="outlined">
      Focus target
    </Button>
  );

  const button = screen.getByRole('button', { name: 'Focus target' });
  button.classList.add('Mui-focusVisible');

  expect(button).toHaveStyle({
    backgroundColor: '#FFFFFF',
    color: '#00344D',
    border: '1px solid #00344D',
    outline: '2px solid #076B8E',
    outlineOffset: '3px',
  });
});

test('Button uses solid outlined hover background token', async () => {
  await render(
    <Button color="primary" variant="outlined">
      Hover target
    </Button>
  );

  const button = screen.getByRole('button', { name: 'Hover target' });

  expect(button).toHaveStyle({
    backgroundColor: '#FFFFFF',
  });
  expect(button).toHaveStyleRule?.('background-color', '#EBEFF1', {
    modifier: ':hover',
  });
});
