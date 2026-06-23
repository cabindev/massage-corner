// server.js
const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const path = require('path');
const port = process.env.PORT || 3000;

app.prepare().then(() => {
    const server = express();

    // ✅ ตั้งค่าเสิร์ฟไฟล์ static สำหรับรูปภาพ
    server.use('/images', express.static(path.join(__dirname, 'public/images'), {
        maxAge: dev ? 0 : '1d', // No cache in dev, 1 day in production
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            // ตั้งค่า CORS headers
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET');
            
            // ตั้งค่า cache control
            if (filePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                res.set('Cache-Control', dev ? 'no-cache' : 'public, max-age=86400');
            }
            
            // ป้องกัน MIME type sniffing
            res.set('X-Content-Type-Options', 'nosniff');
        }
    }));
    
    // ตั้งค่าเสิร์ฟไฟล์วิดีโอ
    server.use('/videos', express.static(path.join(__dirname, 'public/videos'), {
        maxAge: dev ? 0 : '1d',
        etag: true,
        lastModified: true,
    }));

    // ✅ Middleware สำหรับ log requests (เฉพาะ development)
    if (dev) {
        server.use('/images', (req, res, next) => {
            console.log('Image request:', req.originalUrl);
            next();
        });
    }

    server.use((req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
        console.log(`> Environment: ${dev ? 'development' : 'production'}`);
        console.log(`> Static images served from: ${path.join(__dirname, 'public/images')}`);
    });
});