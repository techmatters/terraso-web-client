import React, { useEffect } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tab, Tabs } from '@mui/material'

import theme from 'theme'

const PAGES = {
  '/': {
    label: 'navigation.home',
    match: path => path === '/'
  },
  '/landscapes': {
    label: 'navigation.landscapes',
    match: path => path.startsWith('/landscapes')
  },
  '/groups': {
    label: 'navigation.groups',
    match: path => path.startsWith('/groups')
  }
}

const LinkTab = props => (
  <Tab
    onClick={event => {
      props.onClick()
      event.preventDefault()
    }}
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
  const [value, setValue] = React.useState(false)

  useEffect(() => {
    const currentValue = _.findIndex(
      Object.values(PAGES),
      path => path.match(location.pathname)
    )
    setValue(currentValue > -1 ? currentValue : false)
  }, [location])

  const handleChange = (value, path) => {
    navigate(path)
    setValue(value)
  }

  return (
    <Tabs
      component="nav"
      value={value}
      aria-label={t('navigation.nav_label')}
      sx={{
        '& .MuiTabs-indicator': {
          backgroundColor: 'black'
        }
      }}
    >
      {Object.keys(PAGES).map((path, index) => (
        <LinkTab
          key={path}
          label={t(PAGES[path].label).toUpperCase()}
          onClick={() => handleChange(index, path)}
        />
      ))}
    </Tabs>
  )
}

export default Navigation
