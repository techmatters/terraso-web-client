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
import { render, screen } from 'tests/utils';
import { act } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from 'localization/i18n';

i18n.init({
  lng: 'en-US',
  resources: {
    'en-US': {
      translation: {
        'test.key': 'English content',
      },
    },
    'es-EC': {
      translation: {
        'test.key': 'Contenido en Español',
      },
    },
  },
});

const LocalizedComponent = () => {
  const { t } = useTranslation();
  return <div>{t('test.key')}</div>;
};

test('i18n: Test locale change', async () => {
  await render(<LocalizedComponent />);
  expect(screen.getByText('English content')).toBeInTheDocument();
  await act(async () => i18n.changeLanguage('es-EC'));
  expect(screen.getByText('Contenido en Español')).toBeInTheDocument();
});
