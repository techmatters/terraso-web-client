import React, { useEffect } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
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

const validationSchema = yup.object({
  name: yup.string().required(),
  description: yup.string().required(),
  email: yup.string().email(),
  website: yup.string().urlCustom()
}).required()

const fields = [{
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

  useEffect(() => {
    if (group && group.id !== id) {
      // Change URL if new group ID
      navigate(`/group/${group.id}`)
    }
  }, [id, group, navigate])

  const onSave = updatedGroup => dispatch(saveGroup(updatedGroup))

  const title = !isNew
    ? t('group.form_edit_title', { name: _.get(group, 'name', '') })
    : t('group.form_new_title')

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      {!fetching ? null : (
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
        fields={fields}
        values={group}
        error={error}
        validationSchema={validationSchema}
        onSave={onSave}
        saveLabel='group.form_save_label'
      />
    </Box>
  )
}

export default GroupForm
