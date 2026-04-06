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

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';

import 'terraso-web-client/localization/i18n';

import FeaturedImageDialog from 'terraso-web-client/storyMap/components/StoryMapForm/FeaturedImageDialog';

import theme from 'terraso-web-client/theme';

jest.mock('terraso-web-client/config', () => ({
  STORY_MAP_FEATURED_IMAGE_RECOMMENDED_DIMENSIONS: {
    width: 1024,
    height: 512,
  },
  STORY_MAP_IMAGE_ACCEPTED_EXTENSIONS: ['gif', 'jpeg', 'jpg', 'png', 'webp'],
  STORY_MAP_IMAGE_ACCEPTED_TYPES: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
  },
  STORY_MAP_MEDIA_MAX_SIZE: 10000000,
}));

test('FeaturedImageDialog: Uses configured recommended dimensions', () => {
  render(
    <ThemeProvider theme={theme}>
      <FeaturedImageDialog
        open
        onClose={jest.fn()}
        onSave={jest.fn()}
        getMediaFile={jest.fn()}
      />
    </ThemeProvider>
  );

  expect(
    screen.getByText('Recommended dimensions: 1024 x 512')
  ).toBeInTheDocument();
});
