import { act, fireEvent, render, screen } from 'tests/utils';

import { useParams } from 'react-router-dom';

import * as visualizationMarkers from 'sharedData/visualization/visualizationMarkers';
import * as terrasoApi from 'terrasoBackend/api';

import LandscapeSharedDataVisualization from './LandscapeSharedDataVisualization';

jest.mock('terrasoBackend/api');

jest.mock('sharedData/visualization/visualizationMarkers');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const TEST_CSV = `
col1,col2,col_longitude,col3,col4
val1,val2,10,30,val4
val11,val21,10,30,val41
val12,val22,10,30,val42
`.trim();

const setup = async () => {
  await render(<LandscapeSharedDataVisualization />, {
    account: {
      currentUser: {
        data: {
          email: 'email@example.com',
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  });
};

beforeEach(() => {
  global.fetch = jest.fn();
});

test('LandscapeSharedDataVisualization: Display visualization', async () => {
  useParams.mockReturnValue({
    groupSlug: 'slug-1',
    configSlug: 'config-slug',
  });
  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    landscapes: {
      edges: [
        {
          node: {
            defaultGroup: {
              edges: [
                {
                  node: {
                    group: { id: '6a625efb-4ec8-45e8-ad6a-eb052cc3fe65' },
                  },
                },
              ],
            },
            description: 'dsadsad',
            id: 'e9a65bef-4ef1-4058-bba3-fc73b53eb779',
            location: 'CM',
            name: 'José Landscape Deafult Test 4',
            slug: 'jose-landscape-deafult-test-4',
            website: '',
          },
        },
      ],
    },
  });
  terrasoApi.requestGraphQL.mockResolvedValueOnce({
    visualizationConfigs: {
      edges: [
        {
          node: {
            title: 'Test Title',
            configuration: JSON.stringify({
              datasetConfig: {
                dataColumns: {
                  option: 'custom',
                  selectedColumns: ['col1', 'col4'],
                },
                longitude: 'col_longitude',
                latitude: 'col3',
              },
              visualizeConfig: {
                shape: 'triangle',
                size: '30',
                color: '#A96F14',
              },
              annotateConfig: {
                annotationTitle: 'col4',
                dataPoints: [{ column: 'col1', label: 'Custom Label' }],
              },
              viewportConfig: {
                bounds: {
                  northEast: {
                    lat: 11.325606896067784,
                    lng: -67.62077603784013,
                  },
                  southWest: {
                    lat: 8.263885173441716,
                    lng: -76.29042998100137,
                  },
                },
              },
            }),
            createdAt: '2022-09-16T18:03:40.653296+00:00',
            createdBy: {
              id: 'dc695d00-d6b4-45b2-ab8d-f48206d998da',
              lastName: 'Buitrón',
              firstName: 'José',
            },
            dataEntry: {
              id: '1ccb0208-a693-4ee1-9d29-cd099e28bf72',
              name: 'BD_ANEI',
              description: '',
              resourceType: 'xlsx',
            },
            id: 'a9f5587b-35a2-4d43-9acf-dc9a7919f1e4',
          },
        },
      ],
    },
  });
  global.fetch.mockResolvedValueOnce({
    status: 200,
    arrayBuffer: () => {
      const file = new File([TEST_CSV], `test.csv`, { type: 'text/plain' });
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onerror = function onerror(ev) {
          reject(ev.target.error);
        };

        reader.onload = function onload(ev) {
          resolve(ev.target.result);
        };

        reader.readAsArrayBuffer(file);
      });
    },
  });
  visualizationMarkers.getImageData.mockReturnValue('markerImageData');

  await setup();
  await screen.findByRole('button', { name: 'Download PNG' });
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(2);
  expect(global.fetch).toHaveBeenCalledTimes(1);

  expect(
    screen.getByRole('heading', { name: 'Test Title' })
  ).toBeInTheDocument();

  // Markers
  expect(screen.getByRole('button', { name: 'val4' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'val41' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'val42' })).toBeInTheDocument();

  // Popup
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'val41' }))
  );
  expect(screen.getByRole('heading', { name: 'val41' })).toBeInTheDocument();
  expect(screen.getByText(/Custom Label/i)).toBeInTheDocument();
  expect(screen.getByText(/val11/i)).toBeInTheDocument();
});
