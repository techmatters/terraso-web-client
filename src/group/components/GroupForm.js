import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  Typography,
  FormGroup,
  Alert,
  Button,
  Stack
} from '@mui/material'

import theme from 'theme'
import FormField from 'common/components/FormField'

const GroupForm = props => {
  const { t } = useTranslation()
  const { id } = props
  const { group, error } = useSelector(state => state.group.form)

  const title = id && id !== 'new'
    ? t('group.form_edit_title', { name: group.name })
    : t('group.form_new_title')

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      <Typography variant="h1" sx={{ marginBottom: theme.spacing(5) }}>{title}</Typography>
      <FormGroup sx={{ width: '100%' }}>
        <FormField
          id='group-name'
          label={t('group.form_name_label')}
        />
        <FormField
          id='group-description'
          label={t('group.form_description_label')}
          inputProps={{
            placeholder: t('group.form_description_placeholder'),
            multiline: true,
            rows: 4
          }}
        />
        <FormField
          id='group-email'
          label={t('group.form_email_label')}
          info={t('group.form_email_info')}
          inputProps={{
            type: 'email',
            placeholder: t('group.form_email_placeholder')
          }}
        />
        <FormField
          id='group-website'
          label={t('group.form_website_label')}
          inputProps={{
            placeholder: t('group.form_website_placeholder')
          }}
        />
        {!error
          ? null
          : (<Alert severity="error">{error}</Alert>)
        }
        <Stack
          spacing={2}
          direction="row"
          justifyContent='flex-end'
          sx={{ marginTop: theme.spacing(2) }}
        >
          <Button variant="contained">{t('group.form_save_button')}</Button>
          <Button variant="text">{t('group.form_cancel_button')}</Button>
        </Stack>
      </FormGroup>
    </Box>
  )
}

export default GroupForm
