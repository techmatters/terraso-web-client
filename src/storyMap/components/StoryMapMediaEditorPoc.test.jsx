import {
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';

import StoryMapMediaEditorPoc from 'terraso-web-client/storyMap/components/StoryMapMediaEditorPoc';

jest.mock('react-avatar-editor', () => ({
  __esModule: true,
  default: props => (
    <div
      data-position={JSON.stringify(props.position)}
      data-scale={props.scale}
      data-testid="image-crop-editor"
    />
  ),
}));

test('StoryMapMediaEditorPoc: stores image crop settings for the carousel while expansion uses the original image', async () => {
  await render(<StoryMapMediaEditorPoc />);

  const carousel = screen.getByTestId('carousel-viewport');
  const originalImage = within(carousel).getByRole('img', {
    name: 'image media',
  });
  const originalSource = originalImage.getAttribute('src');

  fireEvent.click(screen.getByRole('button', { name: 'Crop image media 1' }));
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

  expect(originalImage).toHaveStyle({ transform: 'scale(2)' });
  expect(screen.getByText('Media 1 of 5')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Expand image media' }));

  expect(
    within(screen.getByRole('dialog')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveAttribute('src', originalSource);
});

test('StoryMapMediaEditorPoc: fits the full image at the far-left zoom value', async () => {
  await render(<StoryMapMediaEditorPoc />);

  fireEvent.click(screen.getByRole('button', { name: 'Crop image media 1' }));
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

  expect(
    within(screen.getByTestId('carousel-viewport')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveStyle({ objectFit: 'contain' });
});
