import React, { useEffect } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash/fp';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, Grid } from '@mui/material';

import FormField from 'forms/components/FormField';
import { useFormSetContext } from 'forms/formContext';

const getInitialEmptyValues = _.flow(
  _.map(field => [field.name, '']),
  _.fromPairs
);

const Form = props => {
  const { t } = useTranslation();
  const {
    mode = 'onSubmit',
    prefix,
    localizationPrefix,
    fields,
    values,
    validationSchema,
    saveLabel,
    onSave,
    cancelLabel,
    onCancel,
    children,
    isMultiStep,
    onChange,
    filterField,
  } = props;
  const setFormContext = useFormSetContext();

  const formProps = useForm({
    mode,
    defaultValues: {
      ...getInitialEmptyValues(fields),
      ...values,
    },
    resolver: yupResolver(validationSchema),
  });
  const { control, handleSubmit, reset, watch, getValues, trigger, formState } =
    formProps;

  useEffect(() => {
    setFormContext?.({ trigger, errors: formState?.errors });
  }, [setFormContext, trigger, formState?.errors]);

  watch((data, { name, type }) => onChange?.(data, name, type));

  const requiredFields = _.flow(
    _.toPairs,
    _.filter(([name, field]) =>
      _.getOr(false, 'exclusiveTests.required', field)
    ),
    _.map(([name]) => name)
  )(_.getOr({}, 'fields', validationSchema));

  useEffect(() => {
    if (values) {
      reset({
        ...getInitialEmptyValues(fields),
        ...values,
      });
    }
  }, [values, fields, reset]);

  const onSubmit = data => onSave(data);

  const ariaProps = _.pickBy(
    (value, propName) => propName.startsWith('aria-'),
    props
  );

  const buttonPadding = isMultiStep ? 0 : 5;

  const actions = [
    saveLabel && (
      <Button
        key="submit"
        type="submit"
        variant="contained"
        sx={{
          paddingLeft: 5,
          paddingRight: 5,
        }}
      >
        {t(saveLabel)}
      </Button>
    ),
    onCancel && (
      <Button
        key="cancel"
        variant="text"
        onClick={onCancel}
        sx={{ paddingLeft: buttonPadding, paddingRight: buttonPadding }}
      >
        {t(cancelLabel)}
      </Button>
    ),
  ];

  return (
    <FormProvider watch={watch} getValues={getValues}>
      <Grid
        component="form"
        {...ariaProps}
        noValidate
        container
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: '100%' }}
      >
        {fields
          .filter(field => (filterField ? filterField(field, formProps) : true))
          .map(field =>
            field.renderStaticElement ? (
              <React.Fragment key={field.name}>
                {field.renderStaticElement({ t })}
              </React.Fragment>
            ) : (
              <Grid
                key={field.name}
                item
                xs={12}
                {..._.get('props.gridItemProps', field)}
                sx={{
                  pb: 3,
                  ..._.getOr({}, 'props.gridItemProps.sx', field),
                }}
              >
                <Controller
                  name={field.name}
                  control={control}
                  render={controllerProps => (
                    <FormField
                      field={controllerProps.field}
                      fieldState={controllerProps.fieldState}
                      required={_.includes(field.name, requiredFields)}
                      id={`${prefix}-${field.name}`}
                      label={field.label}
                      info={field.info}
                      localizationPrefix={localizationPrefix}
                      {..._.getOr({}, 'props', field)}
                      inputProps={{
                        type: field.type || 'text',
                        placeholder: t(field.placeholder),
                        ..._.getOr({}, 'props.inputProps', field),
                      }}
                    />
                  )}
                />
              </Grid>
            )
          )}
        {children}
        <Grid
          item
          container
          xs={12}
          direction="row"
          justifyContent={isMultiStep ? 'space-between' : 'start'}
          sx={{ marginTop: 2 }}
        >
          {isMultiStep ? actions.reverse() : actions}
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default Form;
