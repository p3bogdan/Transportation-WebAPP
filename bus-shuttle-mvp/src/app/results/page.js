import React, { useEffect, useState } from "react";
import RouteList from "../../components/RouteList";
import { useSearchParams } from "next/navigation";

export default function ResultsPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        let filtered = data.routes || [];
        const origin = searchParams.get("origin")?.toLowerCase() || "";
        const destination = searchParams.get("destination")?.toLowerCase() || "";
        const date = searchParams.get("date") || "";
        if (origin) filtered = filtered.filter(r => r.origin.toLowerCase().includes(origin));
        if (destination) filtered = filtered.filter(r => r.destination.toLowerCase().includes(destination));
        if (date) filtered = filtered.filter(r => r.date === date);
        setRoutes(filtered);
        setLoading(false);
      });
  }, [searchParams]);

  return (
    <main style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingTop: 40 }}>
        <h2 style={{ color: "#1746d3", fontSize: 28, marginBottom: 24 }}>Available Routes</h2>
        {/* Filters placeholder */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ marginRight: 16 }}>
            <input type="checkbox" /> Cheapest
          </label>
          <label style={{ marginRight: 16 }}>
            <input type="checkbox" /> Fastest
          </label>
        </div>
        {loading ? <div>Loading...</div> : <RouteList routes={routes} />}
      </div>
    </main>
  );
}
