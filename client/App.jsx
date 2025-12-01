import { useState, useEffect, useRef } from "react";
import './style.css';

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
    // "ws://${window.location.hostname}:3000/"
    // this calls the LITERAL ip address instead of localhost
    // instead of hard coding it
    let socket = new WebSocket(`ws://${window.location.hostname}:3000/`);

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

  // place/draw molds on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draws petri dish image as background
    const petriImg = petriDishImageRef.current;
    if (petriImg && petriImg.complete) {
      ctx.drawImage(petriImg, 0, 0, canvas.width, canvas.height);
    }

    // Draw molds using images
    molds.forEach(mold => {
      const moldImg = moldImagesRef.current[mold.type];
      if (moldImg && moldImg.complete) {
        ctx.globalAlpha = 0.8;
        // Draw image centered on the click position
        const imgSize = mold.size * 2; // diameter
        ctx.drawImage(
          moldImg,
          mold.x - imgSize / 2,
          mold.y - imgSize / 2,
          imgSize,
          imgSize
        );
        ctx.globalAlpha = 1;
      }
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
    <div className="app-container">
      <h1 className="app-title">⋆˙𓍊₊ ⊹˚mold culture simulator⋆˙𓍊₊ ⊹˚</h1>
      
      <div className="connection-info">
        <div><strong>your ID:</strong> {id}</div>
        <div><strong>connected users:</strong> {connected.join(', ')}</div>
      </div>

      {!role && (
        <div className="role-selection">
          <h2>pick your role:</h2>
          <button 
            onClick={() => setRole('controller')}
            className="role-button controller"
          >
            environment controller🎛️
          </button>
          <button 
            onClick={() => setRole('placer')}
            className="role-button placer"
          >
            mold placer🧫
          </button>
        </div>
      )}

      {role && (
        <div className="main-grid">
          {/* Left Panel - Controls */}
          <div>
            {role === 'controller' && (
              <div className="control-panel">
                <h3>environment controls</h3>
                
                <div className="control-section">
                  <label className="control-label">
                    <strong>environment parameters (affects mold size)</strong>: {environment}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={environment}
                    onChange={handleEnvironmentChange}
                    className="range-input"
                  />
                  <div className="control-info">
                    base size: {(10 + (environment / 100) * 30).toFixed(0)}px
                  </div>
                </div>

                <div className="control-section">
                  <label className="control-label">
                    <strong>time (growth factor)</strong>: {time}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={time}
                    onChange={handleTimeChange}
                    className="range-input"
                  />
                  <div className="control-info">
                    growth: {(1 + (time / 100) * 2).toFixed(2)}x
                  </div>
                </div>

                <div className="control-section">
                  <label className="control-label">
                    <strong>temperature</strong>: {temperature}%
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={temperature}
                    onChange={handleTemperatureChange}
                    className="range-input"
                  />
                  <div className="control-info">
                    effect: {(0.5 + (temperature / 100)).toFixed(2)}x
                  </div>
                </div>

                <div className="preview-box">
                  <strong>current mold size preview:</strong>
                  <div className="preview-size">
                    {((10 + (environment / 100) * 30) * (1 + (time / 100) * 2) * (0.5 + (temperature / 100))).toFixed(1)}px
                  </div>
                </div>
              </div>
            )}

            {role === 'placer' && (
              <div className="control-panel">
                <h3>mold selection</h3>
                <div className="mold-grid">
                  {MOLD_TYPES.map((mold, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMold(index)}
                      className={`mold-button ${selectedMold === index ? 'selected' : ''}`}
                      style={{
                        background: selectedMold === index ? mold.color : 'white',
                        borderColor: mold.color,
                        borderWidth: '2px',
                        borderStyle: 'solid'
                      }}
                    >
                      <img 
                        src={mold.image} 
                        alt={mold.name}
                        className="mold-icon"
                      />
                      {mold.name}
                    </button>
                  ))}
                </div>

                <div className="settings-info">
                  <strong>current settings:</strong>
                  <div className="settings-text">
                    environment: {environment}% | time: {time}% | temp: {temperature}%
                  </div>
                  <div className="settings-text">
                    mold size will be: {((10 + (environment / 100) * 30) * (1 + (time / 100) * 2) * (0.5 + (temperature / 100))).toFixed(1)}px
                  </div>
                </div>

                <button onClick={clearDish} className="clear-button">
                  clear petri dish🧹
                </button>
              </div>
            )}

            <button onClick={() => setRole(null)} className="change-role-button">
              change role
            </button>
          </div>

          {/* Right Panel - Petri Dish */}
          <div className="petri-container">
            <h3>petri dish</h3>
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              onClick={handleCanvasClick}
              className={`petri-canvas ${role}`}
            />
            <div className="petri-info">
              {role === 'placer' ? 'Click on the petri dish to place mold' : 'Adjust sliders to change mold properties'}
            </div>
            <div className="mold-count">
              total molds: {molds.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}