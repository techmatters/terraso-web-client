import React from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Typography,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  AvatarGroup,
  CircularProgress,
  Box
} from '@mui/material'

import GroupMembershipButton from './GroupMembershipButton'
import AccountAvatar from 'account/components/AccountAvatar'
import theme from 'theme'

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
          return (
            <AccountAvatar key={index} user={member}/>
          )
        })}
      </AvatarGroup>
    </CardContent>
  )
}

const GroupMembershipCard = props => {
  const { t } = useTranslation()
  const { ownerName, groupSlug, joinLabel, leaveLabel, messageLabel } = props
  const { fetching, group } = useSelector(state => _.get(state, `group.memberships.${groupSlug}`, {}))

  // TODO This should just be 5 users and we should get the total count from
  // the backend when the support is added
  const members = _.get(group, 'members', [])

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
      { fetching ? null : (
        <CardActions>
          <GroupMembershipButton
            ownerName={ownerName}
            groupSlug={groupSlug}
            joinLabel={joinLabel}
            leaveLabel={leaveLabel}
            messageLabel={messageLabel}
          />
        </CardActions>
      )}
    </Card>
  )
}

export default GroupMembershipCard
