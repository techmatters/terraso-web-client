import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFetchData } from 'terraso-client-shared/store/utils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Radio,
  RadioGroup,
} from '@mui/material';

import { fetchDataLayers } from 'storyMap/storyMapSlice';

const DataLayerDialog = props => {
  const { open, title, onClose, onConfirm } = props;
  const { t } = useTranslation();
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
    <Dialog fullScreen open={open}>
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
                <ListItem key={dataLayer.id} component={Card}>
                  <ListItemIcon>
                    <Radio
                      value={dataLayer.id}
                      edge="start"
                      disableRipple
                      inputProps={{ 'aria-label': dataLayer.title }}
                    />
                  </ListItemIcon>
                  {dataLayer.title}
                  {dataLayer.description}
                  {dataLayer.dataEntry.title}
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
