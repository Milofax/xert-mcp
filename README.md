# XERT MCP Server

A Model Context Protocol (MCP) server that connects Claude to the XERT API, providing access to your fitness signature, training load, workouts, and activities.

## Features

- 📊 **Fitness Signature** - Get your current FTP, LTP, HIE, and Peak Power
- 🎯 **Training Status** - Check freshness, training load, and recommended XSS
- 🏋️ **Workout of the Day** - AI-powered workout recommendations
- 📋 **Workouts** - List, view details, and export (ZWO/ERG)
- 🚴 **Activities** - Browse activities with full XSS metrics and MPA data
- ⬆️ **Upload** - Upload FIT files for analysis

## Installation

### Prerequisites

- Node.js 18 or later
- A XERT account (free or premium)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Milofax/xert-mcp.git
   cd xert-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Authenticate with XERT:**
   ```bash
   npm run setup-auth
   ```
   Enter your XERT email and password when prompted. Tokens will be saved to `.env`.

4. **Build the project:**
   ```bash
   npm run build
   ```

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "xert": {
      "command": "node",
      "args": ["/path/to/xert-mcp/dist/server.js"]
    }
  }
}
```

Replace `/path/to/xert-mcp` with the actual path to your installation.

## Available Tools

| Tool | Description |
|------|-------------|
| `xert-get-training-info` | Get fitness signature, training status, load, and WOTD |
| `xert-list-workouts` | List all your saved workouts |
| `xert-get-workout` | Get detailed workout intervals |
| `xert-download-workout` | Export workout as ZWO or ERG file |
| `xert-list-activities` | List activities in a time range |
| `xert-get-activity` | Get activity details with XSS metrics |
| `xert-upload-fit` | Upload a FIT file for analysis |

## Usage Examples

Ask Claude questions like:

- "What's my current FTP and training status?"
- "Show me my workout of the day"
- "List my activities from the last 7 days"
- "What was my XSS breakdown for yesterday's ride?"
- "Did I have any breakthroughs this week?"
- "Show me my saved workouts"
- "Export my 'Sunday Endurance' workout as a ZWO file"

## XERT Concepts

- **FTP** - Functional Threshold Power (1-hour sustainable power)
- **LTP** - Lower Threshold Power (fat-burning threshold)
- **HIE** - High Intensity Energy (anaerobic work capacity)
- **PP** - Peak Power (maximum instantaneous power)
- **XSS** - Xert Strain Score (training load metric)
- **MPA** - Maximum Power Available (real-time power limit)

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Token Refresh

The server automatically refreshes expired tokens. Tokens are valid for 7 days. If refresh fails, run `npm run setup-auth` again.

## License

MIT

## Credits

- [XERT](https://www.xertonline.com/) - Advanced cycling analytics
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI integration standard
