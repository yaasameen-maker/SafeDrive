const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let tripData = {};
let isTracking = false;

app.post('/trip/start', (req, res) => {
  isTracking = true;
  tripData = {
    startTime: new Date().toISOString(),
    distance: 0,
    duration: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    speedViolations: 0,
    hardBraking: 0,
    rapidAcceleration: 0,
    safetyScore: 100
  };
  console.log('Trip started:', tripData);
  res.json({ message: 'Trip started successfully', tripData });
});

app.post('/trip/end', (req, res) => {
  isTracking = false;
  console.log('Trip ended:', tripData);
  res.json({ message: 'Trip ended successfully', tripData });
});

app.post('/trip/export', (req, res) => {
  const { userProfile, vehicleInfo, insuranceInfo } = req.body;
  const exportData = {
    tripId: `trip_${Date.now()}`,
    ...req.body,
    tripData
  };

  // In a real app, this would send to an insurance API
  console.log('Exporting to Insurance API:', exportData);
  res.json({ message: 'Trip data exported successfully' });
});

app.get('/status', (req, res) => {
  res.json({ isTracking });
});

app.listen(port, () => {
  console.log(`SafeDrive backend listening at http://localhost:${port}`);
});
