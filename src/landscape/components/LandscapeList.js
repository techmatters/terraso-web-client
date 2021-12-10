import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Backdrop,
  CircularProgress,
  Button,
  Link
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import { fetchLandscapes } from 'landscape/landscapeSlice'
import theme from 'theme'

const PAGE_SIZE = 10

const LandscapeList = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { landscapes, fetching, message } = useSelector(state => state.landscape.list)
  const { enqueueSnackbar } = useSnackbar()

  const columns = [{
    field: 'name',
    headerName: t('landscape.list_column_name'),
    flex: 1.5,
    minWidth: 200,
    renderCell: ({ row: landscape }) =>
      <Link component={RouterLink} to={`/landscapes/${landscape.slug}`}>
        {landscape.name}
      </Link>
  }, {
    field: 'location',
    headerName: t('landscape.list_column_location'),
    flex: 1.5,
    minWidth: 200
  }, {
    field: 'website',
    headerName: t('landscape.list_column_contact'),
    sortable: false,
    flex: 1.5,
    minWidth: 200,
    renderCell: ({ row: landscape }) =>
      <Link href={landscape.website} underline="none">
        {landscape.website}
      </Link>
  }, {
    field: 'members',
    headerName: t('landscape.list_column_members'),
    align: 'center',
    valueGetter: () => 12
  }, {
    field: 'actions',
    headerName: t('landscape.list_column_actions'),
    sortable: false,
    renderCell: () => (
      <Button variant="outlined">
        {t('landscape.list_join_button')}
      </Button>
    )
  }]

  useEffect(() => {
    dispatch(fetchLandscapes())
  }, [dispatch])

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
        {t('landscape.list_title')}
      </Typography>
      <Typography
        variant="body2"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2)
        }}
      >
        {t('landscape.list_description')}
      </Typography>
      <DataGrid
        rows={landscapes}
        columns={columns}
        pageSize={PAGE_SIZE}
        autoHeight
        sx={{
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'gray.lite2'
          }
        }}
      />
    </Box>
  )
}

export default LandscapeList
