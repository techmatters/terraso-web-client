import _ from 'lodash/fp';
import * as yup from 'yup';

const ARRAY_INDEX_REGEX = /\[([^)]+)\]/;

yup.addMethod(yup.string, 'maxCustom', max =>
  yup
    .string()
    .max(max, params => ({ key: 'form.validation_field_max_length', params }))
);

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
  },
  array: {
    min: params => ({ key: 'form.validation_array_min', params }),
  },
  number: {
    default: params => ({ key: 'form.validation_number_default', params }),
    required: params => ({ key: 'form.validation_number_required', params }),
    integer: params => ({ key: 'form.validation_number_integer', params }),
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
