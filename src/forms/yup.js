import _ from 'lodash/fp';
import * as yup from 'yup';

const ARRAY_INDEX_REGEX = /\[([^)]+)\]/;

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

// Custom validation for URLs
// From: https://stackoverflow.com/a/15855457/2073774
const validateUrl = value => {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
    value
  );
};
yup.addMethod(yup.string, 'url', function () {
  return this.test(
    'url',
    params => ({ key: 'form.validation_url_invalid', params }),
    validateUrl
  );
});
