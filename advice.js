const https = require('https');
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  try {
    const {topic, problem, sysPrompt} = JSON.parse(event.body);
    const key = process.env.GROQ_API_KEY;
    const payload = JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 800,
      messages: [
        {role: 'system', content: sysPrompt},
        {role: 'user', content: 'Topic: ' + topic + '\n\nProblem: ' + problem}
      ]
    });
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    const text = result.choices[0].message.content;
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({advice: text})
    };
  } catch(err) {
    return {
      statusCode: 500,
      headers: {'Access-Control-Allow-Origin': '*'},
      body: JSON.stringify({error: err.message})
    };
  }
};
