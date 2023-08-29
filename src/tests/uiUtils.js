import { fireEvent, within } from 'tests/utils';

export const changeCombobox = async (parent, name, newValue, isNew = true) => {
  const combobox = parent.getByRole('combobox', {
    name,
  });
  fireEvent.change(combobox, { target: { value: newValue } });

  const optionsList = parent.getByRole('listbox', { name });

  if (isNew) {
    fireEvent.keyDown(combobox, { key: 'Enter' });
  } else {
    const option = within(optionsList).getByRole('option', {
      name: newValue,
    });
    fireEvent.click(option);
  }
};
