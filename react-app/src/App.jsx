import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { readSettings, writeSettings } from "./settings"; // Import helper functions

export function App() {
  const navigate = useNavigate();

  const initialPositions = {
    up: { type: "command", value: [] },
    "up and right": { type: "text", value: [] },
    right: { type: "command", value: [] },
    "down and right": { type: "command", value: [] },
    down: { type: "command", value: [] },
    "down and left": { type: "command", value: [] },
    left: { type: "command", value: [] },
    "up and left": { type: "command", value: [] },
  };

  const [selected, setSelected] = useState(initialPositions);

  useEffect(() => {
    async function loadSettings() {
      const settings = await readSettings();
      const actionParams = settings.action_parameters;
      const updatedPositions = {
        up: { type: Object.keys(actionParams.up_action)[0], value: actionParams.up_action[Object.keys(actionParams.up_action)[0]] },
        "up and right": { type: Object.keys(actionParams.up_right_action)[0], value: actionParams.up_right_action[Object.keys(actionParams.up_right_action)[0]] },
        right: { type: Object.keys(actionParams.right_action)[0], value: actionParams.right_action[Object.keys(actionParams.right_action)[0]] },
        "down and right": { type: Object.keys(actionParams.down_right_action)[0], value: actionParams.down_right_action[Object.keys(actionParams.down_right_action)[0]] },
        down: { type: Object.keys(actionParams.down_action)[0], value: actionParams.down_action[Object.keys(actionParams.down_action)[0]] },
        "down and left": { type: Object.keys(actionParams.down_left_action)[0], value: actionParams.down_left_action[Object.keys(actionParams.down_left_action)[0]] },
        left: { type: Object.keys(actionParams.left_action)[0], value: actionParams.left_action[Object.keys(actionParams.left_action)[0]] },
        "up and left": { type: Object.keys(actionParams.up_left_action)[0], value: actionParams.up_left_action[Object.keys(actionParams.up_left_action)[0]] },
      };
      setSelected(updatedPositions);
    }
    loadSettings();
  }, []); // The empty array means this effect runs only once after the initial render

  const handleKeyDown = (position, event) => {
    if (selected[position].type === "command") {
      event.preventDefault();
      const keys = [];
      if (event.ctrlKey) keys.push("Control");
      if (event.shiftKey) keys.push("Shift");
      if (event.altKey) keys.push("Alt");
      if (event.key.length === 1) {
        keys.push(event.key);
      } else if (event.key !== "Shift" && event.key !== "Control" && event.key !== "Alt") {
        keys.push(event.key);
      }
      setSelected((prev) => ({
        ...prev,
        [position]: { ...prev[position], value: keys },
      }));
    }
  };

  const handleInputChange = (position, event) => {
    if (selected[position].type === "text") {
      setSelected((prev) => ({
        ...prev,
        [position]: { ...prev[position], value: [event.target.value] },
      }));
    }
  };

  const handleTypeChange = (position, event) => {
    setSelected((prev) => ({
      ...prev,
      [position]: { type: event.target.value, value: [] },
    }));
  };

  const handleConfirm = async () => {
    console.log("Keybinds confirmed:", selected);
    const newactionParameters = {
      up_action: { [selected.up.type]: selected.up.value },
      up_right_action: { [selected["up and right"].type]: selected["up and right"].value },
      right_action: { [selected.right.type]: selected.right.value },
      down_right_action: { [selected["down and right"].type]: selected["down and right"].value },
      down_action: { [selected.down.type]: selected.down.value },
      down_left_action: { [selected["down and left"].type]: selected["down and left"].value },
      left_action: { [selected.left.type]: selected.left.value },
      up_left_action: { [selected["up and left"].type]: selected["up and left"].value },
    };
    await writeSettings(newactionParameters);
    navigate("/inprogress");
  };

  return (
    <div className="App">
      <img
        src={`${process.env.PUBLIC_URL}/logo.png`}
        alt="Logo"
        className="center-logo"
      /> {/* Use the relative path from the public directory */}
      <div className="compass-container">
        {Object.entries(selected).map(([position, { type, value }]) => (
          <div
            key={position}
            className={`compass-box ${position.replace(/\s/g, "-")}`}
          >
            <div>{position.toUpperCase()}</div>
            <select
              value={type}
              onChange={(e) => handleTypeChange(position, e)}
            >
              <option value="command">Command</option>
              <option value="text">Text</option>
            </select>
            <input
              type="text"
              style={{ width: "12vw", height: "4vh", fontSize: "2vh" }}
              value={Array.isArray(value) ? value.join(" + ") : value} // Ensure value is displayed correctly
              onKeyDown={(e) => handleKeyDown(position, e)}
              onChange={(e) => handleInputChange(position, e)}
              readOnly={type === "command"}
            />
          </div>
        ))}
        <button className="confirm-button" onClick={handleConfirm}>
          CONFIRM AND START
        </button>
      </div>
    </div>
  );
}
  

export default App;