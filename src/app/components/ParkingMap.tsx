'use client';

import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Circle, Tooltip } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';

const ParkingMap = () => {
  const [lots, setLots] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/congestion')
      .then((res) => res.json())
      .then((data) => setLots(data))
      .catch((err) => console.error(err));
  }, []);

  const bounds: LatLngBoundsExpression = [
    [0, 0],
    [1000, 1000],
  ];

  const getColor = (level: string) => {
    switch (level) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  return (
    <MapContainer
      center={[500, 500]}
      zoom={-1}
      crs={L.CRS.Simple}
      style={{ height: '100vh', width: '100%' }}
    >
      <ImageOverlay url="/parking-map.png" bounds={bounds} />

      {lots.map((lot) => (
        <Circle
          key={lot._id}
          center={lot.coords}
          radius={40}
          color={getColor(lot.congestion)}
          fillOpacity={0.6}
        >
          <Tooltip>{`${lot.name} — ${lot.congestion.toUpperCase()}`}</Tooltip>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default ParkingMap;
