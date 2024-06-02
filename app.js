const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const config = process.env;
const port = config.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: config.PASSWORD,
  resave: false,
  saveUninitialized: true
}));

const requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  next();
};

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === config.PASSWORD) {
    req.session.loggedIn = true;
    return res.redirect('/chat');
  }
  res.redirect('/login');
});

app.get('/chat', requireLogin, (req, res) => {
  res.render('chat');
});

const endpointOpenai = `https://${config.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com/openai/deployments/${config.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${config.AZURE_OPENAI_API_VERSION}`;
const endpointSearch = `https://${config.AZURE_SEARCH_RESOURCE_NAME}.search.windows.net`;

app.post('/api/chat', requireLogin, async (req, res) => {
  const { message } = req.body;

  try {
      const response = await axios.post(endpointOpenai, {
        messages: [
            { "role": "system", "content": "You are an AI assistant that helps people find information."},
            { "role": "user", "content": message}   
        ],
        data_sources: [
            {
              type: 'azure_search',
              parameters: {
                endpoint: endpointSearch,
                index_name: config.AZURE_SEARCH_INDEX,
                authentication: {
                    type: "api_key",
                    key: config.AZURE_SEARCH_API_KEY
                }
              }
            }
        ]
      }, 
      {
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.AZURE_OPENAI_API_KEY
        }
      });
  
    let responseMessage = response.data;

    res.json(responseMessage);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log('Server is running on http://localhost:' + port);
});