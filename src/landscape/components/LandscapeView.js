import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Button
} from '@mui/material'

import { fetchLandscape } from 'landscape/landscapeSlice'
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
      <Link href={landscape.website} underline="none">
        {landscape.website}
      </Link>
    </CardContent>
  </Card>
)

const LandscapeView = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { data: landscape, fetching } = useSelector(state => state.landscape.landscape)
  const { id } = useParams()

  useEffect(() => {
    dispatch(fetchLandscape(id))
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
    <Box sx={{ width: '100%', padding: theme.spacing(2) }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: theme.spacing(3)
        }}
      >
        <Typography variant="h1">
          {landscape.name}
        </Typography>
        <Button variant="contained">
          {t('landscape.view_update_button')}
        </Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <LandscapeCard landscape={landscape} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default LandscapeView
