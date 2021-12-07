import React from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Tabs, Tab } from '@mui/material'

import theme from 'theme'

const PAGES = {
  '/': 'navigation.home',
  '/landscapes': 'navigation.landscapes',
  '/groups': 'navigation.groups'
}

const LinkTab = props => (
  <Tab
    component="a"
    onClick={event => event.preventDefault()}
    sx={{
      '&.Mui-selected': {
        color: 'black',
        fontWeight: theme.typography.fontWeightMedium
      }
    }}
    {...props}
  />
)

const Navigation = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const initialValue = _.findIndex(Object.keys(PAGES), path => path === location.pathname)
  const [value, setValue] = React.useState(initialValue)

  const handleChange = (event, newValue) => {
    const path = Object.keys(PAGES)[newValue]
    navigate(path)
    setValue(newValue)
  }

  return (
    <Box sx={{
      width: '100%'
    }}>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label={t('navigation.nav_label')}
        TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
        sx={{
          '& .MuiTabs-indicator': {
            display: 'flex'
          },
          '& .MuiTabs-indicatorSpan': {
            width: '100%',
            backgroundColor: 'black'
          }
        }}
      >
        {Object.keys(PAGES).map(path => (
          <LinkTab key={path} label={t(PAGES[path]).toUpperCase()} path={path} />
        ))}
      </Tabs>
    </Box>
  )
}

export default Navigation
