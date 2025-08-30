# Database Testing Scripts

This directory contains scripts to diagnose and test database connections for the Cafe Brain application.

## Quick Start

### Windows Users
Double-click `test-db.bat` in the root directory for an interactive menu.

### Command Line Users

1. **Quick Test** (recommended first step):
   ```bash
   node scripts/quick-db-test.js
   ```

2. **Detailed Diagnostics**:
   ```bash
   node scripts/db-diagnostic.js
   ```

3. **Setup Environment Variables**:
   ```bash
   node scripts/setup-env.js
   ```

## Scripts Overview

### `quick-db-test.js`
- Fast database connection test
- Minimal output
- Good for quick verification

### `db-diagnostic.js`
- Comprehensive database testing
- Detailed error reporting
- Multiple configuration testing
- Helpful suggestions for common issues

### `setup-env.js`
- Interactive environment setup
- Creates `.env` file with database configuration
- Guides you through the setup process

## Common Issues and Solutions

### PostgreSQL/TimescaleDB Issues

1. **Connection Refused (ECONNREFUSED)**
   - PostgreSQL service is not running
   - **Solution**: Start PostgreSQL service
     - Windows: Services app → PostgreSQL → Start
     - Linux: `sudo systemctl start postgresql`

2. **Authentication Failed (28P01)**
   - Wrong username/password
   - **Solution**: Check credentials in `.env` file

3. **Database Does Not Exist (3D000)**
   - Database `cafe` doesn't exist
   - **Solution**: Create database:
     ```sql
     CREATE DATABASE cafe;
     ```

### MongoDB Issues

1. **MongoNetworkError**
   - MongoDB service is not running
   - **Solution**: Start MongoDB service
     - Windows: Services app → MongoDB → Start
     - Linux: `sudo systemctl start mongod`

2. **MongoServerSelectionError**
   - Cannot reach MongoDB server
   - **Solution**: Check host/port configuration

3. **MongoParseError**
   - Invalid connection string
   - **Solution**: Check MONGODB_URI format

## Environment Variables

The application uses these environment variables for database configuration:

### PostgreSQL/TimescaleDB
- `TIMESCALE_HOST` - Database host (default: localhost)
- `TIMESCALE_PORT` - Database port (default: 5432)
- `TIMESCALE_DB` - Database name (default: cafe)
- `TIMESCALE_USER` - Username (default: postgres)
- `TIMESCALE_PASSWORD` - Password (optional)

### MongoDB
- `MONGODB_URI` - Connection string (default:mongodb://cafeuser:CafeBrain2024!@4.198.153.55:9017/?authMechanism=SCRAM-SHA-256&authSource=cafe)

### Other
- `NODE_ENV` - Environment (development/production)

## Testing Workflow

1. **First Time Setup**:
   ```bash
   node scripts/setup-env.js
   ```

2. **Quick Test**:
   ```bash
   node scripts/quick-db-test.js
   ```

3. **If Issues Found**:
   ```bash
   node scripts/db-diagnostic.js
   ```

4. **Fix Issues** and repeat step 2

## Troubleshooting Tips

1. **Check if services are running**:
   - PostgreSQL: `pg_isready -h localhost -p 5432`
   - MongoDB: `mongo --eval "db.runCommand('ping')"`

2. **Check network connectivity**:
   - PostgreSQL: `telnet localhost 5432`
   - MongoDB: `telnet localhost 9017`

3. **Check firewall settings**:
   - Ensure ports 5432 (PostgreSQL) and 9017(MongoDB) are open

4. **Check credentials**:
   - Verify username/password in your database management tools
   - Test with pgAdmin (PostgreSQL) or Compass (MongoDB)

## File-Only Mode

If no database connections work, the application will run in "file-only mode" using JSON files in the `data/` directory. This is useful for development but not recommended for production.
