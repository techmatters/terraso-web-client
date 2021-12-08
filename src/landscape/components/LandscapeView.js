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
import {
  MapContainer,
  TileLayer
} from 'react-leaflet'
import SquareIcon from '@mui/icons-material/Square'

import { fetchLandscapeView } from 'landscape/landscapeSlice'
import GroupMembershipCard from 'group/components/GroupMembershipCard'
import theme from 'theme'

const LandscapeCard = ({ landscape }) => (
  <Card>
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

const LandscapeMap = ({ position }) => {
  const bounds = position && [
    [position.boundingbox[0], position.boundingbox[2]],
    [position.boundingbox[1], position.boundingbox[3]]
  ]
  return (
    <Box>
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{
          width: '100%',
          height: '400px'
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </Box>
  )
}

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
    <Box sx={{
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(2)
    }}>
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
          <LandscapeMap position={landscape.position} />
        </Grid>
        <Grid item xs={12} md={6}>
          <GroupMembershipCard
            ownerName={landscape.name}
            members={landscape.members}
            joinLabel="landscape.view_join_label"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LandscapeCard landscape={landscape} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default LandscapeView
