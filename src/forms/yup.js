import * as yup from 'yup'

// Custom validations
yup.addMethod(yup.string, 'urlCustom', () => yup.string()
  .matches(
    /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
    params => ({ key: 'form.validation_url_invalid', params })
  )
)

// Localization codes form Yup schema validation
// Check: https://github.com/jquense/yup#api to know the format to add more codes here
yup.setLocale({
  mixed: {
    default: params => ({ key: 'form.validation_field_invalid', params }),
    required: params => ({ key: 'form.validation_field_required', params })
  },
  string: {
    email: params => ({ key: 'form.validation_email_invalid', params })
  }
})
