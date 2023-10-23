import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors({
    origin: "*",
    methods: "*",
    headers: "*",
}));
app.use(bodyParser.json());

// Define Server Port
const PORT = 3000;

// Function to make a simple proxy API call
const makeApiCall = async (url, options) => {
  try {
    console.log(url);
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Extract Query Parameters
const getQueryParameters = async (queries) => {
  const queryParams = Object.entries(queries);
  let queryStr = queryParams.length ? "?" : "";
  queryParams.map(([key, value]) => {
    queryStr += `${key}=${value}&`;
  });
  queryStr = queryStr.substring(0, queryStr.length-1);

  return queryStr;
};

// Extract Body
const getBodyParameters = (body) => {
  return (body && Object.entries(body).length) ? JSON.stringify(body) : null;
};

// Extract Options
const getOptions = async (reqMethod, reqHeaders, reqBody) => {
  if (reqBody) {
    return {
      method: reqMethod,
      headers: {
        "Content-Type": 'application/json',
      },
      body: reqBody
    }
  } else {
    return {
      method: reqMethod,
      headers: {
        "Content-Type": 'application/json',
      }
    };
  }
};

// Extract URL
const getURl = async (completeUrl) => {
  const start_index = completeUrl.indexOf('/proxy/')+7;
  const url = completeUrl.substring(start_index, completeUrl.length);
  return url;
};

// Function to proxy React calls to node server
app.all('/proxy/*', async function(req, res, next) {
  try {
    // Extract Intended URL details
    const url = await getURl(req.originalUrl);
    const queries = await getQueryParameters(req.query);
    const body = getBodyParameters(req.body);
    const options = await getOptions(req.method, req.headers, body);
    
    // Make HTTP Call
    const resObj = await makeApiCall(`${url}${queries}`, options);

    // Handle Response
    if (!resObj) {
      res.status(404).send({'message': 'Failed API server not reachable'});
    } else {
      const content = await resObj.json();
      res.status(200).send(content);
    }
  } catch (err) {
    res.status(404).send({'message': `API server not reachable ${err}`});
  }
  next();
});

app.listen(PORT);