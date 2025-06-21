import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useState, useEffect } from "react";
import { Tooltip } from "@/components/ui/tooltip";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json";

export interface AttackPoint {
  id: string;
  coordinates: [number, number];
  country: string;
  city: string;
  ip: string;
  attackType: string;
  severity: string;
  timestamp: Date;
  lastSeen: Date;
  count: number;
}

interface WorldMapProps {
  attacks: AttackPoint[];
  onMarkerClick?: (attack: AttackPoint) => void;
  className?: string;
}

export function WorldMap({ attacks, onMarkerClick, className = "" }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState("");
  const [hoveredAttack, setHoveredAttack] = useState<AttackPoint | null>(null);

  const getMarkerSize = (count: number) => {
    if (count > 50) return 12;
    if (count > 20) return 10;
    if (count > 10) return 8;
    if (count > 5) return 6;
    return 4;
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const handleMarkerMouseEnter = (attack: AttackPoint) => {
    setHoveredAttack(attack);
    setTooltipContent(`
      ${attack.city}, ${attack.country}
      IP: ${attack.ip}
      Attack: ${attack.attackType}
      Count: ${attack.count}
      Severity: ${attack.severity}
    `);
  };

  const handleMarkerMouseLeave = () => {
    setHoveredAttack(null);
    setTooltipContent("");
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 20],
        }}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a1f2e"
                  stroke="#374151"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#253447" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          
          {attacks.map((attack) => (
            <Marker
              key={attack.id}
              coordinates={attack.coordinates}
              onClick={() => onMarkerClick?.(attack)}
              onMouseEnter={() => handleMarkerMouseEnter(attack)}
              onMouseLeave={handleMarkerMouseLeave}
              className="cursor-pointer"
            >
              <circle
                r={getMarkerSize(attack.count)}
                fill={getMarkerColor(attack.severity)}
                stroke="#ffffff"
                strokeWidth={1}
                opacity={0.8}
                style={{
                  filter: hoveredAttack?.id === attack.id ? "brightness(1.3)" : "none",
                }}
              />
              {attack.count > 1 && (
                <text
                  textAnchor="middle"
                  y={-getMarkerSize(attack.count) - 3}
                  style={{
                    fontFamily: "system-ui",
                    fontSize: "10px",
                    fill: "#ffffff",
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {attack.count}
                </text>
              )}
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {hoveredAttack && (
        <div
          className="absolute z-10 bg-surface border border-gray-700 rounded-lg p-3 text-sm text-white shadow-lg pointer-events-none"
          style={{
            left: "50%",
            top: "10px",
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold text-primary">{hoveredAttack.city}, {hoveredAttack.country}</div>
          <div className="text-text-secondary">IP: {hoveredAttack.ip}</div>
          <div className="text-text-secondary">Type: {hoveredAttack.attackType}</div>
          <div className="text-text-secondary">Attacks: {hoveredAttack.count}</div>
          <div className={`font-medium ${
            hoveredAttack.severity === 'critical' ? 'text-destructive' : 
            hoveredAttack.severity === 'high' ? 'text-warning' : 
            hoveredAttack.severity === 'medium' ? 'text-primary' : 'text-success'
          }`}>
            Severity: {hoveredAttack.severity.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}