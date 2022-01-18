import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography
} from '@mui/material'

import theme from 'theme'
import Tool from 'tool/components/Tool'

const ToolList = ({ tools }) => {
  const { t } = useTranslation()

  const toolList = ['kobo']

  return (
    <React.Fragment>
      <Box sx={{
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2)
      }}>
        <Typography variant="h1" >
          {t('tool.list_title')}
        </Typography>
        <Typography
          variant="body2"
          display="block"
          sx={{
            marginBottom: theme.spacing(3),
            marginTop: theme.spacing(2)
          }}
        >
        </Typography>
        {toolList.map((tool, index) => (
          <Tool key={index} tool={tool} />
        ))}
      </Box>
    </React.Fragment>
  )
}

export default ToolList
