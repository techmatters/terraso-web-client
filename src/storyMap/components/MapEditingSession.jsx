/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { useMap } from 'terraso-web-client/gis/components/Map';
import MapGeocoder from 'terraso-web-client/gis/components/MapGeocoder';
import { StoryMapLayer } from 'terraso-web-client/storyMap/components/StoryMapLayer';
import { recordContentRegionBounds } from 'terraso-web-client/storyMap/mapUtils';
import { getTransition } from 'terraso-web-client/storyMap/storyMapUtils';

/**
 * THE map editing session: the single owner of everything that turns map
 * interaction into story map config writes while the map is being
 * positioned (the Configure Chapter sidebar is open).
 *
 * It owns:
 *  - the CAMERA RECORDER: records the user's camera onto the active step
 *    (immediate apply — the editor's draft autosave persists it);
 *  - ATTRIBUTION: which `moveend`s are the user's camera at all;
 *  - the WRITE TARGET: the step being edited, pinned at gesture start;
 *  - the FIT CHANNEL: `requestFitBounds(layerId)` fits the map to a layer's
 *    bounds, one fit per request (the layer stack below consumes the
 *    request token exactly once).
 *
 * ATTRIBUTION MODEL — recording by GESTURE PRESENCE (not by "absence of a
 * programmatic flag"): a `moveend` is the user's camera if and only if it
 * terminates a real gesture, or it is a geocoder result (deliberate user
 * intent, recorded explicitly — the geocoder flies the map without any
 * pointer gesture). Everything else — step transitions, layer bounds fits,
 * rotation — is programmatic BY CONSTRUCTION and never recorded. The older
 * "programmatic move counter" model attributed by absence and silently
 * corrupted saved locations: map controls and the geocoder live OUTSIDE the
 * canvas container (mapbox only re-fires canvas events), so their moves
 * were dropped or mistaken for user drags.
 *
 * A gesture starts on `dragstart`/`mousedown`/`touchstart`/`keydown`, both
 * as map events (canvas) and as DOM events on the map CONTAINER (controls
 * included). It is "armed" until the map actually moves ("moving" on
 * `movestart`/`move`); a press that moves nothing (a plain click) is
 * disarmed again on `mouseup`/`touchend`/`keyup`, so a stale press can never
 * mis-attribute a later programmatic move. `wheel`/`dblclick` gestures are
 * TRANSIENT: mapbox starts their zoom synchronously, so on the next tick a
 * gesture that has not moved the map is disarmed again — a wheel over the
 * story (scroll-zoom is disabled while configuring) must never make a later
 * programmatic move look like a user's camera.
 */
export const MapEditingSession = ({
  active,
  config,
  targetId,
  onPositionChange,
  onFitLayerBounds,
  layers,
  onLayerAdded,
}) => {
  const { map } = useMap();
  // Fit channel state: `seq` advances on every request so the same layer can
  // be re-fitted (toggle on → off → on) and each request fits EXACTLY once.
  const [fitRequest, setFitRequest] = useState(null);

  // Latest config/target for event handlers (they close over renders).
  const configRef = useRef(config);
  configRef.current = config;
  const liveTargetRef = useRef(targetId);
  liveTargetRef.current = targetId;
  // The write target of the gesture in progress — pinned at gesture start so
  // a scroll-spy retarget mid-drag can never redirect the write.
  const pinnedTargetRef = useRef(targetId);
  // null | 'armed' (gesture started, map has not moved) | 'moving'
  const gestureRef = useRef(null);
  // A pending deliberate record without a gesture (geocoder result).
  const recordIntentRef = useRef(false);

  const recordCamera = useCallback(
    id => {
      if (!map) {
        return;
      }
      const transition = getTransition({ config: configRef.current, id });
      // Plain scalars only: mapbox class instances (LngLat, LngLatBounds)
      // are never deep-equal to their serialized selves and churn every
      // consumer that compares them.
      const center = map.getCenter();
      onPositionChange(
        {
          center: { lng: center.lng, lat: center.lat },
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          // NOT the raw camera bounds: the content region of the map
          // container (see recordContentRegionBounds), so playback — which
          // expands the recorded bounds again to compensate for the chapter
          // card — reproduces exactly what was framed here.
          bounds: recordContentRegionBounds(map, transition?.alignment),
        },
        id
      );
    },
    [map, onPositionChange]
  );

  useEffect(() => {
    if (!map || !active) {
      return;
    }

    const startGesture = () => {
      if (gestureRef.current !== 'moving') {
        gestureRef.current = 'armed';
      }
      pinnedTargetRef.current = liveTargetRef.current;
    };
    const markMoved = () => {
      if (gestureRef.current === 'armed') {
        gestureRef.current = 'moving';
      }
    };
    const endGesture = () => {
      // A press that produced no map movement is not a camera edit; disarm
      // so a later programmatic move cannot be attributed to it.
      if (gestureRef.current === 'armed') {
        gestureRef.current = null;
      }
    };
    const startTransientGesture = () => {
      startGesture();
      // mapbox starts the wheel/dblclick zoom synchronously: if the map has
      // not moved by the end of this event, the gesture produced no camera
      // change (e.g. the wheel over the story while scroll-zoom is disabled)
      // — disarm so it cannot claim a later programmatic move.
      queueMicrotask(endGesture);
    };
    const onMoveEnd = () => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      const recordIntent = recordIntentRef.current;
      recordIntentRef.current = false;
      if (!gesture && !recordIntent) {
        return;
      }
      recordCamera(pinnedTargetRef.current ?? liveTargetRef.current);
    };

    // Gesture starts: map events cover the canvas, container DOM events
    // cover the map controls and the geocoder (mapbox binds those outside
    // `getCanvasContainer()`, where its map events never fire).
    const mapGestureEvents = [
      'dragstart',
      'mousedown',
      'touchstart',
      'keydown',
    ];
    mapGestureEvents.forEach(event => map.on(event, startGesture));
    const mapTransientGestureEvents = ['wheel', 'dblclick'];
    mapTransientGestureEvents.forEach(event =>
      map.on(event, startTransientGesture)
    );
    map.on('movestart', markMoved);
    map.on('move', markMoved);
    map.on('moveend', onMoveEnd);

    const container = map.getContainer?.();
    const domGestureEvents = ['mousedown', 'touchstart', 'keydown'];
    domGestureEvents.forEach(event =>
      container?.addEventListener(event, startGesture, true)
    );
    const domTransientGestureEvents = ['wheel', 'dblclick'];
    domTransientGestureEvents.forEach(event =>
      container?.addEventListener(event, startTransientGesture, true)
    );
    const domGestureEndEvents = ['mouseup', 'touchend', 'keyup'];
    domGestureEndEvents.forEach(event =>
      container?.addEventListener(event, endGesture, true)
    );

    return () => {
      mapGestureEvents.forEach(event => map.off(event, startGesture));
      mapTransientGestureEvents.forEach(event =>
        map.off(event, startTransientGesture)
      );
      map.off('movestart', markMoved);
      map.off('move', markMoved);
      map.off('moveend', onMoveEnd);
      domGestureEvents.forEach(event =>
        container?.removeEventListener(event, startGesture, true)
      );
      domTransientGestureEvents.forEach(event =>
        container?.removeEventListener(event, startTransientGesture, true)
      );
      domGestureEndEvents.forEach(event =>
        container?.removeEventListener(event, endGesture, true)
      );
    };
  }, [map, active, recordCamera]);

  // A geocoder result IS user intent ("go there"), even though the map move
  // it causes is programmatic: record the camera it lands on.
  const onGeocoderResult = useCallback(() => {
    recordIntentRef.current = true;
    pinnedTargetRef.current = liveTargetRef.current;
  }, []);

  /**
   * FIT CHANNEL requester: fits the map to a layer's bounds. ONE fit per
   * request — the layer stack consumes the request token exactly once (see
   * the `changeBounds` prop below and VisualizationMapLayer), and the fit's
   * own `moveend`s are never recorded (they terminate no gesture).
   */
  const requestFitBounds = useCallback(layerId => {
    setFitRequest(current => ({ layerId, seq: (current?.seq ?? 0) + 1 }));
  }, []);

  // Hand the fit-layer-bounds requester to the host while this session
  // owns it, so the configure sidebar's `onFitLayerBounds` reaches the one
  // owner of the fit channel (the host gets null on teardown).
  useEffect(() => {
    onFitLayerBounds?.(requestFitBounds);
    return () => onFitLayerBounds?.(null);
  }, [onFitLayerBounds, requestFitBounds]);

  return (
    <>
      {active && (
        <MapGeocoder position="top-right" onResult={onGeocoderResult} />
      )}
      {(layers ?? []).map(dataLayerConfig => (
        <StoryMapLayer
          key={dataLayerConfig.id}
          config={dataLayerConfig}
          changeBounds={
            active && fitRequest?.layerId === dataLayerConfig.id
              ? fitRequest.seq
              : false
          }
          useConfigBounds
          opacity={0}
          onLayerAdded={onLayerAdded}
        />
      ))}
    </>
  );
};

export default MapEditingSession;
