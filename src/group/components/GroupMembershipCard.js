import React, { useEffect } from 'react'
import _ from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useSnackbar } from 'notistack'
import {
  Typography,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  AvatarGroup,
  CircularProgress,
  Box
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

import { fetchGroupMembership, joinGroup } from 'group/groupSlice'
import theme from 'theme'

const Actions = props => {
  const { t } = useTranslation()
  const { fetching, joining, onJoin, joinLabel, isMember } = props

  if (isMember || fetching) {
    return null
  }

  return (
    <CardActions>
      <LoadingButton
        variant="outlined"
        loading={joining}
        loadingIndicator={(
          <CircularProgress color="inherit" size={16} />
        )}
        onClick={onJoin}
        sx={{ width: '100%' }}
      >
        {t(joinLabel)}
      </LoadingButton>
    </CardActions>
  )
}

const Loader = () => (
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  </CardContent>
)

const Content = props => {
  const { t } = useTranslation()
  const { ownerName, members, fetching } = props

  if (fetching) {
    return (<Loader />)
  }

  return (
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {t(
          'group.membership_card_description',
          { count: members.length, name: ownerName }
        )}
      </Typography>
      <AvatarGroup
        max={5}
        sx={{ flexDirection: 'row', marginTop: theme.spacing(2) }}
      >
        {members.map((member, index) => {
          const name = `${member.firstName} ${member.lastName}`
          return (
            <Avatar key={index} alt={name} src="no-image.jpg" />
          )
        })}
      </AvatarGroup>
    </CardContent>
  )
}

const GroupMembershipCard = props => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { enqueueSnackbar } = useSnackbar()
  const { ownerName, groupSlug, joinLabel } = props
  const { fetching, group, message, joining } = useSelector(state => _.get(state, `group.memberships.${groupSlug}`, {}))
  const { email: userEmail } = useSelector(state => state.user.user)

  // TODO This should just be 5 users and we should get the total count from
  // the backend when the support is added
  const members = _.get(group, 'members', [])

  // TODO This should come from the backend when we have the authenticated user
  const isMember = members.find(member => member.email === userEmail)

  useEffect(() => {
    dispatch(fetchGroupMembership(groupSlug))
  }, [groupSlug, dispatch])

  useEffect(() => {
    if (message) {
      enqueueSnackbar({
        ...message,
        params: {
          name: ownerName
        }
      })
    }
  }, [message, enqueueSnackbar])

  const onJoin = () => {
    dispatch(joinGroup({
      groupSlug: group.slug,
      userEmail
    }))
  }
  return (
    <Card>
      <CardHeader
        title={t('group.membership_card_title')}
      />
      <Content
        fetching={fetching}
        ownerName={ownerName}
        members={members}
      />
      <Actions
        fetching={fetching}
        isMember={isMember}
        joining={joining}
        joinLabel={joinLabel}
        onJoin={onJoin}
      />
    </Card>
  )
}

export default GroupMembershipCard
