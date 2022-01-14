import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  CircularProgress
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

import { joinGroup, leaveGroup } from 'group/groupSlice'
import ConfirmationDialog from 'common/components/ConfirmationDialog'
import { t } from 'i18next'

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
      loading={props.loading}
    >
      {t(props.joinLabel)}
    </BaseButton>
  )
}

const GroupMembershipButton = props => {
  const dispatch = useDispatch()
  const { joinLabel, leaveLabel, messageLabel, ownerName, groupSlug } = props
  const { data: { email: userEmail } } = useSelector(state => state.account.currentUser)
  const { fetching, group, joining } = useSelector(state => _.get(state, `group.memberships.${groupSlug}`, {}))
  const [openConfirmation, setOpenConfirmation] = useState(false)

  const loading = fetching || joining

  // TODO This should just be 5 users and we should get the total count from
  // the backend when the support is added
  const members = _.get(group, 'members', [])

  // TODO This should come from the backend when we have the authenticated user
  const userMembership = members.find(member => member.email === userEmail)

  useEffect(() => {
    setOpenConfirmation(false)
  }, [userMembership])

  const onJoin = () => {
    dispatch(joinGroup({
      groupSlug,
      userEmail,
      ownerName
    }))
  }
  const onLeaveConfirmation = () => {
    setOpenConfirmation(true)
  }

  const onLeave = () => {
    dispatch(leaveGroup({
      groupSlug,
      membershipId: userMembership.membershipId,
      ownerName
    }))
  }

  if (userMembership) {
    return (
      <React.Fragment>
        <ConfirmationDialog
          open={openConfirmation}
          title={t('group.membership_leave_confirm_title', { name: ownerName })}
          message={t(messageLabel, { name: ownerName })}
          confirmButtonLabel={t('group.membership_leave_confirm_button')}
          onCancel={() => setOpenConfirmation(false)}
          onConfirm={onLeave}
          loading={loading}
        />
        <LeaveButton
          leaveLabel={leaveLabel}
          onLeave={onLeaveConfirmation}
          loading={loading}
        />
      </React.Fragment>
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
