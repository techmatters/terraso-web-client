import React, { useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';

import Restricted from 'permissions/components/Restricted';

const FIELDS = [
  'objectives',
  'problemSitutation',
  'interventionStrategy',
  'otherInformation',
];

const ValueSection = props => {
  const { t } = useTranslation();
  const { field, value } = props;

  if (_.isEmpty(value)) {
    return null;
  }

  return (
    <CardContent>
      <Typography variant="h3">
        {t(`landscape.development_card_${field}_title`)}
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
            {t('landscape.development_card_update_title', {
              name: landscape.name,
            })}
          </Typography>
        }
      />
      {_.isEmpty(values) ? (
        <CardContent>{t('landscape.development_card_empty')}</CardContent>
      ) : null}
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
            {t('landscape.development_update_button')}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

export default DevelopmentStrategyCard;
