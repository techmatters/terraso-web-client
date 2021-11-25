import React, { useEffect } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Backdrop,
  CircularProgress
} from '@mui/material'

import theme from 'theme'
import { fetchGroup, saveGroup, setFormNewValues } from 'group/groupSlice'
import Form from 'common/components/Form'

const GroupForm = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { id } = useParams()
  const { error, fetching, group } = useSelector(state => state.group.form)

  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues())
      return
    }
    dispatch(fetchGroup(id))
  }, [dispatch, id, isNew])

  const onSave = updatedGroup => dispatch(saveGroup(updatedGroup))

  const title = !isNew
    ? t('group.form_edit_title', { name: _.get(group, 'name', '') })
    : t('group.form_new_title')

  const fields = [{
    name: 'name',
    label: t('group.form_name_label')
  }, {
    name: 'description',
    label: t('group.form_description_label'),
    placeholder: t('group.form_description_placeholder'),
    props: {
      inputProps: {
        multiline: true,
        rows: 4
      }
    }
  }, {
    name: 'email',
    label: t('group.form_email_label'),
    info: t('group.form_email_info'),
    placeholder: t('group.form_email_placeholder'),
    type: 'email'
  }, {
    name: 'website',
    label: t('group.form_website_label'),
    placeholder: t('group.form_website_placeholder'),
    type: 'url'
  }]

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      {!fetching
        ? null
        : (<Backdrop
        sx={{ color: theme.palette.white, zIndex: theme => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>)
      }
      <Typography variant="h1" sx={{ marginBottom: theme.spacing(5) }}>{title}</Typography>
      <Form
        prefix='group'
        fields={fields}
        values={group}
        error={error}
        onSave={onSave}
      />
    </Box>
  )
}

export default GroupForm
