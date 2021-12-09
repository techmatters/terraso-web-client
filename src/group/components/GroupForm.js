import React, { useEffect } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import * as yup from 'yup'
import {
  Box,
  Typography,
  Backdrop,
  CircularProgress
} from '@mui/material'

import theme from 'theme'
import { fetchGroup, saveGroup, setFormNewValues } from 'group/groupSlice'
import Form from 'forms/components/Form'

const VALIDATION_SCHEMA = yup.object({
  name: yup.string().required(),
  description: yup.string()
    .maxCustom(600)
    .required(),
  email: yup.string().email(),
  website: yup.string().url()
}).required()

const FIELDS = [{
  name: 'name',
  label: 'group.form_name_label'
}, {
  name: 'description',
  label: 'group.form_description_label',
  placeholder: 'group.form_description_placeholder',
  props: {
    inputProps: {
      multiline: true,
      rows: 4
    }
  }
}, {
  name: 'email',
  label: 'group.form_email_label',
  info: 'group.form_email_info',
  placeholder: 'group.form_email_placeholder',
  type: 'email'
}, {
  name: 'website',
  label: 'group.form_website_label',
  placeholder: 'group.form_website_placeholder',
  type: 'url'
}]

const GroupForm = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const { id } = useParams()
  const { fetching, group, message } = useSelector(state => state.group.form)

  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues())
      return
    }
    dispatch(fetchGroup(id))
  }, [dispatch, id, isNew])

  useEffect(() => {
    if (group && group.id !== id) {
      // Change URL if new group ID
      navigate(`/group/${group.id}`)
    }
  }, [id, group, navigate])

  useEffect(() => {
    if (message) {
      enqueueSnackbar(message)
    }
  }, [message, enqueueSnackbar])

  const onSave = updatedGroup => dispatch(saveGroup(updatedGroup))

  const title = !isNew
    ? t('group.form_edit_title', { name: _.get(group, 'name', '') })
    : t('group.form_new_title')

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      {fetching && (
        <Backdrop
          sx={{ color: theme.palette.white, zIndex: theme => theme.zIndex.drawer + 1 }}
          open={true}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      <Typography variant="h1" sx={{ marginBottom: theme.spacing(5) }}>{title}</Typography>
      <Form
        prefix='group'
        fields={FIELDS}
        values={group}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel='group.form_save_label'
      />
    </Box>
  )
}

export default GroupForm
