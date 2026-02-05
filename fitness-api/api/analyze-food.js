import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Call Claude API with vision capability
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: 'Identify this food and provide nutrition information for a typical serving. Return ONLY valid JSON with these exact fields: name (string - the specific food identified), description (string - brief description like "Large pepperoni pizza with mozzarella"), calories (number), protein (number), carbs (number), fats (number). No markdown, no explanations. If no food is visible, return: {"name": "Unable to identify", "description": "No food detected in image", "calories": 0, "protein": 0, "carbs": 0, "fats": 0}',
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent) {
      return res.status(500).json({ error: "No text in response" });
    }

    // Parse JSON from Claude's response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Could not parse food data" });
    }

    const foodData = JSON.parse(jsonMatch[0]);

    // Validate and ensure all fields exist
    const result = {
      name: foodData.name || "Unknown Food",
      description: foodData.description || "",
      calories: Math.round(foodData.calories || 0),
      protein: Math.round(foodData.protein || 0),
      carbs: Math.round(foodData.carbs || 0),
      fats: Math.round(foodData.fats || 0),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error analyzing food:", error);
    return res.status(500).json({ error: "Failed to analyze food" });
  }
}
