// Import Netlify server dependencies and declare 'app' and 'router'
const express = require("express");
const app = express();
const router = express.Router();
const serverless = require('serverless-http');
const cors = require('cors');
// Import other dependencies and middleware
const getCollection = require('../utils/mongo');
const assemble = require('../utils/assemble');

// Initialise and use middleware
app.use(cors());

//Used to receive a ruleTag that starts with 'r_' and returns the corresponding
//JS Object from the Mongo Database
async function getRule(ruleTag) {
  return await (await getCollection('exposed_rules')).findOne({tag: ruleTag});
}

async function expandRule(rule) {
  var current = await getRule(rule);
  if (current.sub !== undefined){
    current.sub = await Promise.all(current.sub.map(item => expandRule(item)));
  }
  return current;
}

router.get('/:tag', (req, res) => {
  expandRule(req.params.tag)
  .then(obs => res.send(JSON.stringify(obs)));
});

router.get('/assemble/:tag', (req, res) => {
  assemble(req.params.tag)
  .then(obs => res.send(JSON.stringify(obs)));
})

router.get('/', (req, res) => {
  res.send('from the rules router');
});

//Set up app to use router and export as a Netlify lambda function
app.use('/.netlify/functions/rules', router);
module.exports.handler = serverless(app);