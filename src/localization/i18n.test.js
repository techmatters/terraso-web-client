import { render, screen } from 'tests/utils';
import { act } from 'react-dom/test-utils';
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
  await act(async () => render(<LocalizedComponent />));
  expect(screen.queryByText('English content')).toBeInTheDocument();
  await act(async () => i18n.changeLanguage('es-EC'));
  expect(screen.queryByText('Contenido en Español')).toBeInTheDocument();
});
