import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Link, Stack, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

import PageHeader from 'layout/PageHeader';
import LandscapeBoundaries from 'landscape/components/LandscapeBoundaries';

const BoundaryStep = props => {
  const { landscape, onSave } = props;
  const [option, setOption] = useState(-1);

  useEffect(() => {
    switch (option) {
      case 2:
        onSave(landscape);
        return null;
      default:
        return null;
    }
  }, [option, landscape, onSave]);

  switch (option) {
    case 0:
      return <GeoJson />;
    default:
      return <BoundaryOptions setOption={setOption} {...props} />;
  }
};

const GeoJson = props => {
  return <LandscapeBoundaries />;
};

const BoundaryOptions = props => {
  const { t } = useTranslation();
  const { setOption, setActiveStepIndex } = props;

  const options = [
    {
      Icon: UploadFileIcon,
      label: 'landscape.form_boundary_options_geo_json',
    },
    {
      Icon: PinDropIcon,
      label: 'landscape.form_boundary_options_pin',
    },
    {
      Icon: ArrowRightAltIcon,
      label: 'landscape.form_boundary_options_skip',
    },
  ];
  return (
    <>
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={t('landscape.form_boundary_options_title')}
      />
      <Typography>
        {t('landscape.form_boundary_options_description')}
      </Typography>
      <Typography variant="body2" sx={{ marginTop: 2, marginBottom: 4 }}>
        {t('landscape.form_boundary_options_suggestion')}
      </Typography>
      <Link variant="body2">{t('landscape.form_boundary_options_link')}</Link>
      <Stack sx={{ marginTop: 2 }} spacing={3}>
        {options.map((option, index) => (
          <Button
            key={index}
            fullWidth
            variant="outlined"
            onClick={() => setOption(index)}
            sx={{
              justifyContent: 'start',
              padding: 4,
              borderColor: 'gray.mid',
            }}
          >
            <option.Icon
              sx={{ fontSize: '40px', marginRight: 2, color: 'gray.mid2' }}
            />
            {t(option.label)}
          </Button>
        ))}
      </Stack>
      <Button
        sx={{ marginTop: 2 }}
        onClick={() => setActiveStepIndex(current => current - 1)}
      >
        {t('landscape.form_boundary_options_back')}
      </Button>
    </>
  );
};

export default BoundaryStep;
