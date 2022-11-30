import React, { useCallback, useContext, useEffect, useMemo } from 'react';

import _ from 'lodash/fp';
import path from 'path-browserify';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
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
import FormField from 'forms/components/FormField';

import { MAX_DESCRIPTION_CHARACTERS } from 'sharedData/sharedDataConstants';

import {
  SHARED_DATA_ACCEPTED_EXTENSIONS,
  SHARED_DATA_MAX_FILES,
  SHARED_DATA_MAX_SIZE,
} from 'config';

import SuccessContainer from './SuccessContainer';
import { groupDataEntryUploadsByStatus } from './utils';

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
      <SuccessContainer message={t('sharedData.upload_file_success')}>
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
          <IconButton aria-label="delete" onClick={() => onFileDelete(file.id)}>
            <DeleteIcon />
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
            placeholder: t('sharedData.upload_description_placeholder'),
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

const fileWrapper = file => {
  const filePath = path.parse(file.name);
  return {
    id: uuidv4(),
    name: filePath.name,
    resourceType: filePath.ext,
    file,
  };
};

const ShareDataFiles = props => {
  const { t } = useTranslation();
  const {
    filesState,
    setFilesState: setState,
    setFilesPending,
    setFilesErrors,
    setFilesUploading,
    setFilesSuccess,
  } = props;

  const uploads = useSelector(_.get('sharedData.uploads.files'));

  const files = useMemo(() => filesState.files || {}, [filesState.files]);
  const errors = useMemo(() => filesState.errors || {}, [filesState.errors]);
  const dropErrors = useMemo(
    () => filesState.dropErrors,
    [filesState.dropErrors]
  );

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
    setFilesErrors(errors);
  }, [errors, setFilesErrors]);

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

  const onDrop = useCallback(
    acceptedFiles => {
      setState('dropErrors', () => null);
      setState('files', files => ({
        ...files,
        ..._.flow(_.map(fileWrapper), _.keyBy('id'))(acceptedFiles),
      }));
    },
    [setState]
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
            fileExtensions: SHARED_DATA_ACCEPTED_EXTENSIONS.join(', '),
          })
        )
      )(rejections);
      setState('dropErrors', () => messages);
    },
    [t, setState]
  );

  const onFileChange = (id, newFile) => {
    setState('files', files => ({
      ...files,
      [id]: newFile,
    }));
    setState('errors', _.omit(id));
    VALIDATION_SCHEMA.validate(newFile).catch(error => {
      setState('errors', errors => ({
        ...errors,
        [id]: {
          [error.path]: error.message,
        },
      }));
    });
  };
  const onFileDelete = id => {
    setState('errors', _.omit(id));
    setState('files', _.omit(id));
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
          fileExtensions={SHARED_DATA_ACCEPTED_EXTENSIONS}
        />
        <FilesContext.Provider
          value={{
            files: Object.values(files),
            errors,
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

export default ShareDataFiles;
