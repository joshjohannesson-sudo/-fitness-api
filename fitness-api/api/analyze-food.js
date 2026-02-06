import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, userEmail } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${image}` },
              },
              {
                type: 'text',
                text: `Analyze this food image and provide ONLY a JSON response with these exact fields (no markdown, no explanations):
{
  "foodName": "exact name of the food",
  "portion": "estimated portion size",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "notes": "1-2 sentence nutritional note"
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to analyze food' });
  }
}
