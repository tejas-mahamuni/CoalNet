# MongoDB Setup Guide for CoalNet Backend

## 🚀 Quick Setup

### Step 1: Install MongoDB

1. **For Windows/Mac/Linux:**
   - Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Or install via package manager (Homebrew, apt, etc.)

2. **Or use MongoDB Atlas (Cloud - Free):**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster (M0 tier)

### Step 2: Connect with MongoDB Compass

#### Option A: Local MongoDB

1. **Start MongoDB:**
   ```bash
   # Windows (as service or manually)
   net start MongoDB
   
   # Mac/Linux
   brew services start mongodb-community
   # or
   sudo systemctl start mongod
   ```

2. **Open MongoDB Compass:**
   - Launch MongoDB Compass
   - Connect using: `mongodb://localhost:27017`
   - Create a new database: `coalnet` (or your preferred name)

#### Option B: MongoDB Atlas (Cloud)

1. **Get Connection String:**
   - Go to MongoDB Atlas dashboard
   - Click "Connect" on your cluster
   - Choose "Connect with MongoDB Compass"
   - Copy the connection string

2. **Connect in Compass:**
   - Paste the connection string
   - Replace `<password>` with your database user password
   - Connect and create database: `coalnet`

### Step 3: Configure Backend

1. **Create `.env` file in backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file with:**
   ```env
   # For Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/coalnet
   
   # OR For MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coalnet
   
   PORT=3001
   ```

3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### Step 4: Verify Connection

The server should show:
```
✅ MongoDB connected successfully!
   Database: coalnet
   Host: localhost:27017
Server is running on port 3001
```

## 🔍 Connection String Formats

### Local MongoDB (default):
```
mongodb://localhost:27017/coalnet
```

### Local with Authentication:
```
mongodb://username:password@localhost:27017/coalnet?authSource=admin
```

### MongoDB Atlas:
```
mongodb+srv://username:password@cluster.mongodb.net/coalnet
```

## 📊 Check Database in Compass

After starting the server, you should see:
- Database: `coalnet`
- Collection: `datas`
- Documents: Initial visualization data (lineChart, barChart)

## 🐛 Troubleshooting

### Error: "MONGODB_URI is not defined"
- ✅ Create `.env` file in `backend` directory
- ✅ Add `MONGODB_URI=your_connection_string`

### Error: "ECONNREFUSED" or "Connection timeout"
- ✅ Make sure MongoDB is running
- ✅ Check if MongoDB service is started
- ✅ Verify connection string is correct
- ✅ Check firewall settings

### Error: "Authentication failed"
- ✅ Verify username and password in connection string
- ✅ Check database user permissions in Atlas
- ✅ Use `authSource=admin` if needed

### Connection works but no data
- ✅ Server automatically seeds initial data on first run
- ✅ Check `datas` collection in MongoDB Compass
- ✅ Restart server to trigger seeding

## 🔐 MongoDB Atlas Setup (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Create database user (remember username/password)
4. Add IP address (0.0.0.0/0 for all, or your IP)
5. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` and `<dbname>` in connection string
6. Update `.env` file with connection string

## 📝 API Endpoints

- `GET /api/health` - Check server and database status
- `GET /api/data` - Get visualization data (requires MongoDB connection)

## 🎯 Next Steps

After connecting MongoDB:
1. ✅ Server will auto-seed initial data
2. ✅ Check data in MongoDB Compass
3. ✅ Test API endpoints
4. ✅ Connect frontend to backend API

