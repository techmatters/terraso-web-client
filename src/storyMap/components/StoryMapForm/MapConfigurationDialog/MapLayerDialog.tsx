/*
 * Copyright © 2025 Technology Matters
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

import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useSelector } from 'terraso-web-client/terrasoApi/store';
import OpenInNew from '@mui/icons-material/OpenInNew';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListProps,
  Radio,
  RadioGroup,
  Stack,
  StackProps,
  Typography,
} from '@mui/material';

import { CreateMapLayerFileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/CreateMapLayerDialog';
import { useStoryMapConfigContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { fetchDataLayers } from 'terraso-web-client/storyMap/storyMapSlice';
import { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

const MapLayerStack = (props: StackProps) => (
  <Stack component="ul" spacing={1} {...props} />
);

const MapLayerList = (props: ListProps) => (
  <List component={MapLayerStack} {...props} />
);

interface MapLayerListItemProps {
  mapLayer: MapLayerConfig;
}

const MapLayerListItem = ({ mapLayer }: MapLayerListItemProps) => {
  return (
    <ListItem
      aria-label={mapLayer.title}
      sx={({ spacing }) => ({
        display: 'grid',
        justifyContent: 'stretch',
        rowGap: spacing(1),
        gridTemplateColumns: '30px auto 180px',
        gridTemplateRows: '0px 0px',
      })}
    >
      <ListItemIcon sx={{ gridColumn: '1/2' }}>
        <Radio
          value={mapLayer.id}
          edge="start"
          disableRipple
          slotProps={{
            input: {
              'aria-label': mapLayer.title,
            },
          }}
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
        {mapLayer.title}
      </Typography>
    </ListItem>
  );
};

interface SelectMapLayerSectionProps {
  fetching: boolean;
  mapLayers: MapLayerConfig[];
  selected: string;
  setSelected: (value: string) => void;
}

const SelectMapLayerSection = ({
  fetching,
  mapLayers,
  selected,
  setSelected,
}: SelectMapLayerSectionProps) => {
  const { t } = useTranslation();

  const sortedMapLayers = useMemo(() => {
    return _.sortBy(
      [(mapLayer: MapLayerConfig) => mapLayer.title?.toLowerCase()],
      mapLayers
    );
  }, [mapLayers]);

  return (
    <>
      {fetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress aria-label={t('common.loader_label')} />
        </Box>
      ) : _.isEmpty(mapLayers) ? (
        <></>
      ) : (
        <Stack>
          <Typography component="h2" sx={{ fontWeight: 'bold' }}>
            {t(
              'storyMap.form_location_add_data_layer_dialog_select_section_title'
            )}
          </Typography>
          <RadioGroup
            value={selected}
            onChange={event => setSelected(event.target.value)}
          >
            <MapLayerList aria-labelledby="data-layer-dialog-subtitle">
              {sortedMapLayers.map(mapLayer => (
                <MapLayerListItem key={mapLayer.id} mapLayer={mapLayer} />
              ))}
            </MapLayerList>
          </RadioGroup>
        </Stack>
      )}
    </>
  );
};

interface CreateMapLayerSectionProps {
  onCreate: (mapLayer: MapLayerConfig) => void;
  title?: string;
}

const CreateMapLayerSection = ({
  onCreate,
  title,
}: CreateMapLayerSectionProps) => {
  return <CreateMapLayerFileUpload onCreate={onCreate} title={title} />;
};

interface MapLayerDialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (mapLayer: MapLayerConfig) => void;
}

export const MapLayerDialog = ({
  open,
  title,
  onClose,
  onConfirm,
}: MapLayerDialogProps) => {
  const { t } = useTranslation();
  const { fetching, list: mapLayers } = useSelector(
    state => state.storyMap.dataLayers
  ) as { fetching: boolean; list: MapLayerConfig[] };
  const [selected, setSelected] = useState('');
  const { storyMap } = useStoryMapConfigContext() as {
    storyMap?: { id: string };
  };

  const mapLayersById = useMemo(
    () =>
      (_.isEmpty(mapLayers) ? {} : _.keyBy('id', mapLayers)) as Record<
        string,
        MapLayerConfig
      >,
    [mapLayers]
  );

  useFetchData(
    useCallback(() => {
      if (open && storyMap?.id) {
        return fetchDataLayers({ ownerId: storyMap.id });
      } else {
        return null;
      }
    }, [open, storyMap?.id])
  );

  const onConfirmWrapper = useCallback(() => {
    onConfirm(mapLayersById[selected]);
  }, [onConfirm, selected, mapLayersById]);

  const onCreate = useCallback(
    (mapLayer: MapLayerConfig) => {
      onConfirm(mapLayer);
    },
    [onConfirm]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm"
      sx={{ '& .MuiDialog-paper': { backgroundColor: 'gray.lite2' } }}
    >
      <DialogTitle component="h1" sx={{ pb: 0 }}>
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
        <Link
          href={t('storyMap.form_create_map_layer_dialog_help_link')}
          target="_blank"
        >
          {t('storyMap.form_create_map_layer_dialog_help_text')}{' '}
          <OpenInNew fontSize="inherit" sx={{ verticalAlign: 'middle' }} />
        </Link>
      </DialogContent>
      <DialogContent>
        <Stack sx={{ rowGap: 3 }}>
          <CreateMapLayerSection title={title} onCreate={onCreate} />
          <SelectMapLayerSection
            fetching={fetching}
            selected={selected}
            setSelected={setSelected}
            mapLayers={mapLayers}
          />
        </Stack>
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
          disabled={fetching || _.isEmpty(selected)}
        >
          {t('storyMap.form_location_add_data_layer_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
