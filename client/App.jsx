// i am gonna cry why is this so difficult :((((()))))

// i need to separate the html and css and jsx

import { useState, useEffect, useRef } from "react";

const MOLD_TYPES = [
  { name: 'abstract mold', image: '/assets/abstract_mold.png' },
  { name: 'double mold', image: '/assets/double_mold.png' },
  { name: 'mold', image: '/assets/mold.png' },
  { name: 'pink mold', image: '/assets/pink_mold.png' },
  { name: 'speckle mold', image: '/assets/speckle_mold.png' },
  { name: 'yellow mold', image: '/assets/yellow_mold.png' },
];

export function App() {
  let [id, setId] = useState();
  let [connected, setConnected] = useState([]);
  let [socket, setSocket] = useState(null);
  
  // mold simulator state
  let [role, setRole] = useState(null); // 'controller' or 'placer'
  let [environment, setEnvironment] = useState(50);
  let [time, setTime] = useState(50);
  let [temperature, setTemperature] = useState(50);
  let [molds, setMolds] = useState([]);
  let [selectedMold, setSelectedMold] = useState(0);
  
  const canvasRef = useRef(null);
  const moldImagesRef = useRef({});
  const petriDishImageRef = useRef(null);

  // preload images
  useEffect(() => {
    // load mold images
    MOLD_TYPES.forEach((moldType, index) => {
      const img = new Image();
      img.src = moldType.image;
      moldImagesRef.current[index] = img;
    });

    // load petri dish image
    const petriImg = new Image();
    petriImg.src = '/assets/petri_dish.png';
    petriDishImageRef.current = petriImg;
  }, []);

  useEffect(() => {
    let socket = new WebSocket("ws://localhost:3000/");

    function handler({ data }) {
      let event = JSON.parse(data);

      if (event.type === "welcome") {
        setId(event.id);
        setConnected(event.connected);
      } else if (event.type === "connected") {
        setConnected(connected => [...connected, event.id]);
      } else if (event.type === "disconnected") {
        setConnected(connected => connected.filter(cid => cid !== event.id));
      } else if (event.type === "environment_update") {
        setEnvironment(event.environment);
        setTime(event.time);
        setTemperature(event.temperature);
      } else if (event.type === "mold_placed") {
        setMolds(event.molds);
      } else if (event.type === "clear_dish") {
        setMolds([]);
      }
    }

    setSocket(socket);
    socket.addEventListener("message", handler);

    return () => {
      socket.removeEventListener("message", handler);
    };
  }, []);

  // Draw molds on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw petri dish background
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(200, 200, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw molds
    molds.forEach(mold => {
      const moldType = MOLD_TYPES[mold.type];
      ctx.fillStyle = moldType.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(mold.x, mold.y, mold.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [molds]);

  const sendEnvironmentUpdate = (env, tim, temp) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'environment_update',
        environment: env,
        time: tim,
        temperature: temp,
      }));
    }
  };

  const handleEnvironmentChange = (e) => {
    const value = parseInt(e.target.value);
    setEnvironment(value);
    sendEnvironmentUpdate(value, time, temperature);
  };

  const handleTimeChange = (e) => {
    const value = parseInt(e.target.value);
    setTime(value);
    sendEnvironmentUpdate(environment, value, temperature);
  };

  const handleTemperatureChange = (e) => {
    const value = parseInt(e.target.value);
    setTemperature(value);
    sendEnvironmentUpdate(environment, time, value);
  };

  const handleCanvasClick = (e) => {
    if (role !== 'placer') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // checks if click is inside petri dish
    const centerX = 200;
    const centerY = 200;
    const radius = 190;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance > radius) return;

    // calculate mold size based on environment slider
    const baseSize = 10 + (environment / 100) * 30; // 10-40px range
    const growthFactor = 1 + (time / 100) * 2; // 1x-3x growth
    const tempEffect = 0.5 + (temperature / 100); // 0.5x-1.5x temp effect
    const size = baseSize * growthFactor * tempEffect;

    const newMold = {
      x,
      y,
      size,
      type: selectedMold,
    };

    const updatedMolds = [...molds, newMold];
    setMolds(updatedMolds);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'mold_placed',
        molds: updatedMolds,
      }));
    }
  };

  const clearDish = () => {
    setMolds([]);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'clear_dish',
      }));
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>🧫 mold culture simulator</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
        <div><strong>Your ID:</strong> {id}</div>
        <div><strong>Connected Users:</strong> {connected.join(', ')}</div>
      </div>

      {!role && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Choose Your Role:</h2>
          <button 
            onClick={() => setRole('controller')}
            style={{
              padding: '15px 30px',
              margin: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              background: '#4ade80',
              border: 'none',
              borderRadius: '8px',
              color: 'white'
            }}
          >
            🎛️ environment controller
          </button>
          <button 
            onClick={() => setRole('placer')}
            style={{
              padding: '15px 30px',
              margin: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              background: '#60a5fa',
              border: 'none',
              borderRadius: '8px',
              color: 'white'
            }}
          >
            🧪 mold placer
          </button>
        </div>
      )}

      {role && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Panel - Controls */}
          <div>
            {role === 'controller' && (
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                <h3>Environment Controls</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <strong>Environment (Mold Size)</strong>: {environment}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={environment}
                    onChange={handleEnvironmentChange}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Base size: {(10 + (environment / 100) * 30).toFixed(0)}px
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <strong>Time (Growth Factor)</strong>: {time}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={time}
                    onChange={handleTimeChange}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Growth: {(1 + (time / 100) * 2).toFixed(2)}x
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <strong>Temperature</strong>: {temperature}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={temperature}
                    onChange={handleTemperatureChange}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Effect: {(0.5 + (temperature / 100)).toFixed(2)}x
                  </div>
                </div>

                <div style={{ padding: '15px', background: '#e0f2fe', borderRadius: '6px', marginTop: '20px' }}>
                  <strong>Current Mold Size Preview:</strong>
                  <div style={{ fontSize: '24px', marginTop: '10px' }}>
                    {((10 + (environment / 100) * 30) * (1 + (time / 100) * 2) * (0.5 + (temperature / 100))).toFixed(1)}px
                  </div>
                </div>
              </div>
            )}

            {role === 'placer' && (
              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
                <h3>Mold Selection</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {MOLD_TYPES.map((mold, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMold(index)}
                      style={{
                        padding: '15px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        background: selectedMold === index ? mold.color : 'white',
                        border: `2px solid ${mold.color}`,
                        borderRadius: '8px',
                        color: selectedMold === index ? 'white' : '#333',
                        fontWeight: selectedMold === index ? 'bold' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <img 
                        src={mold.image} 
                        alt={mold.name}
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                      />
                      {mold.name}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '6px' }}>
                  <strong>Current Settings:</strong>
                  <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    Environment: {environment}% | Time: {time}% | Temp: {temperature}%
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    Mold size will be: {((10 + (environment / 100) * 30) * (1 + (time / 100) * 2) * (0.5 + (temperature / 100))).toFixed(1)}px
                  </div>
                </div>

                <button
                  onClick={clearDish}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    width: '100%',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                >
                  🧹 Clear Petri Dish
                </button>
              </div>
            )}

            <button
              onClick={() => setRole(null)}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer',
                background: '#64748b',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                width: '100%'
              }}
            >
              Change Role
            </button>
          </div>

          {/* Right Panel - Petri Dish */}
          <div style={{ textAlign: 'center' }}>
            <h3>Petri Dish</h3>
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              onClick={handleCanvasClick}
              style={{
                border: '2px solid #333',
                borderRadius: '8px',
                cursor: role === 'placer' ? 'crosshair' : 'default',
                background: 'white'
              }}
            />
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              {role === 'placer' ? 'Click on the petri dish to place mold' : 'Adjust sliders to change mold properties'}
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
              Total molds: {molds.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}