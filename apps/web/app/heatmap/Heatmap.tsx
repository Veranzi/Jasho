"use client";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleOrdinal } from "d3-scale";

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const jobCategories = ["tech", "finance", "health", "education", "agriculture"];
const color = scaleOrdinal()
  .domain(jobCategories)
  .range(["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"]);

// In a real app this mapping comes from API
const countryToJob: Record<string, string> = {
  Kenya: "agriculture",
  Uganda: "agriculture",
  "United States of America": "tech",
  India: "tech",
  Germany: "finance",
  Canada: "education",
};

export default function Heatmap() {
  return (
    <div className="card">
      <h3>Jobs Heatmap</h3>
      <ComposableMap projectionConfig={{ scale: 150 }}>
        <Geographies geography={geoUrl}>
          {(args: any) =>
            args.geographies.map((geo: any) => {
              const name = geo.properties.name as string;
              const cat = countryToJob[name] || "health"; // default
              return (
                <Geography key={geo.rsmKey} geography={geo} fill={color(cat)} stroke="#0b0f17" />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {jobCategories.map((j) => (
          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: color(j) }} />
            <span>{j}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
