import utils from './token.js';
import transporter from './email.js'
import templates from './templates/email.js'

const { generateToken, verifyToken } = utils;


export {
    generateToken,
    verifyToken,
    transporter,
    templates,
}


