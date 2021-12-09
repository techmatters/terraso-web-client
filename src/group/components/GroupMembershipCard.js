import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Typography,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  AvatarGroup,
  Button
} from '@mui/material'

import theme from 'theme'

const GroupMembershipCard = ({ ownerName, members, joinLabel, onJoin }) => {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader
        title={t('group.membership_card_title')}
      />
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
      <CardActions>
        <Button
          variant="outlined"
          sx={{ width: '100%' }}
          onClick={onJoin}
        >
          {t(joinLabel)}
        </Button>
      </CardActions>
    </Card>
  )
}

export default GroupMembershipCard
