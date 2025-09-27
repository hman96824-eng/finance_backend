import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import config from './config/index.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Load your routes
router(app);

const startServer = async () => {
    try {
        await config.connect();
        app.listen(port, () => {
            console.log(`✅ Server is running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('❌ Error starting server:', err?.message);
    }
};

startServer();