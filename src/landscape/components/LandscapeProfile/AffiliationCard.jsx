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

import { useEffect, useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Link,
  List,
  ListItem,
  Typography,
} from '@mui/material';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import Restricted from 'terraso-web-client/permissions/components/Restricted';
import { PARTNERSHIP_STATUS_NO } from 'terraso-web-client/landscape/landscapeConstants';
import { TYPE_ORGANIZATION } from 'terraso-web-client/taxonomies/taxonomiesConstants';
import { getTermLabel } from 'terraso-web-client/taxonomies/taxonomiesUtils';

import theme from 'terraso-web-client/theme';

export const Partnership = props => {
  const { t } = useTranslation();
  const {
    landscape: { partnership, partnershipStatus },
  } = props;

  if (!partnership || partnershipStatus === PARTNERSHIP_STATUS_NO) {
    return null;
  }

  return (
    <CardContent>
      <Typography variant="h3" sx={{ p: 0, pb: 1, fontWeight: 600 }}>
        {t('landscape.profile_affiliation_card_partnership_title')}
      </Typography>
      <Typography>
        <Link href={`/groups/${partnership.group.slug}`}>
          {partnership.group.name}
        </Link>
      </Typography>
      {partnership.year && (
        <Typography sx={{ mt: 0 }}>
          {t('landscape.profile_affiliation_card_partnership_description', {
            year: partnership.year,
          })}
        </Typography>
      )}
    </CardContent>
  );
};

const AffiliatedGroups = props => {
  const { t } = useTranslation();
  const {
    landscape: { affiliatedGroups = [] },
  } = props;

  const sorted = useMemo(
    () => _.sortBy(_.get('name'), affiliatedGroups),
    [affiliatedGroups]
  );

  if (_.isEmpty(sorted)) {
    return null;
  }

  return (
    <CardContent>
      <Typography variant="h3" sx={{ p: 0, fontWeight: 600 }}>
        {t('landscape.profile_affiliation_card_affiliated_groups_title')}
      </Typography>
      <List>
        {sorted.map(group => (
          <ListItem
            key={group.slug}
            component={RouterLink}
            sx={{
              pl: 0,
              pt: 0,
              color: theme.palette.link,
              '&:hover': { textDecoration: 'underline' },
            }}
            to={`/groups/${group.slug}`}
          >
            {group.name}
          </ListItem>
        ))}
      </List>
    </CardContent>
  );
};

const Organizations = props => {
  const { t, i18n } = useTranslation();
  const { landscape } = props;
  const organizations = _.getOr(
    [],
    `taxonomyTerms.${TYPE_ORGANIZATION}`,
    landscape
  );

  const sorted = useMemo(
    () =>
      _.flow(
        _.map(term => ({
          key: term.valueOriginal,
          label: getTermLabel(term, i18n.resolvedLanguage),
        })),
        _.sortBy(_.get('label'))
      )(organizations),

    [organizations, i18n.resolvedLanguage]
  );

  if (_.isEmpty(sorted)) {
    return null;
  }

  return (
    <CardContent>
      <Typography variant="h3" sx={{ p: 0, fontWeight: 600 }}>
        {t('landscape.profile_affiliation_card_organizations_title')}
      </Typography>
      <List>
        {sorted.map(term => (
          <ListItem sx={{ pl: 0, pt: 0 }} key={term.key}>
            {term.label}
          </ListItem>
        ))}
      </List>
    </CardContent>
  );
};

const AffiliationCard = ({ landscape, setIsEmpty }) => {
  const { t } = useTranslation();

  const isEmpty = useMemo(
    () =>
      _.isEmpty(_.get('taxonomyTerms.organization', landscape)) &&
      _.isEmpty(landscape.affiliatedGroups) &&
      (!landscape.partnership ||
        landscape.partnershipStatus === PARTNERSHIP_STATUS_NO),
    [landscape]
  );
  useEffect(() => {
    setIsEmpty('affiliation', isEmpty);
  }, [setIsEmpty, isEmpty]);
  return (
    <Card
      component="section"
      aria-labelledby="landscape-profile-affiliation-card-title"
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
            id="landscape-profile-affiliation-card-title"
            sx={{ pt: 0 }}
          >
            {t('landscape.profile_affiliation_card_title')}
          </Typography>
        }
      />
      {isEmpty && (
        <CardContent>
          <Typography>
            {t('landscape.profile_affiliation_card_empty')}
          </Typography>
        </CardContent>
      )}
      <Partnership landscape={landscape} />

      <AffiliatedGroups landscape={landscape} />

      <Organizations landscape={landscape} />
      <CardContent>
        <Restricted permission="landscape.change" resource={landscape}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/landscapes/${landscape.slug}/affiliation/edit`}
          >
            {t('landscape.profile_affiliation_card_update_button')}
          </Button>
        </Restricted>
      </CardContent>
    </Card>
  );
};

export default AffiliationCard;
