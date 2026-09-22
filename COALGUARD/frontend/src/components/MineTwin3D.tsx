import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Box, Sphere, Cylinder, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MineTwin3DProps {
  sensors: any[];
  onSelectSensor: (sensor: any) => void;
  selectedSensorId: string | null;
}

const SensorMarker = ({ sensor, isSelected, onClick }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = (sensor.elevation || 2) + Math.sin(state.clock.elapsedTime * 2 + (sensor.id?.length || 1)) * 0.4 + 2;
    }
  });

  const getColor = () => {
    if (sensor.status === 'CRITICAL' || (sensor.value >= (sensor.threshold_critical || 9999))) return '#ef4444';
    if (sensor.status === 'WARNING' || (sensor.value >= (sensor.threshold_warning || 9999))) return '#f97316';
    if (sensor.status === 'OFFLINE') return '#64748b';
    return '#22c55e'; // Normal
  };

  const isAnomalous = sensor.status === 'CRITICAL' || sensor.value >= (sensor.threshold_warning || 9999);

  let x = 0;
  let z = 0;

  if (sensor.latitude !== undefined && sensor.longitude !== undefined) {
    x = ((sensor.longitude % 1) * 100 - 50) * 0.8;
    z = ((sensor.latitude % 1) * 100 - 50) * 0.8;
  } else {
    const hash = String(sensor.id || '').split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    x = (hash % 100) / 2.5 - 20;
    z = ((hash / 100) % 100) / 2.5 - 20;
  }

  return (
    <group position={[x, 0, z]}>
      {/* Connection line to ground */}
      <Cylinder args={[0.06, 0.06, (sensor.elevation || 2) + 2]} position={[0, ((sensor.elevation || 2) + 2) / 2, 0]}>
        <meshStandardMaterial color={getColor()} opacity={0.4} transparent />
      </Cylinder>

      {/* Sensor body */}
      <Sphere
        ref={meshRef}
        args={[isSelected ? 1.4 : hovered ? 1.2 : 0.9, 32, 32]}
        onClick={(e) => { e.stopPropagation(); onClick(sensor); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={getColor()} emissive={getColor()} emissiveIntensity={isAnomalous ? 1.8 : 0.6} roughness={0.2} metalness={0.8} />
        {isAnomalous && (
          <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-red-500/30 text-red-300 text-[10px] font-black px-2 py-1 rounded-lg border border-red-500/60 backdrop-blur whitespace-nowrap animate-pulse shadow-lg shadow-red-950/50">
              ⚠️ {sensor.sensor_type} ({sensor.value} {sensor.unit})
            </div>
          </Html>
        )}
        {(hovered || isSelected) && !isAnomalous && (
          <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border backdrop-blur whitespace-nowrap shadow-md ${isSelected ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900/90 text-slate-200 border-slate-700'}`}>
              {sensor.sensor_name}: {sensor.value} {sensor.unit}
            </div>
          </Html>
        )}
      </Sphere>

      {/* Pulsing ring for anomalies */}
      {isAnomalous && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 3.5, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

const DustPlume = ({ showPlume }: { showPlume: boolean }) => {
  const plumeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (plumeRef.current) {
      plumeRef.current.position.y = 4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
      plumeRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  if (!showPlume) return null;

  return (
    <group ref={plumeRef} position={[10, 4, -5]}>
      <Sphere args={[4, 16, 16]}>
        <meshStandardMaterial color="#d97706" opacity={0.25} transparent roughness={1} />
      </Sphere>
      <Sphere args={[6, 16, 16]} position={[2, 2, 2]}>
        <meshStandardMaterial color="#b45309" opacity={0.15} transparent roughness={1} />
      </Sphere>
      <Html position={[0, 7, 0]} center>
        <div className="bg-amber-950/80 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/40 whitespace-nowrap">
          💨 Particulate Plume Dispersal (PM10 Spike)
        </div>
      </Html>
    </group>
  );
};

const Terrain = ({ showZones }: { showZones: boolean }) => {
  return (
    <group>
      {/* Base Grid Plane */}
      <Plane args={[120, 120, 64, 64]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <meshStandardMaterial color="#0f172a" wireframe={true} transparent opacity={0.25} />
      </Plane>

      {/* Open Pit Terraces */}
      <Cylinder args={[18, 12, 6, 32]} position={[10, -5, -5]}>
        <meshStandardMaterial color={showZones ? '#451a03' : '#1e293b'} />
      </Cylinder>
      <Cylinder args={[24, 18, 4, 32]} position={[10, -2, -5]}>
        <meshStandardMaterial color={showZones ? '#78350f' : '#1e293b'} opacity={0.8} transparent />
      </Cylinder>

      {/* Haul Road Ramp */}
      <Box args={[30, 0.5, 4]} position={[0, -1, 5]} rotation={[0, 0.3, 0.05]}>
        <meshStandardMaterial color={showZones ? '#1e3a8a' : '#334155'} />
      </Box>

      {/* CHPP Coal Handling & Preparation Plant */}
      <Box args={[12, 5, 16]} position={[-20, 0, 10]}>
        <meshStandardMaterial color={showZones ? '#14532d' : '#334155'} />
      </Box>
      <Cylinder args={[2.5, 2.5, 10, 16]} position={[-20, 3, 4]}>
        <meshStandardMaterial color="#475569" />
      </Cylinder>
      <Cylinder args={[2.5, 2.5, 10, 16]} position={[-20, 3, 16]}>
        <meshStandardMaterial color="#475569" />
      </Cylinder>

      {/* Stockpile Area */}
      <Cylinder args={[10, 14, 5, 32]} position={[22, 0, 20]}>
        <meshStandardMaterial color="#020617" />
      </Cylinder>

      {/* 3D Zone Overlays / 3D Labels */}
      {showZones && (
        <>
          <Text position={[10, 2, -5]} rotation={[-Math.PI / 2, 0, 0]} fontSize={2} color="#f97316" anchorX="center" anchorY="middle">
            PIT ALPHA (DEEP EXCAVATION)
          </Text>
          <Text position={[-20, 6, 10]} rotation={[-Math.PI / 3, 0, 0]} fontSize={1.6} color="#22c55e" anchorX="center" anchorY="middle">
            CHPP PLANT & WASHERY
          </Text>
          <Text position={[0, 1, 5]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.4} color="#60a5fa" anchorX="center" anchorY="middle">
            MAIN HAUL ROAD RAMP 2
          </Text>
          <Text position={[22, 4, 20]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.6} color="#94a3b8" anchorX="center" anchorY="middle">
            COAL STOCKYARD
          </Text>
        </>
      )}
    </group>
  );
};

export const MineTwin3D: React.FC<MineTwin3DProps> = ({ sensors, onSelectSensor, selectedSensorId }) => {
  const [showZones, setShowZones] = useState(true);
  const [showPlume, setShowPlume] = useState(true);
  const [cameraView, setCameraView] = useState<'orbit' | 'top' | 'pit' | 'plant'>('orbit');

  const getCameraPos = (): [number, number, number] => {
    if (cameraView === 'top') return [0, 80, 0.1];
    if (cameraView === 'pit') return [10, 15, 15];
    if (cameraView === 'plant') return [-20, 15, 30];
    return [0, 35, 45]; // default orbit
  };

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-950">
      {/* HUD Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none space-y-1">
        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 tracking-widest uppercase">
          3D Mine Operational Twin
        </h3>
        <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          REAL-TIME SPATIAL SENSOR TELEMETRY MESH
        </p>
      </div>

      {/* Control HUD Overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 flex-wrap">
        <button
          onClick={() => setShowZones(!showZones)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${showZones ? 'bg-blue-600/80 text-white border-blue-400' : 'bg-slate-900/80 text-slate-400 border-slate-700'}`}
        >
          {showZones ? 'Hide Zones' : 'Show Zones'}
        </button>
        <button
          onClick={() => setShowPlume(!showPlume)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${showPlume ? 'bg-amber-600/80 text-white border-amber-400' : 'bg-slate-900/80 text-slate-400 border-slate-700'}`}
        >
          {showPlume ? 'Plume: ON' : 'Plume: OFF'}
        </button>
        <select
          value={cameraView}
          onChange={(e) => setCameraView(e.target.value as any)}
          className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="orbit">Perspective Orbit View</option>
          <option value="top">Top-Down Ortho View</option>
          <option value="pit">Focus: Open Pit Excavation</option>
          <option value="plant">Focus: CHPP Processing</option>
        </select>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: getCameraPos(), fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 30, 20]} intensity={1.8} color="#e2e8f0" castShadow />
        <pointLight position={[-15, 15, -15]} intensity={1.2} color="#60a5fa" />
        <pointLight position={[15, 10, 15]} intensity={0.8} color="#f59e0b" />

        <Terrain showZones={showZones} />
        <DustPlume showPlume={showPlume} />

        {sensors.map(sensor => (
          <SensorMarker
            key={sensor.id}
            sensor={sensor}
            isSelected={selectedSensorId === sensor.id}
            onClick={onSelectSensor}
          />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={8}
          maxDistance={120}
        />

        <fog attach="fog" args={['#020617', 35, 140]} />
      </Canvas>
    </div>
  );
};
