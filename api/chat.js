const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { message } = req.body || {};

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Please provide a message."
            });
        }

        const response = await client.responses.create({
            model: "gpt-5-mini",
            instructions: `
You are StudyMind AI, a helpful AI study assistant.

Help students understand subjects, prepare for exams,
organize study plans, improve study habits, and answer
questions about their academic work.

Give clear, accurate and understandable explanations.
Be encouraging and practical.
`,
            input: message
        });

        return res.status(200).json({
            reply: response.output_text
        });

    } catch (error) {

        console.error("StudyMind AI API error:", error);

        return res.status(500).json({
            error: "StudyMind AI could not process your request."
        });
    }
};
