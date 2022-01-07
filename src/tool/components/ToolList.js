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

  const toolsData = [
    {
      title: 'KoBo toolbox',
      url: 'https://www.kobotoolbox.org/',
      img: {
        height: 222,
        width: 377,
        src: 'kobo.png'
      },
      description: [
        'Design and build forms quickly',
        'Collect data offline and online',
        'Analyze and manage data'
      ],
      requirements: [
        'Modern web browser (Chrome, Edge, Firefox, Safari)'
      ]
    }
  ]

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
          {t('tool.list_description')}
        </Typography>
        {toolsData.map(tool => (
          <Tool key="{tool}" tool={tool} />
        ))}
      </Box>
    </React.Fragment>
  )
}

export default ToolList
