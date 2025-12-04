/*
 * Copyright © 2024 Technology Matters
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

import { render } from 'tests/utils';

import { useNavigationBlocker } from './navigationContext';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

/*
 * These tests do not cover all of the blocker system's behavior, but verifying that
 * the event handler was added / removed was considered sufficient for an initial pass.
 */

test('Enable navigation blocker', async () => {
  const Component = () => {
    useNavigationBlocker(true, 'test');
    return <div />;
  };

  window.addEventListener = jest.fn();

  await render(<Component />);

  expect(window.addEventListener).toHaveBeenCalledWith(
    'beforeunload',
    expect.any(Function)
  );
});

test('Disable navigation blocker', async () => {
  const Component = () => {
    const { disable } = useNavigationBlocker(true, 'test');
    disable();
    return <div />;
  };

  window.removeEventListener = jest.fn();

  await render(<Component />);

  expect(window.removeEventListener).toHaveBeenCalledWith(
    'beforeunload',
    expect.any(Function)
  );
});
