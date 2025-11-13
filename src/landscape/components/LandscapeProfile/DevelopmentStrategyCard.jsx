/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import React, { useEffect, useMemo } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import RouterLink from 'common/components/RouterLink';
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
          <Typography
            variant="h2"
            id="landscape-development-card-title"
            sx={{ pt: 0 }}
          >
            {t('landscape.profile_development_card_title', {
              name: landscape.name,
            })}
          </Typography>
        }
      />
      {_.isEmpty(values) && (
        <CardContent>
          <Typography>
            <Trans i18nKey="landscape.profile_development_card_empty">
              prefix
              <ExternalLink
                href={t('landscape.profile_development_card_empty_url')}
              ></ExternalLink>
              .
            </Trans>
          </Typography>
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
