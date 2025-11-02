import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const coalMines = [
  // Jharkhand
  { id: 1, name: 'Jharia, Dhanbad', position: [23.75, 86.42] },
  { id: 2, name: 'Bokaro', position: [23.78, 85.82] },
  { id: 3, name: 'Jayanti', position: [23.7, 86.6] },
  { id: 4, name: 'Godda', position: [24.83, 87.21] },
  { id: 5, name: 'Giridih (Karbhari Coal Field)', position: [24.18, 86.3] },
  { id: 6, name: 'Ramgarh', position: [23.63, 85.51] },
  { id: 7, name: 'Karanpura', position: [23.7, 85.25] },
  { id: 8, name: 'Daltonganj', position: [24.03, 84.07] },

  // West Bengal
  { id: 9, name: 'Raniganj Coalfield', position: [23.6, 87.12] },
  { id: 10, name: 'Dalingkot (Darjeeling)', position: [27.05, 88.6] },
  { id: 11, name: 'Birbhum', position: [23.9, 87.6] },
  { id: 12, name: 'Chinakuri', position: [23.6, 86.8] },

  // Chhattisgarh
  { id: 13, name: 'Korba', position: [22.35, 82.68] },
  { id: 14, name: 'Bishrampur', position: [23.18, 83.18] },
  { id: 15, name: 'Sonhat', position: [23.5, 82.5] },
  { id: 16, name: 'Jhilmil', position: [23.3, 83.2] },
  { id: 17, name: 'Hasdo-Arand', position: [22.8, 82.8] },

  // Odisha
  { id: 18, name: 'Jharsuguda', position: [21.85, 84.03] },
  { id: 19, name: 'Himgiri', position: [22.0, 83.7] },
  { id: 20, name: 'Rampur', position: [20.7, 83.9] },
  { id: 21, name: 'Talcher', position: [20.95, 85.22] },

  // Telangana/Andhra Pradesh
  { id: 22, name: 'Singareni', position: [17.5, 80.3] },
  { id: 23, name: 'Kothagudem', position: [17.55, 80.63] },
  { id: 24, name: 'Kantapalli', position: [17.4, 81.9] },

  // Tamil Nadu
  { id: 25, name: 'Neyveli', position: [11.53, 79.48] },

  // Maharashtra
  { id: 26, name: 'Kamptee (Nagpur)', position: [21.25, 79.18] },
  { id: 27, name: 'Wun field', position: [20.0, 79.0] },
  { id: 28, name: 'Wardha', position: [20.74, 78.6] },
  { id: 29, name: 'Ghughus', position: [19.93, 79.13] },
  { id: 30, name: 'Warora', position: [20.23, 79.0] },

  // Assam
  { id: 31, name: 'Ledo', position: [27.29, 95.73] },
  { id: 32, name: 'Makum', position: [27.3, 95.7] },
  { id: 33, name: 'Najira', position: [26.9, 94.7] },
  { id: 34, name: 'Janji', position: [26.7, 94.3] },
  { id: 35, name: 'Jaipur', position: [27.2, 95.5] },

  // Meghalaya
  { id: 36, name: 'Darrangiri (Garo hills)', position: [25.5, 90.7] },
  { id: 37, name: 'Cherrapunji', position: [25.3, 91.7] },
  { id: 38, name: 'Liotryngew', position: [25.3, 91.7] },
  { id: 39, name: 'Maolong', position: [25.2, 91.7] },
  { id: 40, name: 'Langrin coalfields (Khasi & Jaintia Hills)', position: [25.3, 91.6] },

  // Madhya Pradesh
  { id: 41, name: 'Singrauli', position: [24.2, 82.67] },
  { id: 42, name: 'Sohagpur', position: [23.3, 78.2] },
  { id: 43, name: 'Johila', position: [23.3, 81.0] },
  { id: 44, name: 'Umaria', position: [23.5, 80.8] },
  { id: 45, name: 'Satpura coalfield', position: [22.2, 78.1] },
];

const CoalMinesMap: React.FC = () => {
  return (
    <div className="w-full h-96">
      <MapContainer center={[22, 83]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coalMines.map(mine => (
          <Marker key={mine.id} position={mine.position as [number, number]}>
            <Popup>
              {mine.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CoalMinesMap;
