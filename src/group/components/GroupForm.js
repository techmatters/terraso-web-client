import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  FormGroup,
  Alert,
  Button,
  Stack,
  Backdrop,
  CircularProgress
} from '@mui/material'

import theme from 'theme'
import { fetchGroup, saveGroup } from 'group/groupSlice'
import FormField from 'common/components/FormField'

const GroupForm = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { id } = useParams()
  const { error, fetching, group } = useSelector(state => state.group.form)
  const [updatedGroup, setUpdatedGroup] = useState({
    name: '',
    description: '',
    email: '',
    website: ''
  })

  const isNew = id === 'new'

  useEffect(() => {
    if (group) {
      setUpdatedGroup(group)
    }
  }, [group])

  useEffect(() => {
    if (isNew) {
      return
    }
    dispatch(fetchGroup(id))
  }, [dispatch, id, isNew])

  if (fetching || updatedGroup == null) {
    return (
      <Backdrop
        sx={{ color: theme.palette.white, zIndex: theme => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  const onSave = () => dispatch(saveGroup(updatedGroup))

  const onFieldChange = (field, value) => {
    setUpdatedGroup({
      ...updatedGroup,
      [field]: value
    })
  }

  const title = !isNew
    ? t('group.form_edit_title', { name: group.name })
    : t('group.form_new_title')

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      <Typography variant="h1" sx={{ marginBottom: theme.spacing(5) }}>{title}</Typography>
      <FormGroup sx={{ width: '100%' }}>
        <FormField
          id='group-name'
          label={t('group.form_name_label')}
          value={updatedGroup.name}
          onChange={event => onFieldChange('name', event.target.value)}
        />
        <FormField
          id='group-description'
          label={t('group.form_description_label')}
          value={updatedGroup.description}
          onChange={event => onFieldChange('description', event.target.value)}
          inputProps={{
            placeholder: t('group.form_description_placeholder'),
            multiline: true,
            rows: 4
          }}
        />
        <FormField
          id='group-email'
          label={t('group.form_email_label')}
          value={updatedGroup.email}
          onChange={event => onFieldChange('email', event.target.value)}
          info={t('group.form_email_info')}
          inputProps={{
            type: 'email',
            placeholder: t('group.form_email_placeholder')
          }}
        />
        <FormField
          id='group-website'
          label={t('group.form_website_label')}
          value={updatedGroup.website}
          onChange={event => onFieldChange('website', event.target.value)}
          inputProps={{
            type: 'url',
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
          <Button
            variant="contained"
            onClick={onSave}
          >
            {t('group.form_save_button')}
          </Button>
          <Button variant="text">{t('group.form_cancel_button')}</Button>
        </Stack>
      </FormGroup>
    </Box>
  )
}

export default GroupForm
