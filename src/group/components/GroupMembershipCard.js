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

const GroupMembershipCard = ({ ownerName, members, joinLabel }) => {
  const { t } = useTranslation()
  const descriptionKey = members.length === 1
    ? 'group.membership_card_description_singular'
    : 'group.membership_card_description_plural'
  return (
    <Card>
      <CardHeader
        title={t('group.membership_card_title')}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {t(
            descriptionKey,
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
        >
          {t(joinLabel)}
        </Button>
      </CardActions>
    </Card>
  )
}

export default GroupMembershipCard
