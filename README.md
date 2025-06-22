# CyberShield AI – Real-Time Cybersecurity Platform

CyberShield AI is a full-stack cybersecurity platform that provides real-time honeypot monitoring, phishing detection using machine learning, deepfake analysis, and threat alerting—all in a single deployable file.

[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE.txt)
[![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen)](#)
[![Tech](https://img.shields.io/badge/Built%20With-Node.js%2C%20React%2C%20Tailwind-blue)](#)

## Live Demo

Landing Page: [https://manasvi-1.github.io/cybershield-ai/](https://manasvi-1.github.io/cybershield-ai/)  
Backend Deployment: Coming soon on Railway

## Features

- Real-time honeypot monitoring for SSH, HTTP, and FTP
- Phishing email analysis with confidence scoring
- Deepfake detection for images and videos
- WebSocket-based threat alerts
- Interactive world map and analytics dashboard
- One-file deployment with no database dependencies

## Quick Start

Install and run the complete version:

```bash
npm install express ws
node cybershield-complete.js

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd cybershield-ai

# Install dependencies
npm install

# Start the application
npm run dev
```

### Environment Variables
```bash
# Optional - for real email alerts (otherwise simulated)
SENDGRID_API_KEY=your_sendgrid_api_key

# Optional - custom port (default: 5000)
PORT=5000
```

## Single File Deployment

For easy deployment, use the included `cybershield-complete.js` file:

```bash
# Install minimal dependencies
npm install express ws

# Run the complete application
node cybershield-complete.js
```

## Architecture

### Backend
- **Express.js** - RESTful API server
- **WebSocket** - Real-time communication
- **In-memory storage** - No database required
- **Geolocation service** - IP location tracking
- **Email alerts** - SendGrid integration

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **React Simple Maps** - Interactive world map

## API Endpoints

### System Stats
- `GET /api/stats` - System statistics
- `GET /api/threats` - Threat data
- `GET /api/alerts` - Alert management
- `GET /api/alerts/counts` - Alert counts by severity

### Honeypot
- `GET /api/honeypot/logs` - Attack logs
- `GET /api/honeypot/stats` - Service statistics
- `GET /api/ssh-honeypot/dashboard` - SSH dashboard data

### Analysis
- `POST /api/phishing/analyze` - Email analysis
- `GET /api/phishing/analyses` - Analysis history
- `POST /api/deepfake/analyze` - File analysis
- `GET /api/deepfake/analyses` - Analysis history

## Security Features

### Phishing Detection
- Keyword analysis
- Suspicious domain detection
- Grammar and spelling checks
- Link analysis
- Confidence scoring

### Deepfake Detection
- Pixel-level inconsistency detection
- Compression artifact analysis
- Temporal inconsistency detection
- Metadata anomaly detection
- Face swap artifact detection

### Honeypot Services
- SSH brute force detection
- HTTP attack monitoring
- FTP intrusion detection
- Geolocation tracking
- Severity classification

## Deployment Options

### Google Cloud Platform
1. Upload project files
2. Set environment variables
3. Run `npm install`
4. Start with `npm run dev` or `node cybershield-complete.js`

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

### Heroku
```bash
# Add Heroku remote
heroku create cybershield-ai

# Set environment variables
heroku config:set SENDGRID_API_KEY=your_key

# Deploy
git push heroku main
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security Considerations

- All file uploads are processed in memory
- No persistent storage of sensitive data
- Configurable file size limits
- Input validation on all endpoints
- Rate limiting recommended for production

## License

This software is proprietary and protected under copyright law.  
© 2025 Manasvi Gowda P. All Rights Reserved.  
Commercial use is prohibited without explicit written permission.

For business inquiries: manasvigowda51@gmail.com




## Support

For issues and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## Performance

- Handles 1000+ concurrent connections
- Real-time WebSocket updates
- Efficient in-memory storage
- Optimized React components
- Responsive design for all devices
