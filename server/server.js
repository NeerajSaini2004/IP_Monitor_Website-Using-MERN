const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');
require('dotenv').config();

const usageRoutes = require('./routes/usageRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const downtimeRoutes = require('./routes/downtimeRoutes');
const configRoutes = require('./routes/configRoutes');
const Department = require('./models/Department');
const DowntimeLog = require('./models/DowntimeLog');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes
app.use('/api/usage', usageRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/downtime', downtimeRoutes);
app.use('/api/config', configRoutes);

// Track device status for downtime detection
const deviceStatus = new Map();

// Network monitoring function
const monitorNetwork = async () => {
  try {
    const departments = await Department.find();
    
    for (const dept of departments) {
      // Ping test for connectivity
      exec(`ping -n 1 ${dept.ip}`, async (error, stdout, stderr) => {
        const isOnline = !error;
        const responseTime = isOnline ? extractPingTime(stdout) : null;
        const deviceKey = `${dept.dept}-${dept.ip}`;
        const previousStatus = deviceStatus.get(deviceKey);
        
        // Downtime detection logic
        if (previousStatus && previousStatus.isOnline && !isOnline) {
          // Device went offline - start downtime log
          try {
            const downtime = new DowntimeLog({
              dept: dept.dept,
              ip: dept.ip,
              startTime: new Date(),
              leasedBandwidth: dept.leasedBandwidth || 100
            });
            await downtime.save();
            console.log(`⚠️  ${dept.dept} went OFFLINE`);
          } catch (err) {
            console.error('Error logging downtime start:', err);
          }
        } else if (previousStatus && !previousStatus.isOnline && isOnline) {
          // Device came back online - end downtime log
          try {
            const activeDowntime = await DowntimeLog.findOne({
              dept: dept.dept,
              ip: dept.ip,
              endTime: null
            }).sort({ startTime: -1 });
            
            if (activeDowntime) {
              const endTime = new Date();
              const duration = Math.round((endTime - activeDowntime.startTime) / (1000 * 60));
              const bandwidthLoss = (activeDowntime.leasedBandwidth * duration) / 60; // GB lost
              
              activeDowntime.endTime = endTime;
              activeDowntime.duration = duration;
              activeDowntime.bandwidthLoss = bandwidthLoss;
              await activeDowntime.save();
              console.log(`✅ ${dept.dept} back ONLINE - Downtime: ${duration}min, Loss: ${bandwidthLoss.toFixed(2)}GB`);
            }
          } catch (err) {
            console.error('Error logging downtime end:', err);
          }
        }
        
        // Update device status
        deviceStatus.set(deviceKey, { isOnline, timestamp: new Date() });
        
        // Generate realistic speed data based on connection quality
        let downloadSpeed, uploadSpeed;
        if (isOnline && responseTime) {
          const connectionQuality = Math.max(0, 1 - (responseTime / 100));
          downloadSpeed = Math.round((50 + Math.random() * 50) * connectionQuality + Math.random() * 10);
          uploadSpeed = Math.round((20 + Math.random() * 30) * connectionQuality + Math.random() * 5);
        } else {
          downloadSpeed = 0;
          uploadSpeed = 0;
        }
        
        // Emit real-time data
        io.emit('networkData', {
          departmentId: dept._id,
          department: dept.dept,
          ip: dept.ip,
          isOnline,
          responseTime,
          timestamp: new Date(),
          downloadSpeed,
          uploadSpeed
        });
      });
    }
  } catch (error) {
    console.error('Network monitoring error:', error);
  }
};

// Extract ping time from ping output
const extractPingTime = (output) => {
  const match = output.match(/time[<=](\d+)ms/);
  return match ? parseInt(match[1]) : null;
};

// Socket connection with reduced logging
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  if (connectedClients === 1) {
    console.log('First client connected');
  }
  
  socket.on('disconnect', () => {
    connectedClients--;
    if (connectedClients === 0) {
      console.log('All clients disconnected');
    }
  });
});

// Start monitoring every 5 seconds
setInterval(monitorNetwork, 5000);

// Initial monitoring call
setTimeout(() => {
  monitorNetwork();
}, 2000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Network monitoring started...');
  
  // Log departments on startup
  setTimeout(async () => {
    try {
      const departments = await Department.find();
      if (departments.length > 0) {
        console.log(`📊 Monitoring ${departments.length} departments`);
      } else {
        console.log('⚠️  No departments configured. Add departments to start monitoring.');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, 1000);
});
