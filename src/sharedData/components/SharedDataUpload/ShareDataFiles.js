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

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import * as yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled } from '@mui/system';

import BaseDropZone from 'common/components/DropZone';
import { fileWrapper } from 'common/fileUtils';
import FormField from 'forms/components/FormField';
import { MAX_DESCRIPTION_CHARACTERS } from 'sharedData/sharedDataConstants';

import SuccessContainer from './SuccessContainer';
import { groupDataEntryUploadsByStatus } from './utils';

import {
  SHARED_DATA_ACCEPTED_EXTENSIONS,
  SHARED_DATA_ACCEPTED_TYPES,
  SHARED_DATA_MAX_FILES,
  SHARED_DATA_MAX_SIZE,
} from 'config';

import theme from 'theme';

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().trim().required(),
    description: yup.string().max(MAX_DESCRIPTION_CHARACTERS).trim(),
  })
  .required();

const DropZone = styled(BaseDropZone)(() => ({
  flexGrow: 1,
}));

const FilesContext = React.createContext();

const FileField = props => {
  const { id, required, label, value, onChange, error, inputProps, disabled } =
    props;

  return (
    <FormField
      id={id}
      required={required}
      label={label}
      disabled={disabled}
      field={{
        value,
        onChange,
      }}
      {...(error ? _.set('fieldState.error.message', error, {}) : {})}
      inputProps={{
        size: 'small',
        ...inputProps,
      }}
    />
  );
};

const File = props => {
  const { t } = useTranslation();
  const {
    apiSuccesses,
    apiErrors,
    apiUploading,
    errors,
    onFileChange,
    onFileDelete,
  } = useContext(FilesContext);
  const { index, file } = props;

  const onFieldChange = field => event => {
    onFileChange(file.id, {
      ...file,
      [field]: event.target.value,
    });
  };

  const apiFileErrors = _.get(file.id, apiErrors);
  const apiSuccess = _.get(file.id, apiSuccesses);
  const isUploading = _.has(file.id, apiUploading);

  if (apiSuccess) {
    return (
      <SuccessContainer
        label={apiSuccess.name}
        message={t('sharedData.upload_file_success')}
      >
        <Typography sx={{ pl: 4 }}>{apiSuccess.name}</Typography>
      </SuccessContainer>
    );
  }

  return (
    <>
      {isUploading && <LinearProgress />}
      <Stack
        component="section"
        aria-label={file.name}
        spacing={1}
        sx={{
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 1,
          paddingBottom: 1,
        }}
      >
        {!_.isEmpty(apiFileErrors) &&
          apiFileErrors.map((apiError, index) => (
            <Alert
              key={index}
              sx={{
                width: '100%',
                boxSizing: 'border-box',
              }}
              severity="error"
            >
              {t(_.getOr(apiError, 'content', apiError), {
                ...apiError.params,
                file,
              })}
            </Alert>
          ))}
        <Stack direction="row">
          <FileField
            required
            id={`filename-${index}`}
            label={t('sharedData.upload_filename_label')}
            value={file.name}
            onChange={onFieldChange('name')}
            error={_.get(`${file.id}.name`, errors)}
            disabled={isUploading}
            inputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {file.resourceType}
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            title={t('sharedData.delete_file_label')}
            onClick={() => onFileDelete(file.id)}
            sx={{ alignItems: 'end' }}
          >
            <DeleteIcon sx={{ color: 'secondary.main' }} />
          </IconButton>
        </Stack>
        <FileField
          id={`description-${index}`}
          label={t('sharedData.upload_description_label')}
          value={file.description}
          onChange={onFieldChange('description')}
          error={_.get(`${file.id}.description`, errors)}
          disabled={isUploading}
          inputProps={{
            placeholder: t('sharedData.upload_description_file_placeholder'),
          }}
        />
      </Stack>
    </>
  );
};

const SelectedFiles = () => {
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  const { files } = useContext(FilesContext);

  return (
    <Stack
      divider={
        <Divider
          aria-hidden="true"
          flexItem
          sx={{ backgroundColor: 'black' }}
        />
      }
      sx={({ palette }) => ({
        border: `2px dashed ${palette.blue.dark}`,
        ...(isSmall ? { borderTop: 'none' } : { borderLeft: 'none' }),
        minHeight: '200px',
        flexGrow: 1,
        justifyContent: 'center',
      })}
    >
      {_.isEmpty(files) ? (
        <Typography align="center">
          {t('sharedData.upload_no_files')}
        </Typography>
      ) : (
        files.map((file, index) => (
          <File key={index} index={index} file={file} />
        ))
      )}
    </Stack>
  );
};

const ShareDataFiles = props => {
  const { t } = useTranslation();
  const { filesState } = props;
  const {
    filesErrors,
    setFilesErrors,
    apiErrors,
    apiSuccesses,
    apiUploading,
    files,
    setFiles,
  } = filesState;
  const [dropErrors, setDropErrors] = useState();

  const onDrop = useCallback(
    acceptedFiles => {
      setDropErrors(() => null);
      setFiles(files => ({
        ...files,
        ..._.flow(_.map(fileWrapper), _.keyBy('id'))(acceptedFiles),
      }));
    },
    [setFiles, setDropErrors]
  );

  const onDropRejected = useCallback(
    rejections => {
      const messages = _.flow(
        // Group by error code
        _.groupBy(_.get('errors[0].code')),
        // Get only rejected files filename and join them
        _.mapValues(_.flow(_.map(_.get('file.name')), _.join(', '))),
        _.toPairs,
        // Generate localized messages
        _.map(([errorCode, rejectedFiles]) =>
          t(`sharedData.upload_rejected_${errorCode}`, {
            rejectedFiles,
            maxSize: SHARED_DATA_MAX_SIZE / 1000000.0,
            maxFiles: SHARED_DATA_MAX_FILES,
            fileExtensions: SHARED_DATA_ACCEPTED_EXTENSIONS,
          })
        )
      )(rejections);
      setDropErrors(() => messages);
    },
    [t, setDropErrors]
  );

  const onFileChange = (id, newFile) => {
    setFiles(files => ({
      ...files,
      [id]: newFile,
    }));
    setFilesErrors(_.omit(id));
    VALIDATION_SCHEMA.validate(newFile).catch(error => {
      setFilesErrors(errors => ({
        ...errors,
        [id]: {
          [error.path]: error.message,
        },
      }));
    });
  };
  const onFileDelete = id => {
    setFilesErrors(_.omit(id));
    setFiles(_.omit(id));
  };

  return (
    <>
      <Typography sx={{ fontWeight: 700, mb: 2 }}>
        {t('sharedData.upload_files_description')}
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }}>
        <DropZone
          multiple
          errors={dropErrors}
          onDrop={onDrop}
          onDropRejected={onDropRejected}
          maxSize={SHARED_DATA_MAX_SIZE}
          maxFiles={SHARED_DATA_MAX_FILES}
          fileTypes={SHARED_DATA_ACCEPTED_TYPES}
          fileExtensions={SHARED_DATA_ACCEPTED_EXTENSIONS}
        />
        <FilesContext.Provider
          value={{
            files: Object.values(files),
            errors: filesErrors,
            apiErrors,
            apiSuccesses,
            apiUploading,
            onFileChange,
            onFileDelete,
          }}
        >
          <SelectedFiles />
        </FilesContext.Provider>
      </Stack>
    </>
  );
};

export const useFilesState = () => {
  const uploads = useSelector(_.get('sharedData.uploads.files'));

  const [filesPending, setFilesPending] = useState([]);
  const [filesErrors, setFilesErrors] = useState([]);
  const [filesUploading, setFilesUploading] = useState(false);
  const [filesSuccess, setFilesSuccess] = useState(0);

  const [files, setFiles] = useState({});

  const { apiErrors, apiSuccesses, apiUploading } = useMemo(
    () => groupDataEntryUploadsByStatus(_.pick(Object.keys(files), uploads)),
    [uploads, files]
  );

  useEffect(() => {
    const pendingFiles = Object.values(files).filter(
      file => !_.has(file.id, apiSuccesses)
    );
    setFilesPending(pendingFiles);
  }, [files, apiSuccesses, setFilesPending]);

  useEffect(() => {
    setFilesUploading(!_.isEmpty(apiUploading));
  }, [apiUploading, setFilesUploading]);

  useEffect(() => {
    const isCompleteSuccess =
      !_.isEmpty(Object.values(files)) &&
      !_.isEmpty(apiSuccesses) &&
      _.isEmpty(apiErrors) &&
      _.isEmpty(apiUploading);
    if (isCompleteSuccess) {
      setFilesSuccess(Object.keys(apiSuccesses).length);
    }
  }, [files, apiErrors, apiSuccesses, apiUploading, setFilesSuccess]);

  return {
    filesPending,
    filesErrors,
    setFilesErrors,
    filesUploading,
    filesSuccess,
    files,
    setFiles,
    apiErrors,
    apiSuccesses,
    apiUploading,
  };
};

export default ShareDataFiles;
