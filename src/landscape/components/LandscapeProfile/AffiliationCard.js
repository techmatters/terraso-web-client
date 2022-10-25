import React, { useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { getTermLabel } from 'taxonomies/taxonomiesUtils';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  Typography,
} from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import Restricted from 'permissions/components/Restricted';

const Partnership = props => {
  const { t } = useTranslation();
  const {
    landscape: { partnership },
  } = props;

  if (!partnership) {
    return null;
  }

  return (
    <CardContent>
      <RouterLink to={`/groups/${partnership.group.slug}`}>
        {partnership.group.name}
      </RouterLink>
      {partnership.year && (
        <Typography sx={{ mt: 1 }}>
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
      <Typography variant="h3" sx={{ p: 0 }}>
        {t('landscape.profile_affiliation_card_affiliated_groups_title')}
      </Typography>
      <List>
        {sorted.map(group => (
          <ListItem
            key={group.slug}
            component={RouterLink}
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
  const organizations = _.getOr([], 'taxonomyTerms.organization', landscape);

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
      <Typography variant="h3" sx={{ p: 0 }}>
        {t('landscape.profile_affiliation_card_organizations_title')}
      </Typography>
      <List>
        {sorted.map(term => (
          <ListItem key={term.key}>{term.label}</ListItem>
        ))}
      </List>
    </CardContent>
  );
};

const AffiliationCard = ({ landscape }) => {
  const { t } = useTranslation();
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
          >
            {t('landscape.profile_affiliation_card_title')}
          </Typography>
        }
      />
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
