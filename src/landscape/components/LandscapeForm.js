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
import { fetchLandscape, saveLandscape, setFormNewValues } from 'landscape/landscapeSlice'
import Form from 'forms/components/Form'

const VALIDATION_SCHEMA = yup.object({
  name: yup.string().required(),
  description: yup.string()
    .maxCustom(600)
    .required(),
  email: yup.string().email(),
  website: yup.string().urlCustom()
}).required()

const FIELDS = [{
  name: 'name',
  label: 'landscape.form_name_label'
}, {
  name: 'description',
  label: 'landscape.form_description_label',
  placeholder: 'landscape.form_description_placeholder',
  props: {
    inputProps: {
      multiline: true,
      rows: 4
    }
  }
}, {
  name: 'email',
  label: 'landscape.form_email_label',
  info: 'landscape.form_email_info',
  placeholder: 'landscape.form_email_placeholder',
  type: 'email'
}, {
  name: 'website',
  label: 'landscape.form_website_label',
  info: 'landscape.form_website_info',
  placeholder: 'landscape.form_website_placeholder',
  type: 'url'
}]

const LandscapeForm = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const { id } = useParams()
  const { fetching, landscape, message } = useSelector(state => state.landscape.form)

  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues())
      return
    }
    dispatch(fetchLandscape(id))
  }, [dispatch, id, isNew])

  useEffect(() => {
    if (landscape && landscape.id !== id) {
      // Change URL if new landscape ID
      navigate(`/landscape/${landscape.id}`)
    }
  }, [id, landscape, navigate])

  useEffect(() => {
    if (message) {
      enqueueSnackbar(message)
    }
  }, [message, enqueueSnackbar])

  const onSave = updatedLandscape => dispatch(saveLandscape(updatedLandscape))

  const title = !isNew
    ? t('landscape.form_edit_title', { name: _.get(landscape, 'name', '') })
    : t('landscape.form_new_title')

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
        prefix='landscape'
        fields={FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel='landscape.form_save_label'
      />
    </Box>
  )
}

export default LandscapeForm
