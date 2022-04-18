import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import countries from 'world-countries';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

import { fetchLandscapeForm, setFormNewValues } from 'landscape/landscapeSlice';
import { useDocumentTitle } from 'common/document';
import Form from 'forms/components/Form';
import PageLoader from 'layout/PageLoader';
import PageHeader from 'layout/PageHeader';
import PageContainer from 'layout/PageContainer';
import Stepper from 'common/components/Stepper';
import {
  Button,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

const FORM_VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().required(),
    description: yup.string().maxCustom(600).required(),
    website: yup.string().url(),
  })
  .required();

const FORM_FIELDS = [
  {
    name: 'name',
    label: 'landscape.form_name_label',
  },
  {
    name: 'description',
    label: 'landscape.form_description_label',
    placeholder: 'landscape.form_description_placeholder',
    props: {
      inputProps: {
        multiline: true,
        rows: 4,
      },
    },
  },
  {
    name: 'location',
    label: 'landscape.form_location_label',
    props: {
      renderInput: ({ field }) => <CountrySelector field={field} />,
    },
  },
  {
    name: 'website',
    label: 'landscape.form_website_label',
    info: 'landscape.form_website_info',
    placeholder: 'landscape.form_website_placeholder',
    type: 'url',
  },
];

const InfoStep = props => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const isNew = !slug;
  const { setActiveStepIndex, setUpdatedLandscape, landscape } = props;
  const title = !isNew
    ? t('landscape.form_edit_title', { name: _.getOr('', 'name', landscape) })
    : t('landscape.form_new_title');

  return (
    <>
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={title}
      />
      <Form
        aria-labelledby="landscape-form-page-title"
        prefix="landscape"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={FORM_VALIDATION_SCHEMA}
        onSave={updatedLandscape => {
          setUpdatedLandscape(updatedLandscape);
          setActiveStepIndex(current => current + 1);
        }}
        saveLabel="landscape.form_save_label"
      />
    </>
  );
};

const CountrySelector = props => {
  const { i18n } = useTranslation();
  const { field } = props;

  const countriesLang = i18n.resolvedLanguage.startsWith('es')
    ? 'translations.spa.common'
    : 'name.common';

  const countriesList = countries.map(_.get(countriesLang)).sort();

  return (
    <Select
      value={field.value}
      onChange={field.onChange}
      sx={{ width: '100%' }}
    >
      {countriesList.map((country, index) => (
        <MenuItem key={index} value={country}>
          {country}
        </MenuItem>
      ))}
    </Select>
  );
};

const BoundaryOptions = props => {
  const { t } = useTranslation();

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
      <Typography>{t('landscape.form_boundary_options_suggestion')}</Typography>
      <Link>{t('landscape.form_boundary_options_link')}</Link>
      <Stack spacing={3}>
        {options.map((option, index) => (
          <Button
            key={index}
            fullWidth
            variant="outlined"
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
    </>
  );
};

const LandscapeForm = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { slug } = useParams();
  const { fetching, landscape } = useSelector(state => state.landscape.form);
  const [updatedLandscape, setUpdatedLandscape] = React.useState(landscape);

  const isNew = !slug;

  useDocumentTitle(
    !isNew
      ? t('landscape.form_edit_document_title', {
          name: _.getOr('', 'name', landscape),
        })
      : t('landscape.form_new_document_title'),
    fetching
  );

  useEffect(() => {
    if (isNew) {
      dispatch(setFormNewValues());
      return;
    }
    dispatch(fetchLandscapeForm(slug));
  }, [dispatch, slug, isNew]);

  useEffect(
    () => () => {
      // Clean values when component closes
      dispatch(setFormNewValues());
    },
    [dispatch, slug, isNew]
  );

  useEffect(() => {
    if (landscape && landscape.slug !== slug) {
      // Change URL if new landscape ID
      navigate(`/landscapes/${landscape.slug}/edit`);
    }
  }, [slug, landscape, navigate]);

  const steps = [
    {
      label: 'landscape.form_step_info_label',
      render: ({ setActiveStepIndex }) => (
        <InfoStep
          landscape={updatedLandscape}
          setActiveStepIndex={setActiveStepIndex}
          setUpdatedLandscape={setUpdatedLandscape}
        />
      ),
    },
    {
      label: 'landscape.form_step_boundaries_options_label',
      render: () => <BoundaryOptions />,
    },
  ];

  return (
    <PageContainer>
      {fetching && <PageLoader />}
      <Stepper steps={steps} />
    </PageContainer>
  );
};

export default LandscapeForm;
