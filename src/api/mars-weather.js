const express = require('express');
const axios = require('axios');

const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
 
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// 
 
const limiter = rateLimit({
  windowMs: 30 * 1000, // 15 minutes
  max: 10, // limit each IP to 100 requests per windowMs
});
 
const speedLimiter = slowDown({
    windowMs: 30 * 1000, // 15 minutes
    delayAfter: 1, 
    delayMs: 500 
  });


const router = express.Router();

const BASE_URL = "https://api.nasa.gov/insight_weather/?";

let cachedData;
let cacheTime;

const apiKeys = new Map();
apiKeys.set('12345', true)


router.get('/', limiter, speedLimiter, async (req, res, next) => {
const apiKey = req.get('X-API-KEY');
    if(apiKeys.has(apiKey)){
        next();
    }
    else{
        const error = new Error('Invalid API KEY')
        next(error)
    }


    if(cacheTime && cacheTime > Date.now() - 30 * 1000){
       return res.json(cachedData)
   }
    try{
        const params = new URLSearchParams({
            api_key: process.env.NASA_API_KEY,
            feedtype: 'json',
            ver: '1.0'
        })
         // 1. make a request to api
        const { data } = await axios.get(`${BASE_URL}${params}`)
        // 2. respond to this request with data from api
        cachedData = data;
        cacheTime = Date.now();
        data.cacheTime = cacheTime;
        return res.json(data)
   }
   catch(error){
    return next(error)
   }
   
    

});

module.exports = router;
