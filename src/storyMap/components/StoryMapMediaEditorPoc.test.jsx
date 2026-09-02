import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from 'terraso-web-client/tests/utils';

import StoryMapMediaEditorPoc, {
  INITIAL_CHAPTER,
} from 'terraso-web-client/storyMap/components/StoryMapMediaEditorPoc';

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

  expect(screen.getByRole('button', { name: 'Add media' })).toHaveTextContent(
    'Add media'
  );

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
  expect(screen.getByText('Media 1 of 6')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Expand image media' }));

  expect(
    within(screen.getByRole('dialog')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveAttribute('src', originalSource);
});

test('StoryMapMediaEditorPoc: fits the full image at the computed minimum zoom', async () => {
  await render(<StoryMapMediaEditorPoc />);

  fireEvent.click(screen.getByRole('button', { name: 'Crop image media 1' }));
  const cropSource = screen.getByAltText('Crop source');
  Object.defineProperties(cropSource, {
    naturalHeight: { value: 1000 },
    naturalWidth: { value: 3000 },
  });
  fireEvent.load(cropSource);
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '0.5925925925925926' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

  const stageImage = within(screen.getByTestId('carousel-viewport')).getByRole(
    'img',
    { name: 'image media' }
  );
  Object.defineProperties(stageImage, {
    naturalHeight: { value: 1000 },
    naturalWidth: { value: 3000 },
  });
  fireEvent.load(stageImage);

  expect(
    within(screen.getByTestId('carousel-viewport')).getByRole('img', {
      name: 'image media',
    })
  ).toHaveStyle({ objectFit: 'contain' });
});

test('StoryMapMediaEditorPoc: provides clear reordering, direct navigation, and confirmed deletion', async () => {
  await render(<StoryMapMediaEditorPoc />);

  expect(
    within(
      screen.getByRole('toolbar', { name: 'Media collection actions' })
    ).getByRole('button', { name: 'Add media' })
  ).toBeInTheDocument();

  const currentMediaActions = screen.getByRole('toolbar', {
    name: 'Current media actions',
  });
  expect(
    within(currentMediaActions).getByRole('button', {
      name: 'Move image media 1 earlier',
    })
  ).toBeDisabled();
  expect(
    within(currentMediaActions).getByRole('button', {
      name: 'Move image media 1 later',
    })
  ).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: 'image media 2' }));

  expect(screen.getByText('Media 2 of 6')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'image media 2' })).toHaveAttribute(
    'aria-current',
    'true'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Remove image media 2' }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Delete image?')).toBeInTheDocument();
  expect(screen.getByText('Media 2 of 6')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));

  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(screen.getByText('Media 2 of 5')).toBeInTheDocument();
});

test('StoryMapMediaEditorPoc: hides carousel affordances for one media item', async () => {
  await render(
    <StoryMapMediaEditorPoc
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [INITIAL_CHAPTER.mediaItems[0]],
      }}
    />
  );

  expect(screen.queryByLabelText('Media navigation')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Reorder media')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add media' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Crop image media 1' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Remove image media 1' })
  ).toBeInTheDocument();
});

test('StoryMapMediaEditorPoc: omits an empty action separator for one embedded item', async () => {
  await render(
    <StoryMapMediaEditorPoc
      initialChapter={{
        ...INITIAL_CHAPTER,
        mediaItems: [INITIAL_CHAPTER.mediaItems[5]],
      }}
    />
  );

  const removeButton = screen.getByRole('button', {
    name: 'Remove embedded media 1',
  });

  expect(removeButton.parentElement).toHaveStyle({
    borderLeft: '',
    paddingLeft: 0,
  });
});
