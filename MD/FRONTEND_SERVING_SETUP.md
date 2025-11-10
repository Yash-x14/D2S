# Frontend Serving Configuration

## ✅ Static File Serving Configured

The Express server is now configured to serve static files from both frontend directories.

### Configuration Details

**Static File Routes:**
- `/` → Serves files from `/frontend` directory
- `/dealer` → Serves files from `/Dealer` directory

**Specific Route Handlers:**
- `GET /` → Serves `frontend/index.html` (Customer homepage)
- `GET /dealer` → Serves `Dealer/index1.html` (Dealer dashboard)
- `GET /login` → Serves `frontend/login.html` (Customer login)
- `GET /dealer/login` → Serves `Dealer/login.html` (Dealer login)

### Port Configuration

- **Port:** 3000 (from `.env` file or default)
- **Server URL:** `http://localhost:3000`

### Access URLs

Once the server is running, you can access:

- 🏠 **Customer Homepage:** `http://localhost:3000/`
- 🏪 **Dealer Dashboard:** `http://localhost:3000/dealer`
- 🔐 **Customer Login:** `http://localhost:3000/login`
- 🔐 **Dealer Login:** `http://localhost:3000/dealer/login`
- 📊 **API Health Check:** `http://localhost:3000/api/health`

### Asset Paths

**Frontend Assets:**
- CSS: `/styles.css`
- JS: `/script.js`, `/index.js`, etc.
- Images: `/images/*`
- Other HTML pages: `/all-products.html`, `/cart.html`, etc.

**Dealer Assets:**
- CSS: `/dealer/dealer-styles.css`
- JS: `/dealer/dealer-script.js`
- Other HTML: `/dealer/admin.html`

**Note:** The Dealer HTML references `../styles.css` which resolves to `/styles.css` (served from frontend directory).

### Server Startup

When you start the server with `npm start` or `npm run dev`, you'll see:

```
🚀 Server running on http://localhost:3000
📱 Customer frontend: http://localhost:3000/
🏪 Dealer dashboard: http://localhost:3000/dealer
🔐 Customer login: http://localhost:3000/login
🔐 Dealer login: http://localhost:3000/dealer/login
📊 API health: http://localhost:3000/api/health
```

### Testing

1. **Start the server:**
   ```bash
   cd backend
   npm start
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - You should see the customer homepage

3. **Test API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Troubleshooting

**If you see "Cannot GET /" or blank page:**
- Ensure the server is running
- Check that `frontend/index.html` exists
- Verify the port is 3000 (check `.env` file)

**If CSS/JS files don't load:**
- Check browser console for 404 errors
- Verify file paths are correct
- Ensure static file serving is configured before API routes

**If dealer dashboard doesn't load:**
- Check that `Dealer/index1.html` exists
- Verify the route `/dealer` is accessible
- Check browser console for errors

