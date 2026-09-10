"use strict";

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        const body =
            req.body || {};

        const {
            curriculum,
            selections,
            exams,
            studyHours,
            difficulty,
            goal,
            preferences
        } = body;


        if (
            !curriculum ||
            !Array.isArray(selections) ||
            !selections.length ||
            !Array.isArray(exams) ||
            !exams.length ||
            !studyHours
        ) {

            return res.status(400).json({
                error:
                    "Incomplete study information."
            });

        }


        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        const systemPrompt = `

You are StudyMind AI's expert academic planning engine.

Your job is to create an exceptionally effective,
realistic and adaptive study plan for a secondary-school
student.

You are NOT a generic chatbot.

You are a scheduling and learning-optimization engine.

The student's information is authoritative.

NEVER invent a subject, topic or exam that was not provided.

PLANNING PRINCIPLES:

1. Earlier exams receive higher priority.

2. Topics belonging to an earlier exam should generally
   receive more immediate attention.

3. Difficult or high-priority topics should receive more
   study/revision opportunities.

4. Do not schedule unrealistic continuous studying.

5. Every valid study session must be at least 25 minutes.

6. Insert short breaks between substantial study blocks.

7. Use longer recovery periods when the student's workload
   requires them.

8. Do not automatically make every day a study day.

9. Use strategically placed rest days when appropriate.

10. Include active recall.

11. Include practice questions.

12. Include spaced revision.

13. Move topics from learning to revision to testing.

14. Topics approaching an exam should transition toward
    retrieval practice rather than endless rereading.

15. Avoid placing too many difficult subjects consecutively.

16. Consider subject switching to reduce cognitive fatigue.

17. If multiple exams exist, optimize the schedule globally
    rather than planning each exam independently.

18. The plan must be achievable within the student's stated
    daily study time.

19. Do not schedule more minutes than are available.

20. The schedule should adapt around exam dates.

21. The student's stated goal should influence prioritization.

22. The plan should be measurable.

23. Include a reason for important scheduling decisions.

24. If there is insufficient time to cover everything,
    prioritize intelligently rather than pretending everything
    can receive equal time.

Return ONLY valid JSON.

JSON FORMAT:

{
  "summary": "...",
  "strategy": "...",
  "priorityRules": [],
  "topics": [
    {
      "id": "...",
      "subject": "...",
      "name": "...",
      "priority": "critical|high|normal|low",
      "estimatedMinutes": 25,
      "revisionCycles": 2,
      "masteryTarget": 80
    }
  ],
  "schedule": [
    {
      "date": "YYYY-MM-DD",
      "dayType": "study|rest|revision|exam",
      "sessions": [
        {
          "start": "16:00",
          "end": "16:45",
          "type": "study|revision|practice|test",
          "subject": "...",
          "topic": "...",
          "reason": "..."
        },
        {
          "start": "16:45",
          "end": "17:00",
          "type": "break",
          "reason": "Recovery break"
        }
      ]
    }
  ],
  "dailyGoal": {
    "minutes": 60,
    "description": "..."
  },
  "recommendations": [],
  "adaptiveRules": []
}

Today's date:
${today}

`;


        const userPrompt = `

STUDENT INFORMATION

Curriculum:
${curriculum}

Subjects and topics:
${JSON.stringify(
    selections,
    null,
    2
)}

Exams:
${JSON.stringify(
    exams,
    null,
    2
)}

Available study hours per day:
${studyHours}

Preferred intensity:
${difficulty || "balanced"}

Student goal:
${goal || "No specific goal provided"}

Minimum valid study session:
${preferences?.minimumSessionMinutes || 25}

Preferred session lengths:
${JSON.stringify(
    preferences?.preferredSessionLengths ||
    [25,45,60]
)}

Intelligent breaks:
${preferences?.intelligentBreaks !== false}

Intelligent rest days:
${preferences?.intelligentRestDays !== false}

Adaptive revision:
${preferences?.adaptiveRevision !== false}

Exam prioritization:
${preferences?.examPrioritization !== false}

Build the most academically effective schedule possible
while remaining realistic for the available time.

`;


        const response =
            await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${
                                process.env.OPENAI_API_KEY
                            }`
                    },

                    body:
                        JSON.stringify({

                            model:
                                process.env.OPENAI_MODEL ||
                                "gpt-4o-mini",

                            temperature:
                                0.15,

                            response_format: {
                                type:
                                    "json_object"
                            },

                            messages: [

                                {
                                    role:
                                        "system",

                                    content:
                                        systemPrompt
                                },

                                {
                                    role:
                                        "user",

                                    content:
                                        userPrompt
                                }

                            ]

                        })
                }
            );


        if (!response.ok) {

            const error =
                await response.text();

            console.error(
                "OpenAI error:",
                error
            );

            return res.status(502).json({
                error:
                    "StudyMind AI could not reach the planning engine."
            });

        }


        const data =
            await response.json();


        const raw =
            data?.choices?.[0]?.message?.content;


        if (!raw) {

            return res.status(502).json({
                error:
                    "The AI returned no study plan."
            });

        }


        let plan;

        try {

            plan =
                JSON.parse(raw);

        } catch {

            console.error(
                "Invalid AI JSON:",
                raw
            );

            return res.status(502).json({
                error:
                    "The AI returned an invalid study plan."
            });

        }


        return res.status(200).json({
            plan
        });


    } catch (error) {

        console.error(
            "Planner server error:",
            error
        );

        return res.status(500).json({
            error:
                "StudyMind AI planner failed."
        });

    }

}
