import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Backdrop,
  CircularProgress,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'

import { fetchLandscapes } from 'landscape/landscapeSlice'
import theme from 'theme'

const LandscapeList = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { fetching, message } = useSelector(state => state.landscape.list)
  const { enqueueSnackbar } = useSnackbar()

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
        variant="body1"
        display="block"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2)
        }}
      >
        {t('landscape.list_description')}
      </Typography>
      <TableContainer>
        <Table aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>{t('landscape.list_column_name')}</TableCell>
              <TableCell>{t('landscape.list_column_location')}</TableCell>
              <TableCell>{t('landscape.list_column_contact')}</TableCell>
              <TableCell>{t('landscape.list_column_members')}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover tabIndex={-1}>
              <TableCell>
                Hola
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default LandscapeList
