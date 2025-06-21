// ✅ New: Click on collection to populate automatically

import React, { useState } from "react";
import axios from "axios";
import {
  AppBar, Toolbar, Typography, Container, CssBaseline, Paper, TextField, Button, List,
  ListItem, ListItemText, Switch, FormControlLabel, Box, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, InputAdornment, IconButton, Drawer,
  Collapse, Tooltip
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

export default function App() {
  const [config, setConfig] = useState({
    type: "sql", url: "", username: "", password: "", database: "", collection: ""
  });
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [query, setQuery] = useState("{}");
  const [queryResult, setQueryResult] = useState([]);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(true);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      ...(darkMode
        ? {}
        : {
            background: { default: "#f9fafb", paper: "#ffffff" },
            primary: { main: "#0d9488" },
            secondary: { main: "#6366f1" },
            text: { primary: "#1f2937", secondary: "#4b5563" },
            divider: "#e5e7eb"
          })
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      fontSize: 14,
      button: { textTransform: "none", fontWeight: 500 }
    },
    shape: { borderRadius: 12 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }
        }
      }
    }
  });

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const connectDB = async () => {
    try {
      await axios.post("http://localhost:8080/api/connect", config);
      setConnected(true);
      setShowConnectForm(false);
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.error || "Connection Failed");
    }
  };

  const fetchTables = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/tables", config);
      setTables(res.data);
      setFilteredTables(res.data);
    } catch (err) {
      setError("Failed to fetch tables");
    }
  };

  const handleTableSearch = (e) => {
    const value = e.target.value;
    setTableSearch(value);
    const filtered = tables.filter((table) => table.toLowerCase().includes(value.toLowerCase()));
    setFilteredTables(filtered);
  };

  const handleTableClick = (tableName) => {
    setConfig((prev) => ({ ...prev, collection: tableName }));
  };

  const executeQuery = async () => {
    try {
      const payload = config.type === "mongo"
        ? {
            type: "mongo",
            url: config.url,
            database: config.database,
            query: `${config.collection}:::${query.trim()}`
          }
        : {
            type: "sql",
            url: config.url,
            username: config.username,
            password: config.password,
            query: query
          };
      console.log("Sending query payload:", payload);
      const res = await axios.post("http://localhost:8080/api/query", payload);
      setQueryResult(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Query Execution Failed");
    }
  };

  const generateQueryFromPrompt = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/ai-sql", prompt, {
        headers: { "Content-Type": "text/plain" },
      });
      setQuery(res.data.query);
    } catch (err) {
      setError("Failed to generate query");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🛠️ Database Query Tool
          </Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
            label="Dark Mode"
          />
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Database</Typography>
            <Box>
              <Tooltip title="Add/Connect DB">
                <IconButton onClick={() => setShowConnectForm(!showConnectForm)}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={() => setDrawerOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Collapse in={showConnectForm}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.type === "mongo"}
                  onChange={(e) => setConfig({ ...config, type: e.target.checked ? "mongo" : "sql" })}
                />
              }
              label={config.type === "mongo" ? "MongoDB" : "SQL DB"}
            />

            {config.type === "mongo" ? (
              <>
                <TextField label="MongoDB URI" name="url" fullWidth margin="dense" value={config.url} onChange={handleChange} />
                <TextField label="Database Name" name="database" fullWidth margin="dense" value={config.database} onChange={handleChange} />
              </>
            ) : (
              <>
                <TextField label="Database URL" name="url" fullWidth margin="dense" value={config.url} onChange={handleChange} />
                <TextField label="Username" name="username" fullWidth margin="dense" value={config.username} onChange={handleChange} />
                <TextField label="Password" type="password" name="password" fullWidth margin="dense" value={config.password} onChange={handleChange} />
              </>
            )}

            <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={connectDB}>
              {connected ? "Reconnect" : "Connect"}
            </Button>
            {error && <Typography color="error" mt={2}>{error}</Typography>}
          </Collapse>

          {connected && (
            <Box mt={3}>
              <Typography variant="h6">Tables / Collections</Typography>
              <TextField
                placeholder="Search..."
                value={tableSearch}
                onChange={handleTableSearch}
                fullWidth
                size="small"
                margin="dense"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton disabled>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Paper sx={{ maxHeight: 300, overflowY: 'auto', mt: 1 }}>
                <List dense>
                  {filteredTables.map((table, index) => (
                    <ListItem key={index} button onClick={() => handleTableClick(table)}>
                      <ListItemText primary={table} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </Box>
      </Drawer>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6">Query Playground</Typography>

          {!connected && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please connect to a database to begin using the query tools.
            </Typography>
          )}

          {connected && (
            <Box>
              <TextField
                fullWidth
                label="Ask AI to generate Query..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                margin="dense"
              />
              <Button variant="outlined" onClick={generateQueryFromPrompt} sx={{ mb: 2 }}>
                Generate
              </Button>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={config.type === "mongo" ? `Filter for ${config.collection}` : "SQL Query"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                margin="normal"
              />
              <Button variant="contained" onClick={executeQuery}>Execute</Button>

              {queryResult.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6">Query Result</Typography>
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(queryResult[0]).map((col) => (
                            <TableCell key={col}>{col}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {queryResult.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val, j) => (
                              <TableCell key={j}>{String(val)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {error && <Typography color="error" mt={2}>{error}</Typography>}
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}