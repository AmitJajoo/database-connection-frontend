import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AppBar, Toolbar, Typography, Container, CssBaseline, Paper, TextField, Button,
  List, ListItem, ListItemText, Switch, FormControlLabel, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, InputAdornment, IconButton,
  Drawer, Collapse, Tooltip, TableSortLabel, Modal, Tabs, Tab, Divider, Grid
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { InfoCard } from './components/ui/InfoCard';
import InfoIcon from '@mui/icons-material/Info';


export default function App() {
  const [config, setConfig] = useState({ type: "sql", url: "", username: "", password: "", database: "", collection: "" });
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState([]);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState("");
  const [schema, setSchema] = useState([]);
  const [queryHistory, setQueryHistory] = useState([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [dbInfo, setDbInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [utilityModalOpen, setUtilityModalOpen] = useState(false);


  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      ...(darkMode ? {} : {
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

  const formatTimestamp = (ts) => new Date(ts).toLocaleString();

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const connectDB = async () => {
    try {
      await axios.post("http://localhost:8080/api/connect", config);
      localStorage.setItem("dbConfig", JSON.stringify(config));
      setConnected(true);
      setShowConnectForm(false);
      fetchTables();
      fetchDbInfo(config);
      setQuery(config.type === "mongo" ? "{}" : "");
    } catch (err) {
      setError(err.response?.data?.error || "Connection Failed");
    }
  };

  const fetchTables = async (cfg = config) => {
    try {
      const res = await axios.post("http://localhost:8080/api/tables", cfg);
      setTables(res.data);
      setFilteredTables(res.data);
    } catch (err) {
      setError("Failed to fetch tables");
    }
  };

  const fetchDbInfo = async (cfg = config) => {
  setLoadingInfo(true);
  try {
    const res = await axios.post("http://localhost:8080/api/db-info", cfg);
    setDbInfo(res.data);
  } catch (err) {
    console.error("DB Info fetch failed", err);
  } finally {
    setLoadingInfo(false);
  }
};

  const handleTableSearch = (e) => {
    const value = e.target.value;
    setTableSearch(value);
    setFilteredTables(tables.filter((t) => t.toLowerCase().includes(value.toLowerCase())));
  };

  const handleTableClick = async (table) => {
    setConfig(prev => ({ ...prev, collection: table }));
    setSelectedTable(table);
    try {
      const payload = { ...config, table, collection: table };
      const res = await axios.post("http://localhost:8080/api/schema", payload);
      setSchema(res.data);
      setSchemaModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch schema", err);
    }
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
      const res = await axios.post("http://localhost:8080/api/query", payload);
      setQueryResult(res.data);
      addToHistory(query);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Query Execution Failed");
    }
  };

  const addToHistory = (q) => {
    const entry = {
      query: q,
      type: config.type.toUpperCase(),
      timestamp: new Date().toISOString(),
      collection: config.collection || "N/A"
    };
    const updated = [entry, ...queryHistory].slice(0, 20);
    setQueryHistory(updated);
    localStorage.setItem("queryHistory", JSON.stringify(updated));
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  const exportCSV = () => {
    const headers = Object.keys(queryResult[0] || {});
    const csv = [headers.join(","), ...filteredData.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_result.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilterChange = (col, value) => {
    setFilters({ ...filters, [col]: value });
  };

  const handleSort = (col) => {
    const isAsc = sortConfig.key === col && sortConfig.direction === 'asc';
    setSortConfig({ key: col, direction: isAsc ? 'desc' : 'asc' });
  };

  const filteredData = queryResult
    .filter(row => Object.entries(filters).every(([key, value]) => String(row[key] || '').toLowerCase().includes(value.toLowerCase())))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  useEffect(() => {
    const savedConfig = localStorage.getItem("dbConfig");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setConnected(true);
      axios.post("http://localhost:8080/api/tables", parsed)
        .then(res => {
          setTables(res.data);
          setFilteredTables(res.data);
        })
        .catch(() => setError("Failed to fetch tables"));
      fetchDbInfo(parsed);
    }

    const history = localStorage.getItem("queryHistory");
    if (history) setQueryHistory(JSON.parse(history));
  }, []);

  const formatKey = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, str => str.toUpperCase()); 

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>🛠️ DB Tool</Typography>

          <Tooltip title="DB Utility">
            <IconButton color="inherit" onClick={() => setUtilityModalOpen(true)}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="View History">
            <IconButton color="inherit" onClick={() => setHistoryDrawerOpen(true)}><HistoryIcon /></IconButton>
          </Tooltip>
          
          <FormControlLabel control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />} label="Dark Mode" />
        </Toolbar>
      </AppBar>

      {/* Drawer: Left Side */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Database</Typography>
            <Box>
              <Tooltip title="Connect DB">
                <IconButton onClick={() => setShowConnectForm(!showConnectForm)}><AddIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Collapse in={showConnectForm}>
            <FormControlLabel
              control={<Switch checked={config.type === "mongo"} onChange={(e) => setConfig({ ...config, type: e.target.checked ? "mongo" : "sql" })} />}
              label={config.type === "mongo" ? "MongoDB" : "SQL DB"}
            />
            {config.type === "mongo" ? (
              <>
                <TextField label="Mongo URI" name="url" fullWidth margin="dense" value={config.url} onChange={handleChange} />
                <TextField label="Database" name="database" fullWidth margin="dense" value={config.database} onChange={handleChange} />
              </>
            ) : (
              <>
                <TextField label="DB URL" name="url" fullWidth margin="dense" value={config.url} onChange={handleChange} />
                <TextField label="Username" name="username" fullWidth margin="dense" value={config.username} onChange={handleChange} />
                <TextField label="Password" type="password" name="password" fullWidth margin="dense" value={config.password} onChange={handleChange} />
              </>
            )}
            <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={connectDB}>{connected ? "Reconnect" : "Connect"}</Button>
            {error && <Typography color="error" mt={2}>{error}</Typography>}
          </Collapse>

          {connected && (
            <Box mt={3}>
              <Typography variant="h6">Tables / Collections</Typography>
              <TextField placeholder="Search..." value={tableSearch} onChange={handleTableSearch} fullWidth size="small" margin="dense"
                InputProps={{ endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment> }} />
              <Paper sx={{ maxHeight: 300, overflowY: 'auto', mt: 1 }}>
                <List dense>
                  {filteredTables.map((t, i) => (
                    <ListItem key={i} button onClick={() => handleTableClick(t)}><ListItemText primary={t} /></ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Drawer: History */}
      <Drawer anchor="right" open={historyDrawerOpen} onClose={() => setHistoryDrawerOpen(false)}>
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>Query History</Typography>
          <Tabs value={tabIndex} onChange={(_, newIndex) => setTabIndex(newIndex)}>
            <Tab label="History" />
          </Tabs>
          <Divider sx={{ my: 1 }} />
          {tabIndex === 0 && (
            <List dense>
              {queryHistory.map((entry, i) => (
                <ListItem key={i} alignItems="flex-start" secondaryAction={
                  <Tooltip title="Copy">
                    <IconButton onClick={() => copyToClipboard(entry.query)}><ContentCopyIcon fontSize="small" /></IconButton>
                  </Tooltip>
                }>
                  <ListItemText
                    primary={<Typography sx={{ whiteSpace: 'pre-wrap' }}>{entry.query}</Typography>}
                    secondary={<Typography variant="caption">{`${entry.type} | ${entry.collection || "N/A"} | ${formatTimestamp(entry.timestamp)}`}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Main Container */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6">Query Playground</Typography>
          {!connected && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please connect to a database first.</Typography>}
          {connected && (
            <Box>
              <TextField fullWidth label="Ask AI..." value={prompt} onChange={(e) => setPrompt(e.target.value)} margin="dense" />
              <Button variant="outlined" sx={{ mb: 2 }}>Generate</Button>
              <TextField fullWidth multiline rows={4} label={config.type === "mongo" ? `Filter for ${config.collection}` : "SQL Query"}
                value={query} onChange={(e) => setQuery(e.target.value)} margin="normal" />
              <Button variant="contained" onClick={executeQuery}>Execute</Button>
              {queryResult.length > 0 && (
                <Box mt={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Query Result</Typography>
                    <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV}>Export CSV</Button>
                  </Box>
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(queryResult[0]).map((col) => (
                            <TableCell key={col}>
                              <TableSortLabel
                                active={sortConfig.key === col}
                                direction={sortConfig.direction}
                                onClick={() => handleSort(col)}
                              >
                                {col}
                              </TableSortLabel>
                              <TextField
                                size="small"
                                margin="dense"
                                placeholder="Filter"
                                value={filters[col] || ''}
                                onChange={(e) => handleFilterChange(col, e.target.value)}
                                fullWidth
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredData.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val, j) => <TableCell key={j}>{String(val)}</TableCell>)}
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

      {/* Modal using InfoCard */}
     <Modal open={utilityModalOpen} onClose={() => setUtilityModalOpen(false)}>
  <Box sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 700,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 3,
    maxHeight: '80vh',
    overflowY: 'auto'
  }}>
    <Typography variant="h6" mb={3}>Database Info</Typography>

    {loadingInfo ? (
      <Typography>Loading...</Typography>
    ) : dbInfo ? (
      <Grid container spacing={2}>
        {Object.entries(dbInfo).map(([key, value]) => (
  <Grid item xs={12} sm={6} key={key}>
    <Paper elevation={3} sx={{ p: 2, borderLeft: '5px solid #0d9488' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {formatKey(key)}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>
        {String(value)}
      </Typography>
    </Paper>
  </Grid>
))}
      </Grid>
    ) : (
      <Typography>No info available</Typography>
    )}

    <Box mt={3} textAlign="right">
      <Button onClick={() => setUtilityModalOpen(false)} variant="outlined">Close</Button>
    </Box>
  </Box>
</Modal>

{/* Schema Modal */}
<Modal open={schemaModalOpen} onClose={() => setSchemaModalOpen(false)}>
  <Box sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 3,
    maxHeight: '80vh',
    overflowY: 'auto'
  }}>
    <Typography variant="h6" mb={2}>Schema for: <strong>{selectedTable}</strong></Typography>

    {schema && Object.keys(schema).length > 0 ? (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Field</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {schema.map((field, index) => (
    <TableRow key={index}>
      <TableCell>{field.name}</TableCell>
      <TableCell>{field.type}</TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>
      </TableContainer>
    ) : (
      <Typography>No schema data available.</Typography>
    )}

    <Box mt={2} textAlign="right">
      <Button onClick={() => setSchemaModalOpen(false)} variant="outlined">Close</Button>
    </Box>
  </Box>
</Modal>



    </ThemeProvider>
  );
}
