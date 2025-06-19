import React, { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [config, setConfig] = useState({
    url: "",
    username: "",
    password: "",
  });

  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState([]);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState([]);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const connectDB = async () => {
    try {
      await axios.post("http://localhost:8080/api/connect", config);
      setConnected(true);
      fetchTables();
    } catch (err) {
      setError(err.response?.data || "Connection Failed");
    }
  };

  const fetchTables = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/tables", {
        url: config.url,
        username: config.username,
        password: config.password,
      });
      setTables(res.data);
    } catch (err) {
      console.error("Tables Fetch Error:", err);
      setError("Failed to fetch tables");
    }
  };

  const executeQuery = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/query", {
        url: config.url,
        username: config.username,
        password: config.password,
        query: query,
      });
      setQueryResult(res.data);
      setError("");
    } catch (err) {
      console.error("Query Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Query Execution Failed");
    }
  };

  const generateQueryFromPrompt = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/ai-sql", prompt, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
      setQuery(res.data.query);
    } catch (err) {
      setError("Failed to generate query");
    }
  };

  return (
    <div
      className={`app-wrapper ${darkMode ? "dark-mode" : "light-mode"}`}
      style={{ overflowX: "hidden", overflowY: "auto", minHeight: "100vh" }}
    >
      <header className="header">
        <h1 className="app-title">🛠️ Database Query Tool</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="toggle-dark">
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      {!connected && (
        <div className="form-section">
          <input
            name="url"
            placeholder="Database URL"
            value={config.url}
            onChange={handleChange}
          />
          <input
            name="username"
            placeholder="Username"
            value={config.username}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={config.password}
            onChange={handleChange}
          />
          <button onClick={connectDB}>Connect</button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {connected && (
        <div className="main" style={{ display: "flex", flexWrap: "wrap" }}>
          <aside className="sidebar" style={{ flex: "1 1 200px" }}>
            <h2 style={{ color: darkMode ? "#fff" : "#333" }}>Tables</h2>
            <ul>
              {tables.map((table, index) => (
                <li
                  key={index}
                  style={{ color: darkMode ? "#ccc" : "#111", padding: "4px 0" }}
                >
                  {table}
                </li>
              ))}
            </ul>
          </aside>

          <section className="query-section" style={{ flex: "3 1 600px" }}>
            <input
              type="text"
              placeholder="Ask AI to generate SQL..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ width: "90%" }}
            />
            <button onClick={generateQueryFromPrompt}>Generate with AI</button>

            <textarea
              rows="4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Write your SQL query here..."
              style={{ width: "90%" }}
            ></textarea>
            <button onClick={executeQuery}>Execute</button>

            <div className="results">
              {queryResult.length > 0 && (
                <div className="modern-table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        {Object.keys(queryResult[0]).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {error && <p className="error">{error}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
