import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import _ from 'lodash/fp';
import path from 'path-browserify';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled } from '@mui/system';

import BaseDropZone from 'common/components/DropZone';
import FormField from 'forms/components/FormField';
import { useAnalytics } from 'monitoring/analytics';

import {
  UPLOAD_STATUS_ERROR,
  UPLOAD_STATUS_SUCCESS,
  UPLOAD_STATUS_UPLOADING,
  resetUploads,
  uploadSharedDataFile,
} from 'sharedData/sharedDataSlice';

import {
  SHARED_DATA_ACCEPTED_EXTENSIONS,
  SHARED_DATA_MAX_FILES,
  SHARED_DATA_MAX_SIZE,
} from 'config';

import theme from 'theme';

const VALIDATION_SCHEMA = yup
  .object({
    name: yup.string().trim().required(),
    description: yup.string().maxCustom(200).trim(),
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
  const apiSuccess = _.has(file.id, apiSuccesses);
  const isUploading = _.has(file.id, apiUploading);

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
        {apiSuccess && (
          <Alert
            sx={{
              width: '100%',
              boxSizing: 'border-box',
            }}
            severity="success"
          >
            {t('sharedData.upload_file_success')}
          </Alert>
        )}
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
      divider={<Divider flexItem sx={{ backgroundColor: 'black' }} />}
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
  const dispatch = useDispatch();
  const {
    setFilesPending,
    setFilesErrors,
    setFilesUploading,
    setFilesSuccess,
  } = props;

  const uploads = useSelector(_.get('sharedData.uploads.files'));
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [dropErrors, setDropErrors] = useState();

  const { apiErrors, apiSuccesses, apiUploading } = useMemo(() => {
    const byStatus = _.flow(
      _.toPairs,
      _.filter(([fileId]) => _.has(fileId, files)),
      _.groupBy(([fileId, result]) => result.status),
      _.toPairs,
      _.map(([status, statusFiles]) => [
        status,
        _.flow(
          _.map(([fileId, result]) => [fileId, result.data]),
          _.fromPairs
        )(statusFiles),
      ]),
      _.fromPairs
    )(uploads);
    return {
      apiErrors: byStatus[UPLOAD_STATUS_ERROR],
      apiSuccesses: byStatus[UPLOAD_STATUS_SUCCESS],
      apiUploading: byStatus[UPLOAD_STATUS_UPLOADING],
    };
  }, [uploads, files]);

  useEffect(() => {
    const pendingFiles = _.toPairs(files).filter(
      ([fileId]) => !_.has(fileId, apiSuccesses)
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
    dispatch(resetUploads());
  }, [dispatch]);

  useEffect(() => {
    const isCompleteSuccess =
      !_.isEmpty(Object.values(files)) &&
      !_.isEmpty(apiSuccesses) &&
      _.isEmpty(apiErrors) &&
      _.isEmpty(apiUploading);
    if (isCompleteSuccess) {
      setFilesSuccess(true);
    }
  }, [files, apiErrors, apiSuccesses, apiUploading, setFilesSuccess]);

  const onDrop = useCallback(
    acceptedFiles => {
      setDropErrors(null);
      setFiles(files => ({
        ...files,
        ..._.flow(_.map(fileWrapper), _.keyBy('id'))(acceptedFiles),
      }));
    },
    [setFiles]
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
      setDropErrors(messages);
    },
    [t]
  );

  const onFileChange = (id, newFile) => {
    setFiles(files => ({
      ...files,
      [id]: newFile,
    }));
    setErrors(_.omit(id));
    VALIDATION_SCHEMA.validate(newFile).catch(error => {
      setErrors(errors => ({
        ...errors,
        [id]: {
          [error.path]: error.message,
        },
      }));
    });
  };
  const onFileDelete = id => {
    setErrors(_.omit(id));
    setFiles(_.omit(id));
  };

  return (
    <>
      <Typography sx={{ fontWeight: 700 }}>
        {t('sharedData.upload_description')}
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

const SharedDataUpload = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();

  const { groupSlug, onCancel, onCompleteSuccess } = props;

  const [filesPending, setFilesPending] = useState([]);
  const [filesErrors, setFilesErrors] = useState([]);
  const [filesUploading, setFilesUploading] = useState(false);
  const [filesSuccess, setFilesSuccess] = useState(false);

  useEffect(() => {
    dispatch(resetUploads());
  }, [dispatch]);

  useEffect(() => {
    const isCompleteSuccess = filesSuccess;
    if (isCompleteSuccess) {
      onCompleteSuccess(true);
    }
  }, [filesSuccess, onCompleteSuccess]);

  const onSave = useCallback(() => {
    const promises = filesPending.map(([fileId, file]) =>
      dispatch(uploadSharedDataFile({ groupSlug, file }))
    );
    Promise.allSettled(promises).then(results =>
      results
        .filter(result => result.status === 'fulfilled')
        .forEach(result => {
          trackEvent('uploadFile', { props: { owner: groupSlug } });
        })
    );
  }, [filesPending, groupSlug, dispatch, trackEvent]);

  const hasBlockingErrors = useMemo(
    () =>
      !_.isEmpty(Object.values(filesErrors).filter(error => !_.isEmpty(error))),
    [filesErrors]
  );

  console.log({ filesPending, hasBlockingErrors });
  const isSaveDisabled = useMemo(
    () => _.isEmpty(filesPending) || hasBlockingErrors,
    [filesPending, hasBlockingErrors]
  );

  const isUploading = useMemo(() => filesUploading, [filesUploading]);

  return (
    <>
      <Paper
        component={Stack}
        spacing={2}
        variant="outlined"
        sx={{ padding: 2 }}
      >
        <ShareDataFiles
          setFilesPending={setFilesPending}
          setFilesErrors={setFilesErrors}
          setFilesUploading={setFilesUploading}
          setFilesSuccess={setFilesSuccess}
        />
      </Paper>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        sx={{ marginTop: 3 }}
      >
        <LoadingButton
          variant="contained"
          disabled={isSaveDisabled}
          loading={isUploading}
          onClick={onSave}
          sx={{ paddingLeft: 5, paddingRight: 5 }}
        >
          {t('sharedData.upload_save')}
        </LoadingButton>
        <Button variant="text" onClick={onCancel}>
          {t('sharedData.upload_cancel')}
        </Button>
      </Stack>
    </>
  );
};

export default SharedDataUpload;
