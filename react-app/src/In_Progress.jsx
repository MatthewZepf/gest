import React, { useState, useEffect, useRef } from "react";
import "./style.css"; // Ensure styles are updated here
import { useNavigate } from "react-router-dom";

const InProgress = () => {
  const [clickedButtons, setClickedButtons] = useState({
    settings: false,
    practiceMode: false,
    toggleCamera: true,
  });
  const [frame, setFrame] = useState(null);
  const [practiceLog, setPracticeLog] = useState([]);
  const [port, setPort] = useState(null);
  const wsRef = useRef(null); // Use useRef to store the WebSocket instance
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPort() {
      try {
        if (window.electronAPI) {
          const retrievedPort = await window.electronAPI.getPort();
          setPort(retrievedPort);
        }
      } catch (error) {
        console.error('Failed to get port:', error);
      }
    }

    fetchPort();
  }, []);

  useEffect(() => {
    if (port) {
      const ws = new WebSocket(`ws://localhost:${port}`);
      wsRef.current = ws; // Store the WebSocket instance in the ref

      ws.onopen = () => {
        console.log("WebSocket connection established");
        ws.send("update");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "frame") {
            setFrame(message.data);
          }
          else if (message.type === "practice-log") {
            console.log("Practice Log:", message.data); // Log the practice log
            setPracticeLog((prevLog) => {
              const newLog = [...prevLog, message.data];
              if (newLog.length > 7) {
                newLog.shift(); // Remove the oldest entry if more than 10
              }
              return newLog;
            });
          }
        } 
        catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };

      return () => {
        ws.close();
      };
    }
  }, [port]);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (clickedButtons.practiceMode) {
        ws.send("practice-enabled");
      } else {
        ws.send("practice-disabled");
      }
    }
  }, [clickedButtons.practiceMode]);

  const handleButtonClick = (buttonName) => {
    setClickedButtons((prev) => ({
      ...prev,
      [buttonName]: !prev[buttonName],
    }));
  };

  const handleStop = () => {
    console.log("STOPPING");
    navigate("/");
  };

  return (
    <div className="in-progress-container">
      
        <div 
          className="top-left-image-container" 
          onClick={handleStop}
          role="button" 
          aria-label="Stop"
          tabIndex={0}
        >
          <img src="./logo.png" alt="Top Left" className="top-left-image" />
        </div>
      <div className="content">
        <div className="top-bar">
          <button
            className={`top-bar-button ${clickedButtons.settings ? "clicked" : ""}`}
            onClick={() => handleStop()}
          >
            SETTINGS
          </button>
          <button
            className={`top-bar-button ${clickedButtons.practiceMode ? "clicked" : ""}`}
            onClick={() => handleButtonClick("practiceMode")}
          >
            PRACTICE MODE
          </button>
          <button
            className={`top-bar-button ${clickedButtons.toggleCamera ? "clicked" : ""}`}
            onClick={() => handleButtonClick("toggleCamera")}
          >
            TOGGLE CAMERA
          </button>
        </div>
        {clickedButtons.toggleCamera && (
          frame ? (
            <img
              src={`data:image/jpeg;base64,${frame}`}
              alt="Live Frame"
              className="underneath-image"
            />
          ) : (
            <p>Loading...</p>
          )
        )}
        {clickedButtons.practiceMode && (
          <div className="practice-log">
            <h2 className="practice-log-title">PRACTICE LOG</h2>
            <div className="practice-log-content">
              {practiceLog.length > 0 ? (
                practiceLog.map((entry, index) => (
                  <p key={index}>{entry}</p>
                ))
              ) : (
                <p>No practice log entries</p>
              )}
            </div>
          </div>
        )}
      </div>
      <button className="stop-button" onClick={handleStop}>
        STOP
      </button>
    </div>
  );
};

export default InProgress;
