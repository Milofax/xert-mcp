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

3. **Authenticate with XERT (API 1.7+, recommended):**

   > **Important:** since Xert API 1.7 the public client `xert_public` (used by `npm run setup-auth`)
   > returns **fixed demo data** for activities and workouts (see the
   > [Xert API docs](https://www.xertonline.com/API.html)). `training_info` still works, which can hide the problem.

   In Xert go to **Account Settings → Developer**, copy your **Client Key** (`xk_…`) and generate a
   **Client Secret** (`xs_…`, shown only once). Then add them to `.env`:
   ```bash
   XERT_CLIENT_ID=xk_...
   XERT_CLIENT_SECRET=xs_...
   ```
   The server obtains and renews tokens automatically using the `client_credentials` grant
   (7-day tokens, no refresh token). Legacy tokens are ignored when these variables are set.

   *Legacy (demo data only):* `npm run setup-auth` — enter your XERT email and password; tokens are saved to `.env`.

4. **Build the project:**
   ```bash
   npm run build
   ```

## Configuration

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

Restart Claude Desktop to load the server.

### Docker

You can also run the server via Docker:

#### 1. Build the image

```bash
docker build -t xert-mcp .
```

#### 2. Get your XERT client credentials

In Xert go to **Account Settings → Developer** and copy your Client Key (`xk_…`) and Client Secret (`xs_…`).

#### 3. Configure Claude Desktop

```json
{
  "mcpServers": {
    "xert": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "XERT_CLIENT_ID",
        "-e", "XERT_CLIENT_SECRET",
        "xert-mcp"
      ],
      "env": {
        "XERT_CLIENT_ID": "xk_...",
        "XERT_CLIENT_SECRET": "xs_..."
      }
    }
  }
}
```

**Note:** With client credentials the server requests a new token automatically before it expires (7 days) — no manual token updates are needed.

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

## Token Management

**Client credentials mode** (`XERT_CLIENT_ID` + `XERT_CLIENT_SECRET` set — recommended):

- Tokens are requested with the `client_credentials` grant and kept in memory
- A new token is requested 1 hour before expiry and on any 401 response
- `xert-tokens.json` and `XERT_ACCESS_TOKEN` / `XERT_REFRESH_TOKEN` are ignored
- Invalid key/secret → `invalid_client` error; regenerate the secret in Xert (Account Settings → Developer)

**Legacy mode** (`xert_public`, returns demo data for activities/workouts since API 1.7):

- **Access tokens** expire after 7 days
- **Refresh tokens** expire after 6 months
- Tokens are stored in `xert-tokens.json` (created automatically)
- On 401 errors, tokens are refreshed automatically
- New tokens are persisted to survive server restarts

If authentication fails completely, run `npm run setup-auth` again.

### MCP Funnel / Environment Variables

When using mcp-funnel or similar tools, tokens from `xert-tokens.json` take priority over environment variables. This ensures refreshed tokens are used even when env vars contain outdated values.

## License

MIT

## Credits

- [XERT](https://www.xertonline.com/) - Advanced cycling analytics
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI integration standard
