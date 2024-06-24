import { useCallback, useMemo, useState } from 'react';
/*
 * Copyright © 2024 Technology Matters
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

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
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

  const sortedDataLayers = useMemo(() => {
    return _.sortBy([dataLayer => dataLayer.title?.toLowerCase()], dataLayers);
  }, [dataLayers]);

  useFetchData(fetchDataLayers);

  const onConfirmWrapper = useCallback(() => {
    onConfirm(dataLayersById[selected]);
  }, [onConfirm, selected, dataLayersById]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDialog-paper': { backgroundColor: 'gray.lite2' } }}
    >
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
        <Typography
          id="data-layer-dialog-subtitle"
          sx={{ fontWeight: 700, mt: 2 }}
        >
          {t('storyMap.form_location_add_data_layer_dialog_subtitle')}
        </Typography>
        <Typography variant="caption" component="p" sx={{ mt: 1 }}>
          {t('storyMap.form_location_add_data_layer_dialog_description')}
        </Typography>
        {fetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress aria-label={t('common.loader_label')} />
          </Box>
        ) : (
          <>
            {_.isEmpty(dataLayers) ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t(
                  'storyMap.form_location_add_data_layer_dialog_layers_count_zero'
                )}
              </Alert>
            ) : (
              <Typography variant="caption" component="p" sx={{ mt: 3 }}>
                {t(
                  'storyMap.form_location_add_data_layer_dialog_layers_count',
                  {
                    count: dataLayers.length,
                  }
                )}
              </Typography>
            )}

            <RadioGroup
              value={selected}
              onChange={event => setSelected(event.target.value)}
            >
              <List aria-labelledby="data-layer-dialog-subtitle">
                {sortedDataLayers.map(dataLayer => (
                  <ListItem
                    aria-label={dataLayer.title}
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
          </>
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
        <Button
          variant="contained"
          onClick={onConfirmWrapper}
          autoFocus
          disabled={fetching || _.isEmpty(selected)}
        >
          {t('storyMap.form_location_add_data_layer_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataLayerDialog;
