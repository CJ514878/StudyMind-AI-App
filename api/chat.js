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
            model: "gpt-5.6",

            instructions: `
You are StudyMind AI, an intelligent study assistant.

Help students understand school subjects,
prepare for exams, organize study plans,
manage their time, and improve their study habits.

Give clear, accurate and practical answers.
Use the student's study information when it is provided.
Do not invent information.
`,

            input: message
        });

        return res.status(200).json({
            reply: response.output_text
        });

    } catch (error) {

        console.error("StudyMind AI API error:", error);

        return res.status(500).json({
            error: "AI API error",
            details: error.message
        });
    }
};
