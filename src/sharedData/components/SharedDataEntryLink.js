import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IconButton } from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';

import LinkIcon from './LinkIcon';
import SharedDataEntryBase, { ICON_SIZE } from './SharedDataEntryBase';

const DownloadComponent = props => {
  const { t } = useTranslation();
  const { dataEntry } = props;

  return (
    <ExternalLink
      component={IconButton}
      href={dataEntry.url}
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
  const { dataEntry } = props;

  const domain = useMemo(() => {
    const url = new URL(dataEntry.url);
    return url.hostname;
  }, [dataEntry.url]);

  return (
    <SharedDataEntryBase
      dataEntry={dataEntry}
      EntryTypeIcon={() => <LinkIcon />}
      DownloadComponent={DownloadComponent}
      info={domain}
    />
  );
};

export default SharedDataEntryLink;
