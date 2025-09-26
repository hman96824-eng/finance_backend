import express from 'express';
import AuthUser from '../modules/auth/routes.js';

export default (app) => {
    const apiRoute = express.Router();
    apiRoute.use('/', AuthUser);
    app.use('/api/v1', apiRoute);

};
