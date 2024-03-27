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
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Grid, IconButton } from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import ExternalLink from 'common/components/ExternalLink';

import LinkIcon from './LinkIcon';
import SharedDataEntryBase, { ICON_SIZE } from './SharedDataEntryBase';

const DownloadComponent = props => {
  const { t } = useTranslation();
  const { owner, entityType } = useCollaborationContext();
  const { sharedResource } = props;
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );

  return (
    <ExternalLink
      component={IconButton}
      href={dataEntry.url}
      customTrackEvent={{
        name: 'dataEntry.link.click',
        props: {
          [entityType]: owner.slug,
        },
      }}
      aria-label={t('sharedData.download_label', {
        name: dataEntry.name,
      })}
    >
      <OpenInNewIcon
        sx={theme => ({
          marginTop: '2px',
          width: ICON_SIZE,
          height: ICON_SIZE,
          color: theme.palette.gray.dark1,
        })}
      />
    </ExternalLink>
  );
};

// TODO-cknipe: Move this and finsih
const InfoComponent = ({ sharedResource }) => {
  const dataEntry = useMemo(
    () => sharedResource.dataEntry,
    [sharedResource.dataEntry]
  );

  const domain = useMemo(() => {
    const url = new URL(dataEntry.url);
    return url.hostname;
  }, [dataEntry.url]);

  return (
    <Grid
      item
      xs={4}
      md={2}
      order={{ xs: 5, md: 4 }}
      sx={{ wordWrap: 'break-word' }}
    >
      {domain}
    </Grid>
  );
};

const SharedDataEntryLink = props => {
  const { t } = useTranslation();
  const { sharedResource } = props;
  // TODO-cknipe: Think move this up to InfoComponent?
  // const dataEntry = useMemo(
  //   () => sharedResource.dataEntry,
  //   [sharedResource.dataEntry]
  // );

  // const domain = useMemo(() => {
  //   const url = new URL(dataEntry.url);
  //   return url.hostname;
  // }, [dataEntry.url]);

  return (
    <SharedDataEntryBase
      sharedResource={sharedResource}
      EntryTypeIcon={() => (
        <LinkIcon
          alt={t('sharedData.link_label')}
          role="img"
          sx={{
            marginTop: '0.6em',
            marginLeft: '-3px',
            paddingRight: '3px',
          }}
        />
      )}
      InfoComponent={InfoComponent}
      DownloadComponent={DownloadComponent}
    />
  );
};

export default SharedDataEntryLink;
