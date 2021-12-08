import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
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
import SquareIcon from '@mui/icons-material/Square'

import { fetchLandscapeView } from 'landscape/landscapeSlice'
import GroupMembershipCard from 'group/components/GroupMembershipCard'
import theme from 'theme'

const LandscapeCard = ({ landscape }) => (
  <Card sx={{ minWidth: '400px' }}>
    <CardHeader
      title={landscape.name}
    />
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {landscape.description}
      </Typography>
    </CardContent>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={1}>
        <SquareIcon sx={{ color: 'gray.lite1' }} />
        <Link href={landscape.website} underline="none">
          {landscape.website}
        </Link>
      </Stack>
    </CardContent>
  </Card>
)

const LandscapeView = () => {
  const dispatch = useDispatch()
  const { landscape, fetching } = useSelector(state => state.landscape.view)
  const { id } = useParams()

  useEffect(() => {
    dispatch(fetchLandscapeView(id))
  }, [dispatch, id])

  if (fetching) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  return (
    <Box sx={{ width: '100%', padding: theme.spacing(4) }}>
      <Typography variant="h1" >
        {landscape.name}
      </Typography>
      <Typography
        variant="caption"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2)
        }}
      >
        {landscape.location}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <LandscapeCard landscape={landscape} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupMembershipCard
            ownerName={landscape.name}
            members={landscape.members}
            joinLabel="landscape.view_join_label"
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default LandscapeView
