import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Call OpenAI API with vision capability
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
            {
              type: "text",
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
    });

    // Extract text from response
    const textContent = response.choices[0].message.content;
    if (!textContent) {
      return res.status(500).json({ error: "No text in response" });
    }

    // Parse JSON from OpenAI's response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Could not parse food data" });
    }

    const foodData = JSON.parse(jsonMatch[0]);

    // Validate and ensure all fields exist
    const result = {
      foodName: foodData.foodName || "Unknown Food",
      portion: foodData.portion || "1 serving",
      calories: Math.round(foodData.calories || 0),
      protein: Math.round(foodData.protein || 0),
      carbs: Math.round(foodData.carbs || 0),
      fat: Math.round(foodData.fat || 0),
      notes: foodData.notes || "",
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error analyzing food:", error);
    return res.status(500).json({ error: "Failed to analyze food", details: error.message });
  }
}
