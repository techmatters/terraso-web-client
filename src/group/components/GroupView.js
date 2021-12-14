import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import {
  Box,
  Typography,
  Grid,
  Backdrop,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Link,
  Stack
} from '@mui/material'
import PublicIcon from '@mui/icons-material/Public'

import { fetchGroupView } from 'group/groupSlice'
import GroupMembershipCard from 'group/components/GroupMembershipCard'
import theme from 'theme'

const GroupCard = ({ group }) => (
  <Card>
    <CardHeader title={group.name}/>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {group.description}
      </Typography>
    </CardContent>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={1}>
        <PublicIcon sx={{ color: 'gray.lite1' }} />
        <Link href={group.website} underline="none">
          {group.website}
        </Link>
      </Stack>
    </CardContent>
  </Card>
)

const GroupMap = ({ position }) => {
  const bounds = position && [
    [position.boundingbox[0], position.boundingbox[2]],
    [position.boundingbox[1], position.boundingbox[3]]
  ]
  return (
    <Map
      bounds={bounds}
      style={{
        width: '100%',
        height: '400px'
      }}
    />
  )
}

const GroupView = () => {
  const dispatch = useDispatch()
  const { group, fetching, message } = useSelector(state => state.group.view)
  const { slug } = useParams()
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    dispatch(fetchGroupView(slug))
  }, [dispatch, slug])

  useEffect(() => {
    if (message) {
      enqueueSnackbar(message)
    }
  }, [message, enqueueSnackbar])

  if (fetching) {
    return (
      <Backdrop
        sx={{ color: 'white', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  if (message && message.severity === 'error') {
    return null
  }

  return (
    <Box sx={{
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(2)
    }}>
      <Typography variant="h1" >
        {group.name}
      </Typography>
      <Typography
        variant="caption"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2)
        }}
      >
        {group.location}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <GroupMap position={group.position} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupCard group={group} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupMembershipCard
            ownerName={group.name}
            groupSlug={group.defaultGroup.slug}
            joinLabel="group.view_join_label"
            leaveLabel="group.view_leave_label"
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default GroupView
