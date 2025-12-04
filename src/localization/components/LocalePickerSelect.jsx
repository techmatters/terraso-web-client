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

import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select as SelectBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { LOCALES } from 'localization/i18n';

import theme from 'theme';

const Select = styled(SelectBase)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.gray.lite1,
    borderRadius: 0,
  },
  '& .MuiInputBase-input': {
    backgroundColor: theme.palette.white,
    fontSize: theme.typography.body2.fontSize,
    padding: 1,
  },
}));

const LocalePickerSelect = props => {
  const { t, i18n } = useTranslation();
  const { locale, onLocaleChange } = props;

  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const getLocaleLabel = locale =>
    isSmall
      ? `localization.locale_${locale}_small`
      : `localization.locale_${locale}`;

  const currentLocale = locale || i18n.resolvedLanguage;

  const handleChange = event => {
    const locale = _.get('target.value', event);
    onLocaleChange(locale);
  };

  return (
    <Select
      size="small"
      value={currentLocale}
      onChange={handleChange}
      inputProps={{
        'aria-label': t('localization.locale_select_label', {
          name: t(getLocaleLabel(currentLocale)),
        }),
      }}
      sx={{
        pl: 1.5,
      }}
    >
      {Object.keys(LOCALES).map(locale => (
        <MenuItem key={locale} value={locale}>
          {t(getLocaleLabel(locale))}
        </MenuItem>
      ))}
    </Select>
  );
};

export default LocalePickerSelect;
