import React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import {
  Card,
  Link,
  Stack,
  Typography
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import theme from 'theme'

const Tool = ({ tool }) => {
  const { t } = useTranslation()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <React.Fragment>
      <Card sx={{ padding: theme.spacing(2) }}>
        <Typography variant="h1" >
          {tool.title}
        </Typography>

        <Stack direction={isSmall ? 'column' : 'row'} justifyContent="space-between" spacing={2}>

          <section>
            <Typography variant="h2" >
              {t('tool.is_for')}
            </Typography>

            <ul>
              {
                tool.description.map((description, index) => (
                  <li key={index}>{description}</li>
                ))
              }
            </ul>

            <Typography variant="h2" >
              {t('tool.requirements')}
            </Typography>

            <ul>
              {
                tool.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))
              }
            </ul>
          </section>

          <section>
            <Link href={tool.url}>
              <img alt={tool.title} height={tool.img.height} width={tool.img.src} src={tool.img.src} />
            </Link>

            <p>
              <Link href={tool.url}>
                {t('tool.go_to', { tool: tool.title })}
              </Link>
            </p>
          </section>
        </Stack>
      </Card>

    </React.Fragment>
  )
}

export default Tool
