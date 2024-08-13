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

import _ from 'lodash/fp';
import * as yup from 'yup';

const ARRAY_INDEX_REGEX = /\[([^)]+)\]/;

const hasValidTLD = urlString => {
  try {
    if (!urlString) {
      return true;
    }
    const TLD_REGEX = /\.[a-z]{2,}$/i;
    const url = new URL(urlString);
    const match = url.hostname.match(TLD_REGEX);
    return Boolean(match);
  } catch (e) {
    return false;
  }
};

yup.addMethod(yup.string, 'validTld', function () {
  return this.test(
    'validTld',
    params => ({ key: 'form.validation_url_invalid', params }),
    value => hasValidTLD(value)
  );
});

yup.addMethod(yup.string, 'selected', function () {
  return this.required(params => ({
    key: 'form.validation_select_field_required',
    params,
  }));
});

// Localization codes form Yup schema validation
// Check: https://github.com/jquense/yup#api to know the format to add more codes here
yup.setLocale({
  mixed: {
    default: params => ({ key: 'form.validation_field_invalid', params }),
    required: params => ({ key: 'form.validation_field_required', params }),
    notType: params => ({ key: 'form.validation_field_noType', params }),
  },
  string: {
    email: params => ({ key: 'form.validation_email_invalid', params }),
    url: params => ({ key: 'form.validation_url_invalid', params }),
    max: params => ({ key: 'form.validation_field_max_length', params }),
  },
  array: {
    min: params => ({ key: 'form.validation_array_min', params }),
  },
  number: {
    default: params => ({ key: 'form.validation_number_default', params }),
    required: params => ({ key: 'form.validation_number_required', params }),
    integer: params => ({ key: 'form.validation_number_integer', params }),
    max: params => ({ key: 'form.validation_number_max', params }),
  },
});

export const parseError = (error, localizationPrefix) => {
  const type = _.get('type', error);
  const path = _.get('message.params.path', error);
  const basePath = localizationPrefix ? `${localizationPrefix}.${path}` : path;
  const isArray = _.includes('[', path);
  const baseParams = {
    ..._.getOr({}, 'message.params', error),
    isArray,
    type,
    path: basePath,
  };

  const errorKey = _.getOr(
    'form.validation_field_invalid',
    'message.key',
    error
  );

  const localizedKeys = localizationPrefix
    ? [`${localizationPrefix}.${errorKey}`, errorKey]
    : [errorKey];

  if (!isArray) {
    return {
      keys: localizedKeys,
      params: baseParams,
    };
  }

  const keys = localizedKeys.flatMap(key => [`${key}_array`, key]);

  const fixedArrayPath = basePath.replace(ARRAY_INDEX_REGEX, '');

  const params = {
    ...baseParams,
    path: fixedArrayPath,
    arrayIndex: parseInt(ARRAY_INDEX_REGEX.exec(path)[1]) + 1,
  };
  return {
    keys,
    params,
  };
};
