# CyberShield AI - Deployment Guide

## Single File Deployment (Recommended)

The easiest way to deploy CyberShield AI is using the complete single-file version:

```bash
# Download the complete application file
# cybershield-complete.js contains everything needed

# Install minimal dependencies
npm install express ws

# Run the application
node cybershield-complete.js
```

## Google Cloud Platform Deployment

### Method 1: Single File
1. Create a new Compute Engine instance
2. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. Upload `cybershield-complete.js`
4. Install dependencies: `npm install express ws`
5. Run: `node cybershield-complete.js`

### Method 2: Full Project
1. Upload the complete project folder
2. Install Node.js and dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```

### Environment Variables
```bash
export PORT=8080
export SENDGRID_API_KEY=your_sendgrid_key  # Optional
```

## Other Cloud Platforms

### Heroku
```bash
# Create Heroku app
heroku create cybershield-ai

# Set environment variables
heroku config:set PORT=\$PORT
heroku config:set SENDGRID_API_KEY=your_key

# Deploy
git push heroku main
```

### AWS EC2
1. Launch EC2 instance (Ubuntu 20.04+)
2. Install Node.js
3. Upload project files
4. Install dependencies
5. Run application
6. Configure security groups (port 5000)

### DigitalOcean
1. Create a Droplet
2. Follow similar steps as AWS EC2
3. Configure firewall rules

## Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

Build and run:
```bash
docker build -t cybershield-ai .
docker run -p 5000:5000 cybershield-ai
```

## Production Considerations

### Security
- Use HTTPS with SSL certificates
- Configure proper firewall rules
- Set up rate limiting
- Use environment variables for secrets

### Performance
- Enable gzip compression
- Use a reverse proxy (nginx)
- Configure load balancing for high traffic
- Monitor memory usage

### Monitoring
- Set up logging
- Configure health checks
- Monitor API response times
- Track WebSocket connections

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change PORT environment variable
2. **WebSocket issues**: Ensure proper proxy configuration
3. **Memory usage**: Monitor for memory leaks in production
4. **File upload limits**: Adjust if needed for large files

### Logs
Check application logs for errors:
```bash
# View logs
tail -f /var/log/cybershield.log

# Check system resources
htop
free -h
```

## Scaling

For high-traffic deployments:
1. Use multiple instances behind a load balancer
2. Implement Redis for session storage
3. Use a proper database instead of in-memory storage
4. Set up CDN for static assets