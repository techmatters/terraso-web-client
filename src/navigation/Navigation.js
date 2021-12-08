import React from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tab, Tabs } from '@mui/material'

import theme from 'theme'

const PAGES = {
  '/': 'navigation.home',
  '/landscapes': 'navigation.landscapes',
  '/groups': 'navigation.groups'
}

const LinkTab = props => (
  <Tab
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
    <Tabs
      component="nav"
      value={value}
      onChange={handleChange}
      aria-label={t('navigation.nav_label')}
      sx={{
        '& .MuiTabs-indicator': {
          backgroundColor: 'black'
        }
      }}
    >
      {Object.keys(PAGES).map(path => (
        <LinkTab key={path} label={t(PAGES[path]).toUpperCase()} path={path} />
      ))}
    </Tabs>
  )
}

export default Navigation
