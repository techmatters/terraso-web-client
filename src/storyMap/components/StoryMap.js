// <!DOCTYPE html>
// <html>
// <head>
//     <meta charset='utf-8' />
//     <title>Mapbox Storytelling</title>
//     <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
//     <link rel="icon" type="image/x-icon" href="https://raw.githubusercontent.com/mapbox/assembly/publisher-staging/src/svgs/mapbox.svg">
//     <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.js'></script>
//     <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.css' rel='stylesheet' />
//     <script src="https://unpkg.com/intersection-observer@0.12.0/intersection-observer.js"></script>
//     <script src="https://unpkg.com/scrollama"></script>
//     <style>
//         body {
//             margin:0;
//             padding:0;
//             font-family: sans-serif;
//         }
//         a, a:hover, a:visited {
//             color: #0071bc;
//         }
//         #map {
//             top:0;
//             height: 100vh;
//             width:100vw;
//             position: fixed;
//         }
//         #mapInset {
//             bottom:50px;
//             right:30px;
//             height: 180px;
//             width:250px;
//             max-width:100%;
//             position: fixed;
//             z-index: 1;
//             opacity: 1;
//             transition: opacity 0.5s ease-in-out;
//             pointer-events: none;
//         }
//         #mapInset .mapboxgl-ctrl-bottom-left{
//             display: none;
//         }
//         @media (max-width: 500px) {
//             #mapInset {
//                 display: none;
//             }
//         }
//         #header {
//             margin: auto;
//             width: 100%;
//             position: relative;
//             z-index: 5;
//         }
//         #header h1, #header h2, #header p {
//             margin: 0;
//             padding: 2vh 2vw;
//             text-align: center;
//         }
//         #footer {
//             width: 100%;
//             min-height: 5vh;
//             padding-top: 2vh;
//             padding-bottom: 2vh;
//             text-align: center;
//             line-height: 25px;
//             font-size: 13px;
//             position: relative;
//             z-index: 5;
//         }
//         #features {
//             padding-top: 10vh;
//             padding-bottom: 10vh;
//         }
//         .hidden {
//             visibility: hidden;
//         }
//         .centered {
//             width: 50vw;
//             margin: 0 auto;
//         }
//         .lefty {
//             width: 33vw;
//             margin-left: 5vw;
//         }
//         .righty {
//             width: 33vw;
//             margin-left: 62vw;
//         }
//         .fully {
//             width: 100%;
//             margin: auto;
//         }
//         .light {
//             color: #444;
//             background-color: #fafafa;
//         }
//         .dark {
//             color: #fafafa;
//             background-color: #444;
//         }
//         .step {
//             padding-bottom: 50vh;
//             /* margin-bottom: 10vh; */
//             opacity: 0.25;
//         }
//         .step.active {
//             opacity: 0.9;
//         }
//         .step div {
//             padding:  25px 50px;
//             line-height: 25px;
//             font-size: 13px;
//         }
//         .step img {
//             width: 100%;
//         }
//         @media (max-width: 750px) {
//             .centered, .lefty, .righty, .fully {
//                 width: 90vw;
//                 margin: 0 auto;
//             }
//         }
//         /* Fix issue on mobile browser where scroll breaks  */
//         .mapboxgl-canvas-container.mapboxgl-touch-zoom-rotate.mapboxgl-touch-drag-pan,
//         .mapboxgl-canvas-container.mapboxgl-touch-zoom-rotate.mapboxgl-touch-drag-pan .mapboxgl-canvas {
//             touch-action: unset;
//         }
//         </style>
// </head>
// <body>
// <div id="map"></div>
// <div id="mapInset"></div>
// <div id="story"></div>
// <script src="./config.js"></script>
// <script>
// var initLoad = true;
// var layerTypes = {
//     'fill': ['fill-opacity'],
//     'line': ['line-opacity'],
//     'circle': ['circle-opacity', 'circle-stroke-opacity'],
//     'symbol': ['icon-opacity', 'text-opacity'],
//     'raster': ['raster-opacity'],
//     'fill-extrusion': ['fill-extrusion-opacity'],
//     'heatmap': ['heatmap-opacity']
// }
// var alignments = {
//     'left': 'lefty',
//     'center': 'centered',
//     'right': 'righty',
//     'full': 'fully'
// }
// function getLayerPaintType(layer) {
//     var layerType = map.getLayer(layer).type;
//     return layerTypes[layerType];
// }
// function setLayerOpacity(layer) {
//     var paintProps = getLayerPaintType(layer.layer);
//     paintProps.forEach(function(prop) {
//         var options = {};
//         if (layer.duration) {
//             var transitionProp = prop + "-transition";
//             options = { "duration": layer.duration };
//             map.setPaintProperty(layer.layer, transitionProp, options);
//         }
//         map.setPaintProperty(layer.layer, prop, layer.opacity, options);
//     });
// }
// var story = document.getElementById('story');
// var features = document.createElement('div');
// features.setAttribute('id', 'features');
// var header = document.createElement('div');
// if (config.title) {
//     var titleText = document.createElement('h1');
//     titleText.innerText = config.title;
//     header.appendChild(titleText);
// }
// if (config.subtitle) {
//     var subtitleText = document.createElement('h2');
//     subtitleText.innerText = config.subtitle;
//     header.appendChild(subtitleText);
// }
// if (config.byline) {
//     var bylineText = document.createElement('p');
//     bylineText.innerText = config.byline;
//     header.appendChild(bylineText);
// }
// if (header.innerText.length > 0) {
//     header.classList.add(config.theme);
//     header.setAttribute('id', 'header');
//     story.appendChild(header);
// }
// config.chapters.forEach((record, idx) => {
//     var container = document.createElement('div');
//     var chapter = document.createElement('div');
//     if (record.title) {
//         var title = document.createElement('h3');
//         title.innerText = record.title;
//         chapter.appendChild(title);
//     }
//     if (record.image) {
//         var image = new Image();
//         image.src = record.image;
//         chapter.appendChild(image);
//     }
//     if (record.description) {
//         var story = document.createElement('p');
//         story.innerHTML = record.description;
//         chapter.appendChild(story);
//     }
//     container.setAttribute('id', record.id);
//     container.classList.add('step');
//     if (idx === 0) {
//         container.classList.add('active');
//     }
//     chapter.classList.add(config.theme);
//     container.appendChild(chapter);
//     container.classList.add(alignments[record.alignment] || 'centered');
//     if (record.hidden) {
//         container.classList.add('hidden');
//     }
//     features.appendChild(container);
// });
// story.appendChild(features);
// var footer = document.createElement('div');
// if (config.footer) {
//     var footerText = document.createElement('p');
//     footerText.innerHTML = config.footer;
//     footer.appendChild(footerText);
// }
// if (footer.innerText.length > 0) {
//     footer.classList.add(config.theme);
//     footer.setAttribute('id', 'footer');
//     story.appendChild(footer);
// }
// mapboxgl.accessToken = config.accessToken;
// const transformRequest = (url) => {
//     const hasQuery = url.indexOf("?") !== -1;
//     const suffix = hasQuery ? "&pluginName=scrollytellingV2" : "?pluginName=scrollytellingV2";
//     return {
//       url: url + suffix
//     }
// }
// var map = new mapboxgl.Map({
//     container: 'map',
//     style: config.style,
//     center: config.chapters[0].location.center,
//     zoom: config.chapters[0].location.zoom,
//     bearing: config.chapters[0].location.bearing,
//     pitch: config.chapters[0].location.pitch,
//     interactive: false,
//     transformRequest: transformRequest,
//     projection: config.projection
// });
// // Create a inset map if enabled in config.js
// if (config.inset) {
//  var insetMap = new mapboxgl.Map({
//     container: 'mapInset', // container id
//     style: 'mapbox://styles/mapbox/dark-v10', //hosted style id
//     center: config.chapters[0].location.center,
//     // Hardcode above center value if you want insetMap to be static.
//     zoom: 3, // starting zoom
//     hash: false,
//     interactive: false,
//     attributionControl: false,
//     //Future: Once official mapbox-gl-js has globe view enabled,
//     //insetmap can be a globe with the following parameter.
//     //projection: 'globe'
//   });
// }
// if (config.showMarkers) {
//     var marker = new mapboxgl.Marker({ color: config.markerColor });
//     marker.setLngLat(config.chapters[0].location.center).addTo(map);
// }
// // instantiate the scrollama
// var scroller = scrollama();
// map.on("load", function() {
//     if (config.use3dTerrain) {
//         map.addSource('mapbox-dem', {
//             'type': 'raster-dem',
//             'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
//             'tileSize': 512,
//             'maxzoom': 14
//         });
//         // add the DEM source as a terrain layer with exaggerated height
//         map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
//         // add a sky layer that will show when the map is highly pitched
//         map.addLayer({
//             'id': 'sky',
//             'type': 'sky',
//             'paint': {
//                 'sky-type': 'atmosphere',
//                 'sky-atmosphere-sun': [0.0, 0.0],
//                 'sky-atmosphere-sun-intensity': 15
//             }
//         });
//     };
//     // As the map moves, grab and update bounds in inset map.
//     if (config.inset) {
//     map.on('move', getInsetBounds);
//     }
//     // setup the instance, pass callback functions
//     scroller
//     .setup({
//         step: '.step',
//         offset: 0.5,
//         progress: true
//     })
//     .onStepEnter(async response => {
//         var current_chapter = config.chapters.findIndex(chap => chap.id === response.element.id);
//         var chapter = config.chapters[current_chapter];
//         response.element.classList.add('active');
//         map[chapter.mapAnimation || 'flyTo'](chapter.location);
//         // Incase you do not want to have a dynamic inset map,
//         // rather want to keep it a static view but still change the
//         // bbox as main map move: comment out the below if section.
//         if (config.inset) {
//           if (chapter.location.zoom < 5) {
//             insetMap.flyTo({center: chapter.location.center, zoom: 0});
//           }
//           else {
//             insetMap.flyTo({center: chapter.location.center, zoom: 3});
//           }
//         }
//         if (config.showMarkers) {
//             marker.setLngLat(chapter.location.center);
//         }
//         if (chapter.onChapterEnter.length > 0) {
//             chapter.onChapterEnter.forEach(setLayerOpacity);
//         }
//         if (chapter.callback) {
//             window[chapter.callback]();
//         }
//         if (chapter.rotateAnimation) {
//             map.once('moveend', () => {
//                 const rotateNumber = map.getBearing();
//                 map.rotateTo(rotateNumber + 180, {
//                     duration: 30000, easing: function (t) {
//                         return t;
//                     }
//                 });
//             });
//         }
//         if (config.auto) {
//              var next_chapter = (current_chapter + 1) % config.chapters.length;
//              map.once('moveend', () => {
//                  document.querySelectorAll('[data-scrollama-index="' + next_chapter.toString() + '"]')[0].scrollIntoView();
//              });
//         }
//     })
//     .onStepExit(response => {
//         var chapter = config.chapters.find(chap => chap.id === response.element.id);
//         response.element.classList.remove('active');
//         if (chapter.onChapterExit.length > 0) {
//             chapter.onChapterExit.forEach(setLayerOpacity);
//         }
//     });
//     if (config.auto) {
//         document.querySelectorAll('[data-scrollama-index="0"]')[0].scrollIntoView();
//     }
// });
// //Helper functions for insetmap
// function getInsetBounds() {
//             let bounds = map.getBounds();
//             let boundsJson = {
//                 "type": "FeatureCollection",
//                 "features": [{
//                     "type": "Feature",
//                     "properties": {},
//                     "geometry": {
//                         "type": "Polygon",
//                         "coordinates": [
//                             [
//                                 [
//                                     bounds._sw.lng,
//                                     bounds._sw.lat
//                                 ],
//                                 [
//                                     bounds._ne.lng,
//                                     bounds._sw.lat
//                                 ],
//                                 [
//                                     bounds._ne.lng,
//                                     bounds._ne.lat
//                                 ],
//                                 [
//                                     bounds._sw.lng,
//                                     bounds._ne.lat
//                                 ],
//                                 [
//                                     bounds._sw.lng,
//                                     bounds._sw.lat
//                                 ]
//                             ]
//                         ]
//                     }
//                 }]
//             }
//             if (initLoad) {
//                 addInsetLayer(boundsJson);
//                 initLoad = false;
//             } else {
//                 updateInsetLayer(boundsJson);
//             }
//         }
// function addInsetLayer(bounds) {
//     insetMap.addSource('boundsSource', {
//         'type': 'geojson',
//         'data': bounds
//     });
//     insetMap.addLayer({
//         'id': 'boundsLayer',
//         'type': 'fill',
//         'source': 'boundsSource', // reference the data source
//         'layout': {},
//         'paint': {
//             'fill-color': '#fff', // blue color fill
//             'fill-opacity': 0.2
//         }
//     });
//     // // Add a black outline around the polygon.
//     insetMap.addLayer({
//         'id': 'outlineLayer',
//         'type': 'line',
//         'source': 'boundsSource',
//         'layout': {},
//         'paint': {
//             'line-color': '#000',
//             'line-width': 1
//         }
//     });
// }
// function updateInsetLayer(bounds) {
//     insetMap.getSource('boundsSource').setData(bounds);
// }
// // setup resize event
// window.addEventListener('resize', scroller.resize);
// </script>
// </body>
// </html>
// Base on the HTLM code above, I want to create a React component with the same functionality
import React, { useCallback, useEffect } from 'react';

// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from '!mapbox-gl';
import scrollama from 'scrollama';

import './StoryMap.css';

import { MAPBOX_ACCESS_TOKEN } from 'config';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

var layerTypes = {
  fill: ['fill-opacity'],
  line: ['line-opacity'],
  circle: ['circle-opacity', 'circle-stroke-opacity'],
  symbol: ['icon-opacity', 'text-opacity'],
  raster: ['raster-opacity'],
  'fill-extrusion': ['fill-extrusion-opacity'],
  heatmap: ['heatmap-opacity'],
};

var alignments = {
  left: 'lefty',
  center: 'centered',
  right: 'righty',
  full: 'fully',
};

const transformRequest = url => {
  const hasQuery = url.indexOf('?') !== -1;
  const suffix = hasQuery
    ? '&pluginName=scrollytellingV2'
    : '?pluginName=scrollytellingV2';
  return {
    url: url + suffix,
  };
};

function Chapter({ theme, record }) {
  const classList = [
    'step',
    alignments[record.alignment] || 'centered',
    ...(record.hidden ? ['hidden'] : []),
  ].join(' ');
  return (
    <div id={record.id} className={classList}>
      <div className={theme}>
        {record.title && <h3 className="title">{record.title}</h3>}
        {record.mage && <img src={record.image} alt={record.title}></img>}
        {record.description && <p>{record.description}</p>}
      </div>
    </div>
  );
}

const StoryMap = props => {
  const { config } = props;
  const mapContainer = React.useRef(null);
  // const mapInsetContainer = React.useRef(null);
  const [map, setMap] = React.useState(null);
  // const [insetMap, setInsetMap] = React.useState(null);
  // const [marker, setMarker] = React.useState(null);
  // const [scroller, setScroller] = React.useState(null);
  // const [currentChapter, setCurrentChapter] = React.useState(
  //   config.chapters[0]
  // );
  // const [initLoad, setInitLoad] = React.useState(true);

  // console.log({ setCurrentChapter });

  const getLayerPaintType = useCallback(
    layer => {
      var layerType = map.getLayer(layer).type;
      return layerTypes[layerType];
    },
    [map]
  );

  const setLayerOpacity = useCallback(
    layer => {
      var paintProps = getLayerPaintType(layer.layer);
      paintProps.forEach(function (prop) {
        var options = {};
        if (layer.duration) {
          var transitionProp = prop + '-transition';
          options = { duration: layer.duration };
          map.setPaintProperty(layer.layer, transitionProp, options);
        }
        map.setPaintProperty(layer.layer, prop, layer.opacity, options);
      });
    },
    [map, getLayerPaintType]
  );

  useEffect(() => {
    var map = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style,
      center: config.chapters[0].location.center,
      zoom: config.chapters[0].location.zoom,
      bearing: config.chapters[0].location.bearing,
      pitch: config.chapters[0].location.pitch,
      interactive: false,
      transformRequest: transformRequest,
      projection: config.projection,
    });
    map.on('load', function () {
      if (config.use3dTerrain) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        // add the DEM source as a terrain layer with exaggerated height
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }
      setMap(map);

      // As the map moves, grab and update bounds in inset map.
      // if (config.inset) {
      //   map.on('move', getInsetBounds);
      // }
    });
  }, [config]);

  useEffect(() => {
    if (!map) return;

    const scroller = scrollama();
    scroller
      .setup({
        step: '.step',
        offset: 0.5,
        progress: true,
      })
      .onStepEnter(async response => {
        var current_chapter = config.chapters.findIndex(
          chap => chap.id === response.element.id
        );
        var chapter = config.chapters[current_chapter];

        response.element.classList.add('active');
        map[chapter.mapAnimation || 'flyTo'](chapter.location);

        // Incase you do not want to have a dynamic inset map,
        // rather want to keep it a static view but still change the
        // bbox as main map move: comment out the below if section.
        // if (config.inset) {
        //   if (chapter.location.zoom < 5) {
        //     insetMap.flyTo({center: chapter.location.center, zoom: 0});
        //   }
        //   else {
        //     insetMap.flyTo({center: chapter.location.center, zoom: 3});
        //   }
        // }
        // if (config.showMarkers) {
        //     marker.setLngLat(chapter.location.center);
        // }
        if (chapter.onChapterEnter.length > 0) {
          chapter.onChapterEnter.forEach(setLayerOpacity);
        }
        if (chapter.callback) {
          window[chapter.callback]();
        }
        if (chapter.rotateAnimation) {
          map.once('moveend', () => {
            const rotateNumber = map.getBearing();
            map.rotateTo(rotateNumber + 180, {
              duration: 30000,
              easing: t => t,
            });
          });
        }
        if (config.auto) {
          var next_chapter = (current_chapter + 1) % config.chapters.length;
          map.once('moveend', () => {
            document
              .querySelectorAll(
                '[data-scrollama-index="' + next_chapter.toString() + '"]'
              )[0]
              .scrollIntoView();
          });
        }
      })
      .onStepExit(response => {
        var chapter = config.chapters.find(
          chap => chap.id === response.element.id
        );
        response.element.classList.remove('active');
        if (chapter.onChapterExit.length > 0) {
          chapter.onChapterExit.forEach(setLayerOpacity);
        }
      });
    window.addEventListener('resize', scroller.resize);
  }, [map, setLayerOpacity, config.chapters, config.auto]);

  return (
    <>
      <div>
        <div
          id="map"
          ref={mapContainer}
          className="absolute top right left bottom"
        />
        <div id="story">
          {config.title && (
            <div id="header" className={config.theme}>
              <h1>{config.title}</h1>
              {config.subtitle && <h2>{config.subtitle}</h2>}
              {config.byline && <p>{config.byline}</p>}
            </div>
          )}
          <div id="features" className={alignments[config.alignment]}>
            {config.chapters.map(chapter => (
              <Chapter key={chapter.id} theme={config.theme} record={chapter} />
            ))}
          </div>
          {config.footer && (
            <div id="footer" className={config.theme}>
              <p>{config.footer}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StoryMap;
