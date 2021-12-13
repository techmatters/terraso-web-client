import React, { useEffect } from 'react'
import _ from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useSnackbar } from 'notistack'
import {
  CircularProgress
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

import { joinGroup } from 'group/groupSlice'

const BaseButton = props => (
  <LoadingButton
    loading={props.loading}
    loadingIndicator={(
      <CircularProgress color="inherit" size={16} />
    )}
    sx={{ width: '100%' }}
    {...props}
  >
      {props.children}
  </LoadingButton>
)

const LeaveButton = props => {
  const { t } = useTranslation()
  return (
    <BaseButton
      onClick={props.onLeave}
      sx={{ bgcolor: 'gray.lite1', color: 'black', width: '100%' }}
    >
      {t(props.leaveLabel).toUpperCase()}
    </BaseButton>
  )
}

const JoinButton = props => {
  const { t } = useTranslation()
  return (
    <BaseButton
      variant="outlined"
      onClick={props.onJoin}
    >
        {t(props.joinLabel)}
    </BaseButton>
  )
}

const GroupMembershipButton = props => {
  const dispatch = useDispatch()
  const { enqueueSnackbar } = useSnackbar()
  const { joinLabel, leaveLabel, ownerName, groupSlug } = props
  const { email: userEmail } = useSelector(state => state.user.user)
  const { fetching, group, message, joining } = useSelector(state => _.get(state, `group.memberships.${groupSlug}`, {}))

  const loading = fetching || joining

  // TODO This should just be 5 users and we should get the total count from
  // the backend when the support is added
  const members = _.get(group, 'members', [])

  // TODO This should come from the backend when we have the authenticated user
  const isMember = members.find(member => member.email === userEmail)

  useEffect(() => {
    if (message) {
      enqueueSnackbar({
        ...message,
        params: {
          name: ownerName
        }
      })
    }
  }, [message, enqueueSnackbar, ownerName])

  const onJoin = () => {
    dispatch(joinGroup({
      groupSlug: group.slug,
      userEmail
    }))
  }
  const onLeave = () => {}

  if (isMember) {
    return (
      <LeaveButton
        leaveLabel={leaveLabel}
        onLeave={onLeave}
        loading={loading}
      />
    )
  }
  return (
    <JoinButton
      joinLabel={joinLabel}
      onJoin={onJoin}
      loading={loading}
    />
  )
}

export default GroupMembershipButton
