import React from 'react'
import {
  Box,
  Card,
  CardActions,
  Typography,
  Button,
  Alert
} from '@mui/material'
import { FormattedMessage } from 'react-intl'

import theme from 'theme'


const Actions = () => {
  return (
    <CardActions sx={{ padding: 0 }}>
      <Button
        variant="outlined"
        component="div"
        sx={{ width:'100%', color: 'grey.700', borderColor: 'grey.700' }}
      >
        <FormattedMessage id="group.placeholder.connect_button" />
      </Button>
    </CardActions>
  )
}

const GroupPlaceholderCard = () => (
  <Card
    variant="outlined"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2)
    }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" component="div">
        <FormattedMessage id="group.placeholder.title" />
      </Typography>
      <Alert
        severity="info"
        sx={{
          marginTop: theme.spacing(1),
          marginBottom: theme.spacing(1)
        }}
      >
        <Typography variant="body1" component="div">
          <FormattedMessage id="group.placeholder.content" />
        </Typography>
      </Alert>
    </Box>
    <Actions />
  </Card>
)

export default GroupPlaceholderCard
