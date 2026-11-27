/*
 * Copyright © 2025 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import {
  createContext,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { DataEntryNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { useSelector } from 'terraso-web-client/terrasoApi/store';

import { VisualizationContext } from 'terraso-web-client/sharedData/visualization/visualizationContext';
import {
  readDataSetFile,
  readMapFile,
} from 'terraso-web-client/sharedData/visualization/visualizationUtils';
import {
  mapLayerFileRejectionMessage,
  useMapLayerWindowDrop,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/mapLayerFileDrop';
import {
  MapLayerConfig,
  VisualizationConfigForm,
} from 'terraso-web-client/storyMap/storyMapTypes';

import { MAP_DATA_ACCEPTED_EXTENSIONS } from 'terraso-web-client/config';

import theme from 'terraso-web-client/theme';

/**
 * Source/layer id of the preview layer for the map layer being created. The
 * preview stack is ABOVE every other layer while a creation is in progress —
 * handled INTERNALLY by the map stage (`MapLayerPreview`), so hosts implement
 * no preview-on-top protocol at all.
 */
export const MAP_LAYER_CREATE_PREVIEW_ID = 'map-layer-create-preview';

/**
 * Parsed file state of the create session (`readMapFile`/`readDataSetFile`
 * result plus the DataEntryNode it was read for).
 */
export type MapLayerFileContext = {
  selectedFile?: DataEntryNode;
} & Record<string, unknown>;

export type MapLayerCreateSession = {
  /**
   * Session identity and lifecycle — ONE owned unit. A session runs from
   * `startCreateFlow` (file picked or dropped) until the layer is created
   * (`handleCreateLayer`) or the creation is cancelled (`cancelCreate`).
   * `creating` is derived from the session identity, never stored apart.
   */
  creating: boolean;
  /** Unique id per session (0 = no session). Async fences compare it. */
  sessionId: number;
  /** The file that started the current session. */
  file: File | undefined;
  /** True while the create mutation is in flight. */
  saving: boolean;
  /** Starts a NEW session with `file`: EVERYTHING below is recreated fresh. */
  startCreateFlow: (file: File) => void;
  /** Ends the current session: nothing is committed, the host UI stays. */
  cancelCreate: () => void;
  /** Commits the created layer (host `onCreateLayer`) and ends the session. */
  handleCreateLayer: (mapLayerConfig: MapLayerConfig) => void;
  /**
   * Session fence for async completions: callbacks (file reads, uploads,
   * create mutations) captured under one session must check this before
   * touching anything — a completion that lands after the session ended is
   * ignored, it can never write into a later session.
   */
  isCurrentSession: (sessionId: number) => boolean;

  // Session-scoped state. All of it lives INSIDE the session (recreated by
  // `startCreateFlow`) so nothing can leak from a previous session: no
  // ghost previews, stale headers, stale parse errors or burned camera fits.
  visualizationConfig: VisualizationConfigForm;
  setVisualizationConfig: (
    update: SetStateAction<VisualizationConfigForm>
  ) => void;
  fileContext: MapLayerFileContext | undefined;
  loadingFile: boolean;
  loadingFileError: unknown;
  isMapFile: boolean | undefined;
  getDataColumns: () => unknown;

  // Window-wide drop guard (host renders the affordance from these).
  dropError: string | null;
  dismissDropError: () => void;
  /** Offers a rejected file to the flow (reports the localized rejection). */
  rejectFile: (file: File) => void;
  dragActive: boolean;
};

const MapLayerCreateSessionContext =
  createContext<MapLayerCreateSession | null>(null);

/**
 * Session state access for create-flow components (steps, preview, upload).
 * Returns null when no create flow is hosted (e.g. a plain map host).
 */
export const useMapLayerCreateSession = () =>
  useContext(MapLayerCreateSessionContext);

const createInitialVisualizationConfig = (): VisualizationConfigForm => ({
  selectedFile: undefined as DataEntryNode | undefined,
  visualizeConfig: {
    shape: 'circle',
    size: 15,
    color: theme.palette.visualization.markerDefaultColor,
    opacity: 50,
  },
  annotateConfig: {
    dataPoints: [],
  },
});

type SessionState = {
  sessionId: number;
  file: File;
  visualizationConfig: VisualizationConfigForm;
  fileContext: MapLayerFileContext | undefined;
  loadingFile: boolean;
  loadingFileError: unknown;
};

type MapLayerCreateFlowOptions = {
  /** Gates the window-wide drop guard (e.g. the host dialog is open). */
  enabled: boolean;
  /** Host commit of a created layer (immediate-commit contract). */
  onCreateLayer: (mapLayerConfig: MapLayerConfig) => void;
};

/**
 * THE create-session owner. Everything a create session touches lives in the
 * session state object created by `startCreateFlow` — starting a new session
 * recreates it wholesale and ending the session drops it, so no state can
 * survive across sessions. Async completions are fenced by `isCurrentSession`
 * (and by per-session bound setters), so a late completion of an old session
 * can never write into the current one.
 */
export const useMapLayerCreateFlow = ({
  enabled,
  onCreateLayer,
}: MapLayerCreateFlowOptions): MapLayerCreateSession => {
  const { t } = useTranslation();

  const [session, setSession] = useState<SessionState | null>(null);
  // Mirror for async fences (readable after unmount / from stale closures).
  const sessionRef = useRef<SessionState | null>(null);
  const nextSessionIdRef = useRef(0);
  const [dropError, setDropError] = useState<string | null>(null);

  const commitSession = useCallback((next: SessionState | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  // Ending the host (e.g. dialog close) ends the session: nothing lingers.
  useEffect(() => {
    return () => {
      sessionRef.current = null;
    };
  }, []);

  // The host being disabled (dialog closed) also ends the session: an
  // uncommitted creation is discarded, never resurrected on reopen.
  useEffect(() => {
    if (!enabled) {
      commitSession(null);
    }
  }, [enabled, commitSession]);

  const sessionId = session?.sessionId ?? 0;

  const isCurrentSession = useCallback(
    (candidate: number) =>
      sessionRef.current !== null && sessionRef.current.sessionId === candidate,
    []
  );

  const startCreateFlow = useCallback(
    (file: File) => {
      setDropError(null);
      nextSessionIdRef.current += 1;
      commitSession({
        sessionId: nextSessionIdRef.current,
        file,
        visualizationConfig: createInitialVisualizationConfig(),
        fileContext: undefined,
        loadingFile: false,
        loadingFileError: undefined,
      });
    },
    [commitSession]
  );

  const cancelCreate = useCallback(() => {
    commitSession(null);
  }, [commitSession]);

  const handleCreateLayer = useCallback(
    (mapLayerConfig: MapLayerConfig) => {
      onCreateLayer(mapLayerConfig);
      // The created layer is committed: end the create session and return to
      // the layers panel.
      commitSession(null);
    },
    [onCreateLayer, commitSession]
  );

  // Bound to the session that was current when it was created: a stale
  // closure (e.g. an upload completion of a cancelled session) can only ever
  // address ITS OWN session and is dropped by the fence.
  const setVisualizationConfig = useCallback(
    (update: SetStateAction<VisualizationConfigForm>) => {
      setSession(current => {
        if (!current || current.sessionId !== sessionId) {
          return current;
        }
        const visualizationConfig =
          typeof update === 'function'
            ? update(current.visualizationConfig)
            : update;
        return { ...current, visualizationConfig };
      });
    },
    [sessionId]
  );

  const selectedFile = session?.visualizationConfig.selectedFile;

  // Parse the session's uploaded file (once per selected file), fenced by the
  // session id: results of an old session are dropped, never surfaced on a
  // new one.
  useEffect(() => {
    if (!sessionId || !selectedFile) {
      return;
    }
    const isMap = _.includes(
      selectedFile.resourceType,
      MAP_DATA_ACCEPTED_EXTENSIONS
    );
    setSession(current =>
      current?.sessionId === sessionId
        ? {
            ...current,
            fileContext: undefined,
            loadingFile: true,
            loadingFileError: undefined,
          }
        : current
    );
    (isMap ? readMapFile(selectedFile) : readDataSetFile(selectedFile))
      .then(fileContext => {
        setSession(current =>
          current?.sessionId === sessionId
            ? {
                ...current,
                fileContext: { ...fileContext, selectedFile },
                loadingFile: false,
              }
            : current
        );
      })
      .catch(error => {
        setSession(current =>
          current?.sessionId === sessionId
            ? { ...current, loadingFileError: error, loadingFile: false }
            : current
        );
      });
  }, [sessionId, selectedFile]);

  const isMapFile = useMemo(
    () =>
      selectedFile
        ? _.includes(selectedFile.resourceType, MAP_DATA_ACCEPTED_EXTENSIONS)
        : undefined,
    [selectedFile]
  );

  const fileContext = session?.fileContext;
  const getDataColumns = useCallback(() => {
    const dataColumns = (
      session?.visualizationConfig as
        | {
            datasetConfig?: {
              dataColumns?: { option: string; selectedColumns: unknown };
            };
          }
        | undefined
    )?.datasetConfig?.dataColumns;
    return dataColumns?.option === 'all'
      ? fileContext?.headers
      : dataColumns?.selectedColumns;
  }, [session?.visualizationConfig, fileContext]);

  const saving = useSelector(
    (state: any) => state.storyMap?.dataLayers?.saving ?? false
  ) as boolean;

  const dismissDropError = useCallback(() => setDropError(null), []);
  const onRejectFile = useCallback(
    (file: File) => {
      setDropError(mapLayerFileRejectionMessage(file, t));
    },
    [t]
  );

  const creating = session !== null;

  // While the host is enabled, the whole window accepts file drops to start
  // the create flow. Drops are ignored while a creation is in progress (no
  // file swap mid-form); the drag affordance still reports so the host can
  // explain why.
  const dragActive = useMapLayerWindowDrop({
    enabled,
    suspended: creating,
    onFile: startCreateFlow,
    onReject: onRejectFile,
  });

  return {
    creating,
    sessionId,
    file: session?.file,
    saving,
    startCreateFlow,
    cancelCreate,
    handleCreateLayer,
    isCurrentSession,
    visualizationConfig:
      session?.visualizationConfig ?? createInitialVisualizationConfig(),
    setVisualizationConfig,
    fileContext,
    loadingFile: session?.loadingFile ?? false,
    loadingFileError: session?.loadingFileError,
    isMapFile,
    getDataColumns,
    dropError,
    dismissDropError,
    rejectFile: onRejectFile,
    dragActive,
  };
};

type MapLayerCreateSessionProviderProps = {
  /** The session owned by the host (from `useMapLayerCreateFlow`). */
  session: MapLayerCreateSession;
  children: ReactNode;
};

/**
 * Provides the create session to the create-flow components. Also bridges the
 * session state into the legacy visualization context so shared form widgets
 * (ColumnSelect, useVisualizeForm, …) work unchanged — the bridge is a pure
 * projection of the session, it owns no state of its own.
 */
export const MapLayerCreateSessionProvider = ({
  session,
  children,
}: MapLayerCreateSessionProviderProps) => {
  const visualizationContextValue = useMemo(
    () => ({
      visualizationConfig: session.visualizationConfig,
      setVisualizationConfig: session.setVisualizationConfig,
      fileContext: session.fileContext ?? {},
      loadingFile: session.loadingFile,
      loadingFileError: session.loadingFileError,
      getDataColumns: session.getDataColumns,
      useTileset: false,
      geoJsonUrl: null,
      isMapFile: session.isMapFile,
      clear: session.cancelCreate,
    }),
    [session]
  );

  return (
    <MapLayerCreateSessionContext.Provider value={session}>
      <VisualizationContext.Provider value={visualizationContextValue}>
        {children}
      </VisualizationContext.Provider>
    </MapLayerCreateSessionContext.Provider>
  );
};
