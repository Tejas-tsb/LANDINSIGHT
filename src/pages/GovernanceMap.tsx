import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer } from 'leaflet';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { useData } from '../lib/dataContext';
import { useSelectedClusterData } from '../lib/clusterExplorerContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import { CLUSTER_CONFIG, INDICATOR_METADATA } from '../lib/constants';
import { toTitleCase } from '../lib/utils';
import { EnrichedStateData } from '../types/data';
import { getStateForGeoJsonName } from '../lib/geoStateMapping';
import { ExternalLink } from 'lucide-react';
import { formatGovernancePercent, formatServiceAvailability } from '../lib/governanceDisplay';
import { Link } from 'react-router-dom';

const MAP_CENTER: [number, number] = [22.5, 82.5];
const MAP_ZOOM = 4.4;

// Component to handle map view reset
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function GovernanceMap() {
  const { isLoading, error, reload } = useData();
  const selected = useSelectedClusterData();
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  const [activeState, setActiveState] = useState<EnrichedStateData | null>(null);
  const [filterCluster, setFilterCluster] = useState<'all' | number>('all');
  const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);
  useEffect(() => { setFilterCluster('all'); }, [selected.selectedId]);


  // Load GeoJSON boundaries
  useEffect(() => {
    fetch('/data/india_states.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json: FeatureCollection) => {
        setGeoData(json);
        setGeoLoading(false);
      })
      .catch((err: Error) => {
        console.error('Failed to load India GeoJSON:', err);
        setGeoError(err.message);
        setGeoLoading(false);
      });
  }, []);

  // Quick lookup map: State_UT uppercase -> EnrichedStateData
  const stateLookup = useMemo(() => {
    if (!selected.config) return new Map<string, EnrichedStateData>();
    const map = new Map<string, EnrichedStateData>();
    selected.enrichedStates.forEach((s) => {
      map.set(s.State_UT.trim().toUpperCase(), s);
    });
    return map;
  }, [selected.enrichedStates, selected.config]);

  // Set default active state on initial data load
  useEffect(() => {
    if (selected.enrichedStates.length > 0) {
      setActiveState((current) => selected.enrichedStates.find((state) => state.State_UT === current?.State_UT) ?? selected.enrichedStates[0]);
    }
  }, [selected.selectedId, selected.enrichedStates]);

  if (isLoading || selected.isExplorerLoading || geoLoading) {
    return <LoadingState message="Rendering interactive geospatial intelligence map..." />;
  }

  if (error || selected.explorerError || geoError || !selected.config || !geoData) {
    return (
      <ErrorState
        title="Failed to load geospatial data"
        message={error || selected.explorerError || geoError || 'Missing geospatial map files.'}
        onRetry={reload}
      />
    );
  }

  // Polygon styling function
  const styleFeature = (feature?: Feature<Geometry, { ST_NM: string }>) => {
    if (!feature || !feature.properties) {
      return { fillColor: '#94A3B8', weight: 1, color: '#FFFFFF', fillOpacity: 0.7 };
    }

    const geoName = feature.properties.ST_NM;
    const stateObj = getStateForGeoJsonName(geoName, stateLookup);

    if (!stateObj) {
      return {
        fillColor: '#94a3b8',
        weight: 1,
        color: '#ffffff',
        fillOpacity: 0.3,
      };
    }

    // Filter check
    if (filterCluster !== 'all' && stateObj.Cluster !== filterCluster) {
      return {
        fillColor: '#CBD5E1',
        weight: 0.8,
        color: '#FFFFFF',
        fillOpacity: 0.15,
      };
    }

    const clusterColor = CLUSTER_CONFIG[stateObj.Cluster as keyof typeof CLUSTER_CONFIG]?.color || '#4A7FB5';
    const isSelected = activeState?.State_UT === stateObj.State_UT;
    const isHovered = hoveredStateName === stateObj.State_UT;

    return {
      fillColor: clusterColor,
      weight: isSelected ? 2.5 : isHovered ? 2 : 1,
      color: isSelected ? '#1E293B' : isHovered ? '#0F172A' : '#FFFFFF',
      fillOpacity: isSelected ? 0.9 : isHovered ? 0.85 : 0.75,
    };
  };

  // Interaction handlers for each State/UT polygon
  const onEachFeature = (feature: Feature<Geometry, { ST_NM: string }>, layer: Layer) => {
    const geoName = feature.properties.ST_NM;
    const stateObj = getStateForGeoJsonName(geoName, stateLookup);

    if (stateObj) {
      const clusterConfig = CLUSTER_CONFIG[stateObj.Cluster as keyof typeof CLUSTER_CONFIG];
      const mapDig = formatGovernancePercent(stateObj.Map_Digitization_Pct);
      const rorComp = formatGovernancePercent(stateObj.RoR_Computerization_Pct);

      // Bind hover tooltip
      layer.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="display: block; font-size: 12px; margin-bottom: 2px;">${toTitleCase(stateObj.State_UT)}</strong>
          <span style="color: ${clusterConfig.color}; font-weight: 600;">${clusterConfig.displayName}</span><br/>
          <span>Map Digitization: <b>${mapDig}</b></span><br/>
          <span>RoR Computerization: <b>${rorComp}</b></span>
        </div>
        `,
        { sticky: true, className: 'custom-map-tooltip' }
      );

      layer.on({
        mouseover: () => {
          setHoveredStateName(stateObj.State_UT);
        },
        mouseout: () => {
          setHoveredStateName(null);
        },
        click: () => {
          setActiveState(stateObj);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <p className="page-subtitle">
            State boundaries colored by {selected.config.model} (K={selected.config.k}) cluster assignments.
          </p>
        </div>
        {/* Cluster Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Show:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterCluster('all')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filterCluster === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]'
              }`}
            >
              All ({selected.enrichedStates.length})
            </button>
            {selected.profiles.map((profile) => (
              <button key={profile.Cluster} onClick={() => setFilterCluster(profile.Cluster)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${filterCluster === profile.Cluster ? 'bg-blue-600 text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]'}`}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG].color }} />
                Cluster {profile.Cluster} ({profile.State_UT_Count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map + Side Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 card overflow-hidden relative" style={{ height: '620px' }}>
          {/* Map Controls / Legend Overlay */}
          <div className="absolute top-4 right-4 z-[1000] bg-[var(--color-surface)]/95 backdrop-blur-sm p-3 rounded-lg border border-[var(--color-border)] shadow-md text-xs space-y-2 pointer-events-auto">
            <span className="font-semibold text-[var(--color-text-primary)] block border-b border-[var(--color-border)] pb-1">
              Cluster Legend
            </span>
            <div className="space-y-1.5">
              {selected.profiles.map((profile) => {
                const color = CLUSTER_CONFIG[profile.Cluster as keyof typeof CLUSTER_CONFIG].color;
                return <div key={profile.Cluster} className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: color }} /><span className="text-[var(--color-text-secondary)] font-medium">Cluster {profile.Cluster} ({profile.State_UT_Count} States/UTs, {profile.Cluster_Percentage.toFixed(1)}%)</span></div>;
              })}
            </div>
            <p className="text-[10px] text-[var(--color-text-tertiary)] pt-1 border-t border-[var(--color-border)]">
              Click any state polygon to inspect details.
            </p>
          </div>

          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            minZoom={3.8}
            maxZoom={8}
            style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-surface-secondary)' }}
            scrollWheelZoom={true}
          >
            <MapController center={MAP_CENTER} zoom={MAP_ZOOM} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={`https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
            />
            {geoData && (
              <GeoJSON
                key={`geojson-${selected.selectedId}-${filterCluster}`}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        </div>

        {/* Selected State Side Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {activeState ? (
            <div className="card h-full flex flex-col">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {toTitleCase(activeState.State_UT)}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {activeState.Total_Districts !== null ? `${activeState.Total_Districts} Districts` : 'Districts N/A'} ·{' '}
                    {activeState.Total_Villages !== null ? `${activeState.Total_Villages.toLocaleString()} Villages` : 'Villages N/A'}
                  </p>
                </div>
                <ClusterBadge cluster={activeState.Cluster} size="md" />
              </div>

              <div className="card-body flex-1 overflow-y-auto space-y-4">
                {/* Quick Indicators */}
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider block">
                    Core Digitization Progress
                  </span>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">Cadastral Map Digitization</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {formatGovernancePercent(activeState.Map_Digitization_Pct)}
                      </span>
                    </div>
                    {activeState.Map_Digitization_Pct !== null && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(activeState.Map_Digitization_Pct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">Map-RoR Linkage</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {formatGovernancePercent(activeState.Map_RoR_Linkage_Pct)}
                      </span>
                    </div>
                    {activeState.Map_RoR_Linkage_Pct !== null && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(activeState.Map_RoR_Linkage_Pct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">RoR Computerization</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {formatGovernancePercent(activeState.RoR_Computerization_Pct)}
                      </span>
                    </div>
                    {activeState.RoR_Computerization_Pct !== null && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(activeState.RoR_Computerization_Pct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">Land Parcel ULPIN Coverage</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {formatGovernancePercent(activeState.Land_Parcel_ULPIN_Pct)}
                      </span>
                    </div>
                    {activeState.Land_Parcel_ULPIN_Pct !== null && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(activeState.Land_Parcel_ULPIN_Pct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">Modern Record Room (MRR)</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {formatGovernancePercent(activeState.MRR_Completion_Pct_Total)}
                      </span>
                    </div>
                    {activeState.MRR_Completion_Pct_Total !== null && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(activeState.MRR_Completion_Pct_Total, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Binary Services Adoption Status */}
                <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider block">
                    Digital Citizen Services
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">RoR Download</span>
                      <span className={`font-semibold ${activeState.Online_RoR_Download === 1 ? 'text-emerald-600' : 'text-[var(--color-text-tertiary)] italic'}`}>
                        {formatServiceAvailability(activeState.Online_RoR_Download)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">Signed RoR</span>
                      <span className={`font-semibold ${activeState.Digitally_Signed_RoR === 1 ? 'text-emerald-600' : 'text-[var(--color-text-tertiary)] italic'}`}>
                        {formatServiceAvailability(activeState.Digitally_Signed_RoR)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">Online Mutation</span>
                      <span className={`font-semibold ${activeState.Online_Mutation_Application === 1 ? 'text-emerald-600' : 'text-[var(--color-text-tertiary)] italic'}`}>
                        {formatServiceAvailability(activeState.Online_Mutation_Application)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">Auto Mutation</span>
                      <span className={`font-semibold ${activeState.Auto_Triggered_Mutation === 1 ? 'text-emerald-600' : 'text-[var(--color-text-tertiary)] italic'}`}>
                        {formatServiceAvailability(activeState.Auto_Triggered_Mutation)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <Link
                  to="/explorer"
                  className="w-full btn-primary justify-center text-xs"
                >
                  Open in State Explorer <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-xs text-[var(--color-text-tertiary)]">
              Click on any State or UT polygon to inspect its land governance profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
