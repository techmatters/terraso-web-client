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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { dataURItoBlob, openFile } from 'media/fileUtils';
import { openImageUrl } from 'media/imageUtils';
import AvatarEditor from 'react-avatar-editor';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Paper, Slider, Stack, Typography } from '@mui/material';

import DropZone from 'common/components/DropZone';
import HelperText from 'common/components/HelperText';
import Form from 'forms/components/Form';
import { FormContextProvider } from 'forms/formContext';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';

import Actions from './Actions';

import {
  LANDSCAPE_PROFILE_IMAGE_MAX_SIZE,
  PROFILE_IMAGE_ACCEPTED_EXTENSIONS,
} from 'config';

const ASPECT_RATIO = 0.5625; // 9 / 16

const EDITOR_INITIAL_ZOOM = 1;
const EDITOR_INITIAL_SIZE = { width: 418, height: 235 };

const VALIDATION_SCHEMA = yup.object({}).required();

const FORM_FIELDS = [
  {
    name: 'profileImage',
    props: {
      renderInput: ({ field }) => <ProfileImage field={field} />,
    },
  },
  {
    name: 'profileImageDescription',
    label: 'landscape.form_profile_image_description_label',
    helperText: {
      i18nKey: 'landscape.form_profile_image_description_helper_text',
    },
    placeholder: 'landscape.form_profile_image_description_placeholder',
  },
];

const ProfileImage = props => {
  const { t } = useTranslation();
  const {
    field: { value, onChange },
  } = props;
  const [error, setError] = useState();
  const [image, setImage] = useState();
  const [zoom, setZoom] = useState(EDITOR_INITIAL_ZOOM);
  const [size, setSize] = useState(EDITOR_INITIAL_SIZE);
  const [openingImage, setOpeningImage] = useState(false);
  const cropTool = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      setOpeningImage(true);
      openImageUrl(value)
        .then(image => {
          setImage(image);
          setOpeningImage(false);
        })
        .catch(() => {
          setOpeningImage(false);
        });
    }
  }, [value, onChange]);

  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setError(
          t('landscape.form_profile_image_file_no_accepted', {
            extensions: PROFILE_IMAGE_ACCEPTED_EXTENSIONS.join(', '),
          })
        );
        return;
      }
      setError(null);
      setOpeningImage(true);
      openFile(acceptedFiles[0]).then(image => {
        setImage(image);
        setOpeningImage(false);
      });
    },
    [t]
  );

  const editorBorder = 20;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {openingImage && <PageLoader />}
      {image && (
        <Paper ref={containerRef} variant="outlined">
          <AvatarEditor
            ref={cropTool}
            image={image}
            width={size.width}
            height={size.height}
            border={editorBorder}
            color={[255, 255, 255, 0.6]} // RGBA
            scale={zoom}
            rotate={0}
            onImageReady={() => {
              const width = containerRef.current.offsetWidth - editorBorder * 2;
              const height = width * ASPECT_RATIO;
              setSize({ width, height });
            }}
            onImageChange={() => {
              const image = cropTool.current.getImage();
              dataURItoBlob(image.toDataURL('image/jpeg')).then(blob => {
                onChange({ result: blob });
              });
            }}
          />
        </Paper>
      )}
      <DropZone
        errors={error ? [error] : null}
        fileExtensions={PROFILE_IMAGE_ACCEPTED_EXTENSIONS}
        maxSize={LANDSCAPE_PROFILE_IMAGE_MAX_SIZE}
        onDrop={onDrop}
      />
      {image && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ m: 2 }}
          alignItems="center"
          justifyContent="center"
        >
          <Typography>
            {t('landscape.form_profile_image_zoom_label')}
          </Typography>
          <RemoveIcon />
          <Slider
            value={zoom || 1}
            onChange={(event, newValue) => setZoom(newValue)}
            step={0.1}
            min={1}
            max={10}
            sx={{ maxWidth: 400 }}
          />
          <AddIcon />
        </Stack>
      )}
    </Paper>
  );
};

const ProfileImageStep = props => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUpdatedLandscape, landscape } = props;
  const [updatedValues, setUpdatedValues] = useState();

  return (
    <>
      <PageHeader
        typographyProps={{
          id: 'landscape-form-page-title',
          variant: 'h1',
          component: 'h2',
        }}
        header={t('landscape.form_profile_profile_image_title')}
      >
        <HelperText
          i18nKey="landscape.form_profile_profile_image_helper_text"
          label="landscape.form_profile_profile_image_title"
        />
      </PageHeader>
      <Form
        aria-labelledby="landscape-form-page-title"
        prefix="landscape"
        localizationPrefix="landscape.form_key_info"
        fields={FORM_FIELDS}
        values={landscape}
        validationSchema={VALIDATION_SCHEMA}
        cancelLabel="landscape.form_info_cancel"
        onChange={setUpdatedValues}
      />
      <Actions
        isForm
        onCancel={() => navigate(-1)}
        updatedValues={updatedValues}
        onNext={setUpdatedLandscape}
        nextLabel="landscape.form_save_label"
        saveDisabled={!updatedValues?.profileImage?.result}
      />
    </>
  );
};

const ContextWrapper = props => (
  <FormContextProvider>
    <ProfileImageStep {...props} />
  </FormContextProvider>
);

export default ContextWrapper;
