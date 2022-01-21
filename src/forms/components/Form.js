import React, { useEffect } from 'react';
import _ from 'lodash';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';

import FormField from 'forms/components/FormField';
import theme from 'theme';

const getInitialEmptyValues = fields =>
  _.chain(fields)
    .map(field => [field.name, ''])
    .fromPairs()
    .value();

const Form = props => {
  const { t } = useTranslation();
  const {
    prefix,
    fields,
    values,
    validationSchema,
    saveLabel,
    onSave,
    cancelLabel,
    onCancel,
    children,
  } = props;

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ...getInitialEmptyValues(fields),
      ...values,
    },
    resolver: yupResolver(validationSchema),
  });

  const requiredFields = _.chain(_.get(validationSchema, 'fields', {}))
    .toPairs()
    .filter(([name, field]) => _.get(field, 'exclusiveTests.required', false))
    .map(([name]) => name)
    .value();

  useEffect(() => {
    if (values) {
      reset({
        ...getInitialEmptyValues(fields),
        ...values,
      });
    }
  }, [values, fields, reset]);

  const onSubmit = data => onSave(data);

  return (
    <Grid
      component="form"
      noValidate
      container
      spacing={2}
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: '100%' }}
    >
      {fields.map(field => (
        <Grid
          key={field.name}
          item
          xs={12}
          {..._.get(field, 'props.gridItemProps')}
        >
          <FormField
            control={control}
            required={_.includes(requiredFields, field.name)}
            id={`${prefix}-${field.name}`}
            name={field.name}
            label={field.label}
            info={field.info}
            inputProps={{
              type: field.type || 'text',
              placeholder: t(field.placeholder),
              ..._.get(field, 'props.inputProps', {}),
            }}
            {..._.get(field, 'props', {})}
          />
        </Grid>
      ))}
      {children}
      <Grid
        item
        container
        xs={12}
        spacing={2}
        direction="row"
        justifyContent="space-between"
        sx={{ marginTop: theme.spacing(2) }}
      >
        {onCancel && (
          <Button variant="text" onClick={onCancel}>
            {t(cancelLabel)}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          sx={{ paddingLeft: theme.spacing(5), paddingRight: theme.spacing(5) }}
        >
          {t(saveLabel)}
        </Button>
      </Grid>
    </Grid>
  );
};

export default Form;
