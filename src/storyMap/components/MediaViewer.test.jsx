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

import MediaViewer from 'terraso-web-client/storyMap/components/MediaViewer';

test('expanded video has controls and is constrained to the viewport', async () => {
  await render(
    <MediaViewer
      item={{ type: 'video/mp4', url: 'https://test.com/portrait.mp4' }}
      onClose={jest.fn()}
    />
  );
  const video = screen.getByLabelText('video media', { selector: 'video' });
  expect(video).toHaveAttribute('controls');
  expect(getComputedStyle(video).maxHeight).toBe('calc(100dvh - 32px)');
});
