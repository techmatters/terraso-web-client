import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  List as BaseList,
  ListItem as BaseListItem,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

import { withProps } from 'react-hoc';

import { formatDate } from 'localization/utils';
import { fetchDataLayers } from 'storyMap/storyMapSlice';

const List = withProps(BaseList, {
  component: withProps(Stack, { component: 'ul', spacing: 1 }),
});
const ListItem = withProps(BaseListItem, {
  component: withProps(Card, {
    component: withProps(Card, { component: 'li' }),
  }),
});

const DataLayerDialog = props => {
  const { open, title, onClose, onConfirm } = props;
  const { i18n, t } = useTranslation();
  const { fetching, list: dataLayers } = useSelector(
    state => state.storyMap.dataLayers
  );
  const [selected, setSelected] = useState('');

  const dataLayersById = useMemo(
    () => (_.isEmpty(dataLayers) ? {} : _.keyBy('id', dataLayers)),
    [dataLayers]
  );

  useFetchData(fetchDataLayers);

  const onConfirmWrapper = useCallback(() => {
    onConfirm(dataLayersById[selected]);
  }, [onConfirm, selected, dataLayersById]);

  return (
    <Dialog open={open}>
      <DialogTitle component="h1" sx={{ pb: 0 }}>
        <IconButton size="small" sx={{ color: 'blue.dark' }} onClick={onClose}>
          <ArrowBackIcon />
        </IconButton>
        {title ? (
          <Trans
            i18nKey="storyMap.form_location_add_data_layer_dialog_title"
            values={{ title: title }}
          >
            <strong>prefix</strong>
            <i>italic</i>
          </Trans>
        ) : (
          <>{t('storyMap.form_location_add_data_layer_dialog_title_blank')}</>
        )}
      </DialogTitle>
      <DialogContent>
        {fetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress aria-label={t('common.loader_label')} />
          </Box>
        ) : (
          <RadioGroup
            value={selected}
            onChange={event => setSelected(event.target.value)}
          >
            <List>
              {dataLayers.map(dataLayer => (
                <ListItem
                  key={dataLayer.id}
                  sx={theme => ({
                    display: 'grid',
                    justifyContent: 'stretch',
                    rowGap: theme.spacing(1),
                    gridTemplateColumns: '30px auto 180px',
                    gridTemplateRows: '20px 30px',
                  })}
                >
                  <ListItemIcon>
                    <Radio
                      value={dataLayer.id}
                      edge="start"
                      disableRipple
                      inputProps={{ 'aria-label': dataLayer.title }}
                    />
                  </ListItemIcon>
                  <Typography
                    component="h2"
                    sx={{
                      gridColumn: '2/4',
                      fontWeight: '700',
                      fontSize: '16px',
                      color: 'blue.dark1',
                    }}
                  >
                    {dataLayer.title}
                  </Typography>
                  <Typography sx={{ gridColumn: '2/3', color: 'blue.dark1' }}>
                    {dataLayer.dataEntry.sharedResources.join(', ')}
                  </Typography>
                  <Typography sx={{ gridColumn: '3/4' }}>
                    {t('sharedData.file_date_and_author', {
                      date: formatDate(
                        i18n.resolvedLanguage,
                        dataLayer.createdAt
                      ),
                      user: dataLayer.createdBy,
                    })}
                  </Typography>
                  {dataLayer.description && (
                    <Typography variant="caption" sx={{ gridColumn: '2/4' }}>
                      {dataLayer.description}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ gridColumn: '2/4' }}>
                    {t(
                      'storyMap.form_location_add_data_layer_dialog_source_file',
                      {
                        filename: `${dataLayer.dataEntry.name}.${dataLayer.dataEntry.resourceType}`,
                      }
                    )}
                  </Typography>
                  {dataLayer.isRestricted && (
                    <Typography variant="caption" sx={{ gridColumn: '2/4' }}>
                      {t(
                        'storyMap.form_location_add_data_layer_dialog_restricted',
                        {
                          user: dataLayer.dataEntry.createdBy,
                        }
                      )}
                    </Typography>
                  )}
                </ListItem>
              ))}
            </List>
          </RadioGroup>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          padding: 2,
        }}
      >
        <Button onClick={onClose}>
          {t('storyMap.form_location_add_data_layer_dialog_cancel')}
        </Button>
        <Button variant="contained" onClick={onConfirmWrapper} autoFocus>
          {t('storyMap.form_location_add_data_layer_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataLayerDialog;
