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

import { render, screen } from 'terraso-web-client/tests/utils';

import RightSidebarToggleButton from 'terraso-web-client/storyMap/components/StoryMapForm/RightSidebarToggleButton';

describe('RightSidebarToggleButton', () => {
  it('renders the expand toggle', async () => {
    await render(<RightSidebarToggleButton onClick={jest.fn()} />);

    expect(screen.getByLabelText(/right sidebar/i)).toBeInTheDocument();
  });

  it('does not render when hidden', async () => {
    await render(<RightSidebarToggleButton onClick={jest.fn()} hidden />);

    expect(screen.queryByLabelText(/right sidebar/i)).not.toBeInTheDocument();
  });
});
