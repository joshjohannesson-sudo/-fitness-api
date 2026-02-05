export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description required' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a nutrition expert. Return ONLY valid JSON with these exact fields: name (string), description (string), calories (number), protein (number), carbs (number), fats (number). No markdown, no explanations.'
        }, {
          role: 'user',
          content: `Analyze this food and estimate nutrition for a typical serving: ${description}`
        }],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const nutritionData = JSON.parse(content);
    
    return res.status(200).json(nutritionData);

  } catch (error) {
    console.error('Error analyzing food:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze food',
      details: error.message 
    });
  }
}