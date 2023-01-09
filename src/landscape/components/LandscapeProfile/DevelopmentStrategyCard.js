import React, { useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import { Trans } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import Restricted from 'permissions/components/Restricted';

const FIELDS = [
  'objectives',
  'opportunities',
  'problemSitutation',
  'interventionStrategy',
];

const ValueSection = props => {
  const { t } = useTranslation();
  const { field, value } = props;

  if (_.isEmpty(value)) {
    return null;
  }

  return (
    <CardContent>
      <Typography variant="h3" sx={{ fontWeight: 600 }}>
        {t(`landscape.profile_development_card_${field}_title`)}
      </Typography>
      <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </CardContent>
  );
};

const DevelopmentStrategyCard = ({ landscape, setIsEmpty }) => {
  const { t } = useTranslation();

  const values = useMemo(
    () =>
      _.flow(
        _.map(field => [
          field,
          _.get(`developmentStrategy.${field}`, landscape),
        ]),
        _.filter(([field, value]) => !!value),
        _.fromPairs
      )(FIELDS),
    [landscape]
  );

  useEffect(() => {
    setIsEmpty('developmentStrategy', _.isEmpty(values));
  }, [values, setIsEmpty]);

  return (
    <Card
      component="section"
      aria-labelledby="landscape-development-card-title"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        disableTypography
        title={
          <Typography variant="h2" id="landscape-development-card-title">
            {t('landscape.profile_development_card_title', {
              name: landscape.name,
            })}
          </Typography>
        }
      />
      {_.isEmpty(values) && (
        <CardContent>
          <Trans i18nKey="landscape.profile_development_card_empty">
            prefix
            <ExternalLink
              href={t('landscape.profile_development_card_empty_url')}
            ></ExternalLink>
            .
          </Trans>
        </CardContent>
      )}
      {Object.keys(values).map(field => (
        <ValueSection
          key={field}
          landscape={landscape}
          field={field}
          value={values[field]}
        />
      ))}
      <CardContent>
        <Restricted permission="landscape.change" resource={landscape}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/development-strategy/edit`}
          >
            {t(
              _.isEmpty(values)
                ? 'landscape.profile_development_add_button'
                : 'landscape.profile_development_update_button'
            )}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

export default DevelopmentStrategyCard;
