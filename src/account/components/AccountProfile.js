import React from 'react'
import * as yup from 'yup'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Avatar,
  InputLabel,
  Stack,
  Typography
} from '@mui/material'

import { setUser } from 'account/accountSlice'
import Form from 'forms/components/Form'
import theme from 'theme'

const VALIDATION_SCHEMA = yup.object({
  fullname: yup.string().required()
}).required()

const FIELDS = [{
  name: 'fullname',
  label: 'account.form_name_label'
},
{
  name: 'email',
  label: 'account.form_email_label',
  props: { disabled: true }
}]

const AccountProfile = ({ tool }) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: user } = useSelector(state => state.account.currentUser)

  const onSave = updatedProfile => {
    const [firstName, lastName] = updatedProfile.fullname.split(' ', 2)
    dispatch(setUser({ firstName, lastName, email: user.email }))
    navigate('/')
  }

  const profile = { fullname: `${user.firstName} ${user.lastName}`, email: user.email }

  return (
    <Stack sx={{ maxWidth: 'sm', paddingTop: theme.spacing(3) }}>
      <Typography variant="h1" >
        {t('account.welcome')}, {user.firstName} {user.lastName}
      </Typography>

      <p>{t('account.name_and_profile')}</p>

      <Form
        prefix='profile'
        fields={FIELDS}
        values={profile}
        validationSchema={VALIDATION_SCHEMA}
        onSave={onSave}
        saveLabel='account.form_save_label'>

        <InputLabel>
          {t('account.profile_picture')}
        </InputLabel>
        <Avatar sx={{ width: 80, height: 80, fontSize: '3em' }}>
          {user.firstName.substr(0, 1).toUpperCase()}
        </Avatar>

      </Form>
    </Stack>
  )
}

export default AccountProfile
