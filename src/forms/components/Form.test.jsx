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

import { fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import * as yup from 'yup';

import Form from 'terraso-web-client/forms/components/Form';

test('notifies once per title keystroke after the form rerenders', async () => {
  const onChange = jest.fn();
  const props = {
    prefix: 'map-layer',
    fields: [{ name: 'mapTitle', label: 'Layer title' }],
    values: { mapTitle: '' },
    validationSchema: yup.object({ mapTitle: yup.string() }),
    onChange,
  };
  const { rerender } = await render(<Form {...props} />);

  rerender(<Form {...props} />);
  rerender(<Form {...props} />);
  onChange.mockClear();

  const titleInput = screen.getByRole('textbox', { name: 'Layer title' });
  for (const title of ['M', 'Ma', 'Map']) {
    onChange.mockClear();
    fireEvent.change(titleInput, { target: { value: title } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(
      { mapTitle: title },
      'mapTitle',
      'change'
    );
  }
});
