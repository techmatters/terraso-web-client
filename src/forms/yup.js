import * as yup from 'yup'

yup.addMethod(yup.string, 'maxCustom', max => yup.string()
  .max(max, params => ({ key: 'form.validation_field_max_length', params }))
)

// Localization codes form Yup schema validation
// Check: https://github.com/jquense/yup#api to know the format to add more codes here
yup.setLocale({
  mixed: {
    default: params => ({ key: 'form.validation_field_invalid', params }),
    required: params => ({ key: 'form.validation_field_required', params })
  },
  string: {
    email: params => ({ key: 'form.validation_email_invalid', params }),
    url: params => ({ key: 'form.validation_url_invalid', params })
  }
})
