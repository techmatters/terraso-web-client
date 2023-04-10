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
import { IconButton } from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import { useAnalytics } from 'monitoring/analytics';

import LinkIcon from './LinkIcon';
import SharedDataEntryBase, { ICON_SIZE } from './SharedDataEntryBase';

const DownloadComponent = props => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { dataEntry, group } = props;

  return (
    <ExternalLink
      component={IconButton}
      href={dataEntry.url}
      linkProps={{
        trackingProps: { group: group.slug },
      }}
      onClick={() =>
        trackEvent('dataEntry.link.clicked', { props: { group: group.slug } })
      }
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

const SharedDataEntryLink = props => {
  const { t } = useTranslation();
  const { dataEntry } = props;

  const domain = useMemo(() => {
    const url = new URL(dataEntry.url);
    return url.hostname;
  }, [dataEntry.url]);

  const toolTipKey =
    dataEntry.entryType === 'LINK'
      ? 'sharedData.link_delete_tooltip'
      : 'sharedData.file_delete_tooltip';

  return (
    <SharedDataEntryBase
      dataEntry={dataEntry}
      EntryTypeIcon={() => <LinkIcon />}
      DownloadComponent={DownloadComponent}
      info={domain}
      deleteTooltip={t(toolTipKey, {
        name: dataEntry.name,
      })}
    />
  );
};

export default SharedDataEntryLink;
