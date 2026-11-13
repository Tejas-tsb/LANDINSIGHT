import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { GeoJSON as LeafletGeoJSON, Layer, LeafletMouseEvent } from 'leaflet';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { useData } from '../lib/dataContext';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ClusterBadge } from '../components/ui/ClusterBadge';
import { CLUSTER_CONFIG, INDICATOR_METADATA } from '../lib/constants';
import { toTitleCase, formatPercent } from '../lib/utils';
import { EnrichedStateData } from '../types/data';
import {
  Map as MapIcon,
  Layers,
  Info,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Explicit dictionary mapping GeoJSON ST_NM property to CSV State_UT identifier.
 */
const GEOJSON_TO_CSV_NAME: Record<string, string> = {
  'Andaman & Nicobar': 'ANDAMAN & NICOBAR ISLANDS',
  'Andhra Pradesh': 'ANDHRA PRADESH',
  'Arunachal Pradesh': 'ARUNACHAL PRADESH',
  'Assam': 'ASSAM',
  'Bihar': 'BIHAR',
  'Chandigarh': 'CHANDIGARH',
  'Chhattisgarh': 'CHHATTISGARH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'Delhi': 'DELHI',
  'Goa': 'GOA',
  'Gujarat': 'GUJARAT',
  'Haryana': 'HARYANA',
  'Himachal Pradesh': 'HIMACHAL PRADESH',
  'Jammu & Kashmir': 'JAMMU & KASHMIR',
  'Jharkhand': 'JHARKHAND',
  'Karnataka': 'KARNATAKA',
  'Kerala': 'KERALA',
  'Ladakh': 'LADAKH',
  'Lakshadweep': 'LAKSHADWEEP',
  'Madhya Pradesh': 'MADHYA PRADESH',
  'Maharashtra': 'MAHARASHTRA',
  'Manipur': 'MANIPUR',
  'Meghalaya': 'MEGHALAYA',
  'Mizoram': 'MIZORAM',
  'Nagaland': 'NAGALAND',
  'Odisha': 'ODISHA',
  'Puducherry': 'PUDUCHERRY',
  'Punjab': 'PUNJAB',
  'Rajasthan': 'RAJASTHAN',
  'Sikkim': 'SIKKIM',
  'Tamil Nadu': 'TAMIL NADU',
  'Telangana': 'TELANGANA',
  'Tripura': 'TRIPURA',
  'Uttar Pradesh': 'UTTAR PRADESH',
  'Uttarakhand': 'UTTARAKHAND',
  'West Bengal': 'WEST BENGAL',
};

// Component to handle map view reset
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function GovernanceMap() {
  const { data, isLoading, error, reload } = useData();
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  const [activeState, setActiveState] = useState<EnrichedStateData | null>(null);
  const [filterCluster, setFilterCluster] = useState<'all' | 0 | 1>('all');
  const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);

  const mapCenter: [number, number] = [22.5, 82.5];
  const mapZoom = 4.4;

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
    if (!data) return new Map<string, EnrichedStateData>();
    const map = new Map<string, EnrichedStateData>();
    data.enrichedStates.forEach((s) => {
      map.set(s.State_UT.trim().toUpperCase(), s);
    });
    return map;
  }, [data]);

  // Set default active state on initial data load
  useEffect(() => {
    if (data && !activeState && data.enrichedStates.length > 0) {
      setActiveState(data.enrichedStates[0]);
    }
  }, [data, activeState]);

  if (isLoading || geoLoading) {
    return <LoadingState message="Rendering interactive geospatial intelligence map..." />;
  }

  if (error || geoError || !data || !geoData) {
    return (
      <ErrorState
        title="Failed to load geospatial data"
        message={error || geoError || 'Missing geospatial map files.'}
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
    const csvName = GEOJSON_TO_CSV_NAME[geoName];
    const stateObj = csvName ? stateLookup.get(csvName) : undefined;

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
    const csvName = GEOJSON_TO_CSV_NAME[geoName];
    const stateObj = csvName ? stateLookup.get(csvName) : undefined;

    if (stateObj) {
      const clusterConfig = CLUSTER_CONFIG[stateObj.Cluster as keyof typeof CLUSTER_CONFIG];
      const mapDig =
        stateObj.Map_Digitization_Pct !== null
          ? `${stateObj.Map_Digitization_Pct.toFixed(1)}%`
          : 'N/A';
      const rorComp =
        stateObj.RoR_Computerization_Pct !== null
          ? `${stateObj.RoR_Computerization_Pct.toFixed(1)}%`
          : 'N/A';

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
          <h1 className="page-title">National Land Governance Map</h1>
          <p className="page-subtitle">
            Authentic State/UT boundary choropleth colored by Model C (K=2) unsupervised K-Means clusters.
          </p>
        </div>
        {/* Cluster Filter Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Show:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterCluster('all')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filterCluster === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]'
              }`}
            >
              All (36)
            </button>
            <button
              onClick={() => setFilterCluster(0)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filterCluster === 0
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: CLUSTER_CONFIG[0].color }}
              />
              Cluster 0 (7)
            </button>
            <button
              onClick={() => setFilterCluster(1)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filterCluster === 1
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: CLUSTER_CONFIG[1].color }}
              />
              Cluster 1 (29)
            </button>
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
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded"
                  style={{ backgroundColor: CLUSTER_CONFIG[0].color }}
                />
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {CLUSTER_CONFIG[0].displayName} (7 States/UTs, 19.4%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded"
                  style={{ backgroundColor: CLUSTER_CONFIG[1].color }}
                />
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {CLUSTER_CONFIG[1].displayName} (29 States/UTs, 80.6%)
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--color-text-tertiary)] pt-1 border-t border-[var(--color-border)]">
              Click any state polygon to inspect details.
            </p>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            minZoom={3.8}
            maxZoom={8}
            style={{ width: '100%', height: '100%', backgroundColor: '#F8FAFC' }}
            scrollWheelZoom={true}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            />
            {geoData && (
              <GeoJSON
                key={`geojson-${filterCluster}`}
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
                        {activeState.Map_Digitization_Pct !== null ? `${activeState.Map_Digitization_Pct.toFixed(1)}%` : 'N/A'}
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
                        {activeState.Map_RoR_Linkage_Pct !== null ? `${activeState.Map_RoR_Linkage_Pct.toFixed(1)}%` : 'N/A'}
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
                        {activeState.RoR_Computerization_Pct !== null ? `${activeState.RoR_Computerization_Pct.toFixed(1)}%` : 'N/A'}
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
                        {activeState.Land_Parcel_ULPIN_Pct !== null ? `${activeState.Land_Parcel_ULPIN_Pct.toFixed(1)}%` : 'N/A'}
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
                        {activeState.MRR_Completion_Pct_Total !== null ? `${activeState.MRR_Completion_Pct_Total.toFixed(1)}%` : 'N/A'}
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
                      <span className={`font-semibold ${activeState.Online_RoR_Download === 1 ? 'text-emerald-600' : activeState.Online_RoR_Download === 0 ? 'text-slate-400' : 'text-slate-400 italic'}`}>
                        {activeState.Online_RoR_Download === 1 ? 'Available' : activeState.Online_RoR_Download === 0 ? 'Unavailable' : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">Signed RoR</span>
                      <span className={`font-semibold ${activeState.Digitally_Signed_RoR === 1 ? 'text-emerald-600' : activeState.Digitally_Signed_RoR === 0 ? 'text-slate-400' : 'text-slate-400 italic'}`}>
                        {activeState.Digitally_Signed_RoR === 1 ? 'Available' : activeState.Digitally_Signed_RoR === 0 ? 'Unavailable' : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">Online Mutation</span>
                      <span className={`font-semibold ${activeState.Online_Mutation_Application === 1 ? 'text-emerald-600' : activeState.Online_Mutation_Application === 0 ? 'text-slate-400' : 'text-slate-400 italic'}`}>
                        {activeState.Online_Mutation_Application === 1 ? 'Available' : activeState.Online_Mutation_Application === 0 ? 'Unavailable' : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] block">Auto Mutation</span>
                      <span className={`font-semibold ${activeState.Auto_Triggered_Mutation === 1 ? 'text-emerald-600' : activeState.Auto_Triggered_Mutation === 0 ? 'text-slate-400' : 'text-slate-400 italic'}`}>
                        {activeState.Auto_Triggered_Mutation === 1 ? 'Available' : activeState.Auto_Triggered_Mutation === 0 ? 'Unavailable' : 'N/A'}
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
