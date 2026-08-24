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

        if (message.length > 4000) {
            return res.status(400).json({
                error: "Your message is too long."
            });
        }

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            instructions: `
You are StudyMind AI, an intelligent study assistant.

Help students with:
- Understanding school subjects
- Explaining difficult concepts
- Creating study plans
- Organizing study schedules
- Preparing for examinations
- Reviewing study progress
- Choosing what to study
- Developing effective study habits

Give clear, accurate, practical answers.

Adapt explanations to the student's level.
Use simple explanations when appropriate.
For academic questions, show the reasoning clearly rather than
just giving an unexplained answer.

Be encouraging and professional.
Do not pretend to know information that has not been provided.
`,
            input: message
        });

        return res.status(200).json({
            reply: response.output_text
        });

    } catch (error) {
        console.error("StudyMind AI error:", error);

        return res.status(500).json({
            error: "StudyMind AI could not process your request right now."
        });
    }
};
