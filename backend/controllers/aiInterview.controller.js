/* ── controllers/aiInterview.controller.js ──────────────────────── */
const { GoogleGenAI } = require('@google/generative-ai');
const Question = require('../models/Question');

// Initialize Gemini API if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiModel = null;

if (apiKey) {
  try {
    const genAI = new GoogleGenAI({ apiKey });
    // Use gemini-1.5-flash or gemini-2.5-flash as the fast, lightweight model
    aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Google Gemini API integration initialized for dynamic interviews.');
  } catch (err) {
    console.error('❌ Failed to initialize Google GenAI:', err.message);
  }
} else {
  console.log('⚠️ GEMINI_API_KEY not found in .env. Running AI Interview in simulator mode.');
}

/**
 * ── Premium Fallback Randomized Question Pools (Hardcoded resilience layers) ──
 */
const TECHNICAL_FALLBACK_QUESTIONS = [
  {
    question: "Can you walk me through the architecture of a high-performance web application you built recently, and explain how you optimized its initial loading phase?",
    topic: "Architecture",
    hint: "Focus on caching, bundle splitting, and latency metrics."
  },
  {
    question: "In state-driven frontend apps, state mutations can trigger cascading re-renders. How do you approach optimizing rendering paths and state flow across complex layouts?",
    topic: "State Management",
    hint: "Reference memoization strategies, selectors, or atomic state models."
  },
  {
    question: "When designing high-concurrency API architectures, what patterns do you enforce for payload caching, request throttling, and graceful service degradation?",
    topic: "API Resilience",
    hint: "Discuss rate limiting, debouncing, or Service Worker cache layers."
  },
  {
    question: "Explain how you would design a robust distributed caching layer for a web application experiencing sudden, massive traffic spikes. What cache invalidation strategy would you use?",
    topic: "Caching Patterns",
    hint: "Compare Write-through, Write-behind, and Cache-aside strategies."
  },
  {
    question: "What is your approach to identifying and resolving memory leaks in a production Node.js or Javascript application?",
    topic: "Debugging",
    hint: "Explain heap snapshots, garbage collection profiling, and monitoring tools."
  },
  {
    question: "How would you design a secure OAuth2 or JWT-based authentication flow for a microservices architecture? How do you store tokens securely on the client?",
    topic: "Security & Auth",
    hint: "Focus on HttpOnly cookies, token rotation, and token hijacking mitigation."
  },
  {
    question: "Explain the differences between SQL and NoSQL database indexing. How do you analyze and optimize a slow-running query in production?",
    topic: "Database Indexing",
    hint: "Mention query explain plans, index types (B-tree, Hash), and scan types."
  },
  {
    question: "How do you handle schema migrations or database updates in a high-availability production application without causing downtime?",
    topic: "Zero-Downtime Migration",
    hint: "Discuss blue-green deployments, expandable/contractable schema patterns, and dual-writing."
  }
];

const BEHAVIORAL_FALLBACK_QUESTIONS = [
  {
    question: "Tell me about a challenging professional scenario where you had to lead a task under highly compressed timelines. How did you organize the team and manage stakeholder expectations?",
    topic: "Leadership",
    hint: "Employ the STAR structure: Situation, Task, Action, and the quantified Result."
  },
  {
    question: "Describe a situation where you had a strong disagreement with a technical decision made by your lead or senior architect. How did you handle the conflict and resolve it?",
    topic: "Conflict Resolution",
    hint: "Focus on professional communication, compromise, and data-driven discussions."
  },
  {
    question: "Can you share an experience where a project you were responsible for failed or met with unexpected complications? What was your recovery strategy and what did you learn?",
    topic: "Adaptability",
    hint: "Emphasize accountability, root cause analysis, and post-mortem improvements."
  },
  {
    question: "How do you explain complex technical concepts or system architecture decisions to non-technical stakeholders (like product managers or business clients)?",
    topic: "Communication",
    hint: "Provide an example where you used analogies or business-value arguments."
  },
  {
    question: "Tell me about a time you advocated for addressing technical debt to your product manager or business lead when they wanted to prioritize new features.",
    topic: "Technical Debt",
    hint: "Explain how you quantified the risk, cost, and developer velocity impacts."
  },
  {
    question: "Describe a situation where you had to quickly learn a new technology or domain to deliver a critical project. What was your learning strategy?",
    topic: "Fast Learning",
    hint: "Focus on rapid prototyping, documentation research, and leveraging team experts."
  }
];

// Randomized sub-topics to inject into LLM prompts for maximum question diversity
const TECH_SUBTOPICS = [
  "Frontend State Management and render optimizations",
  "Distributed locking and race condition mitigations in backend APIs",
  "High-availability database sharding and read-write replication",
  "API performance, payload sizing, and REST vs GraphQL decisions",
  "Production debugging of memory leaks and CPU profiling",
  "JWT storage security, token rotation, and session hijacking preventions",
  "Cache invalidation strategies (write-behind, dual-write) under high read loads",
  "Zero-downtime database migrations and expandable/contractable schema patterns",
  "Asynchronous job workers, message brokers (Kafka/RabbitMQ) and event sourcing",
  "Fault-tolerant patterns like Circuit Breakers and bulkheads in microservices"
];

const BEHAVIORAL_SUBTOPICS = [
  "Resolving major interpersonal conflict inside an engineering team",
  "Managing sudden scope creep and shifting deadlines under critical launch pressure",
  "Explaining complex technical latency trade-offs to business-focused executives",
  "Handling a major production outage caused by your own code deployment",
  "Negotiating engineering time to pay down technical debt vs building new user features",
  "Mentoring and onboarding junior team members in a remote environment",
  "Adapting your workflow when the project target changes completely midway",
  "Aligning multiple stakeholders who have conflicting product requirements"
];

/**
 * ── Helper: Safe Gemini JSON Parsing ──
 */
async function generateGeminiJSON(prompt, fallbackFunc) {
  if (!aiModel) {
    return await fallbackFunc();
  }

  try {
    // Enforce JSON format in the response
    const result = await aiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt + '\nReturn strictly as a JSON object without any markdown wrapping (do not include ```json or ```).' }] }]
    });

    const text = result.response.text();
    // Clean up any potential markdown syntax wrapping if the model ignored instructions
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Gemini Gen error:', err.message);
    return await fallbackFunc();
  }
}

/**
 * 1. Start dynamic interview — Generates 1st question based on role & category
 */
exports.startInterview = async (req, res, next) => {
  try {
    const { category, role, difficulty, resumeFocus, skills = [] } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Please provide a target role.' });
    }

    const isTech = String(category).toLowerCase() === 'technical';
    
    // Select a random subtopic to force prompt diversification
    const subtopicPool = isTech ? TECH_SUBTOPICS : BEHAVIORAL_SUBTOPICS;
    const randomSubtopic = subtopicPool[Math.floor(Math.random() * subtopicPool.length)];
    const randomSalt = Math.random().toString(36).substring(7);

    let resumeContextPrompt = '';
    if (resumeFocus && skills && skills.length > 0) {
      resumeContextPrompt = `
      CRITICAL TAILORING REQUIREMENT: This candidate has uploaded a resume. 
      Their resume lists the following core technical skills: ${skills.join(', ')}.
      Please formulate the first interview question specifically to probe their depth in one or more of these core skills: ${skills.slice(0, 5).join(', ')} in the context of a ${role} role.
      Do not ask generic introductory questions. Ask a professional, open-ended question that directly connects their technical skills to real-world software engineering or system architecture challenges!
      `;
    }

    const prompt = `
      You are the elite AI Interviewer at ConfidentAI (Identifier: ${randomSalt}).
      Create the first professional, highly relevant interview question for a candidate applying to a ${difficulty || 'mid-level'} ${role} role (Field: ${category || 'general'}).
      
      ${resumeContextPrompt}

      CRITICAL FORMATTING & DIVERSITY REQUIREMENT:
      - We want this interview question to be highly unique and completely different from generic interview questions.
      - Focus the question strongly on this randomly selected core competency sub-topic: **${randomSubtopic}**.
      - Ensure the wording, framing, and context of the question are creative, modern, and engaging.
      - Do NOT include any markdown formatting (like asterisks **, hashtags #, bolding, underscores) in any of the response fields. Ensure everything is in clean plain text ready for direct speech synthesis and rendering!
      - Generate a helpful tip/hint for structuring the answer (e.g. STAR method, outline key parameters).
      
      Respond strictly in this JSON structure:
      {
        "question": "The interview question text...",
        "topic": "A short 1-2 word topic title (e.g., Intro, State Management, Architecture)",
        "hint": "A short structuring hint for the candidate."
      }
    `;

    const fallback = async () => {
      try {
        const query = { isActive: true };
        const catLower = String(category).toLowerCase();
        
        if (['technical', 'hr', 'behavioral', 'case_study', 'rapid_fire'].includes(catLower)) {
          query.category = catLower;
        } else {
          query.category = 'technical';
        }

        if (role) {
          query.$or = [
            { role: new RegExp(role, 'i') },
            { role: 'Any Role' }
          ];
        }

        let dbQuestions = await Question.find(query);

        // Filter by difficulty if matches are found
        if (difficulty) {
          const diffQuestions = dbQuestions.filter(q => q.difficulty === difficulty);
          if (diffQuestions.length > 0) dbQuestions = diffQuestions;
        }

        if (dbQuestions.length > 0) {
          const selected = dbQuestions[Math.floor(Math.random() * dbQuestions.length)];
          console.log(`🎯 DB Dynamic Fallback: Loaded role-specific question for role "${role}": "${selected.topic}"`);
          return {
            question: selected.text,
            topic: selected.topic || 'Core Concept',
            hint: selected.hint || 'Outline your approach structured.'
          };
        }
      } catch (dbErr) {
        console.error('Failed to load role-specific fallback question from DB:', dbErr);
      }

      // Hardcoded fallback if DB query is empty or fails
      const pool = isTech ? TECHNICAL_FALLBACK_QUESTIONS : BEHAVIORAL_FALLBACK_QUESTIONS;
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const data = await generateGeminiJSON(prompt, fallback);
    
    // Normalize keys in case Gemini deviates slightly from the requested JSON structure
    if (data) {
      data.question = data.question || data.nextQuestion;
      data.topic = data.topic || data.nextTopic;
      data.hint = data.hint || data.nextHint;
    }
    
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Conversational answer processing — Evaluates candidate answer & generates next adaptive question
 */
exports.processResponse = async (req, res, next) => {
  try {
    const {
      questionText,
      answerText,
      previousQuestions = [],
      previousAnswers = [],
      role,
      difficulty,
      category,
      resumeFocus,
      skills = []
    } = req.body;

    if (!questionText || !answerText) {
      return res.status(400).json({ success: false, message: 'Question and answer text are required.' });
    }

    const isTech = String(category).toLowerCase() === 'technical';
    
    // Select a random subtopic to direct the next question adaptively if LLM decides to pivot
    const subtopicPool = isTech ? TECH_SUBTOPICS : BEHAVIORAL_SUBTOPICS;
    const randomSubtopic = subtopicPool[Math.floor(Math.random() * subtopicPool.length)];
    const randomSalt = Math.random().toString(36).substring(7);

    let resumeContextPrompt = '';
    if (resumeFocus && skills && skills.length > 0) {
      resumeContextPrompt = `
      CRITICAL TAILORING REQUIREMENT: This is a resume-focused technical interview.
      The candidate's resume lists these primary skills: ${skills.join(', ')}.
      Make sure to formulate the NEXT question adaptively to continue testing their senior-level competency in these technologies or related architectural patterns, bridging their current answer to their resume stack!
      `;
    }

    const prompt = `
      You are an elite senior interviewer evaluating a candidate for a ${difficulty || 'mid-level'} ${role} role (Field: ${category || 'general'}) (Salt: ${randomSalt}).
      
      Current Question: "${questionText}"
      Candidate's Response: "${answerText}"
      
      ${resumeContextPrompt}

      CRITICAL DIVERSITY, ADAPTABILITY & FORMATTING REQUIREMENT:
      - Evaluate the candidate's response. Then, generate the NEXT adaptive, conversational question.
      - Ensure the next question is completely different from the current question: "${questionText}".
      - Avoid repeating any of the previous questions asked in this session: ${JSON.stringify(previousQuestions)}.
      - If you decide to pivot to a fresh topic, feel free to design it around the following target sub-topic: **${randomSubtopic}**.
      
      Instructions & Tone Rules:
      1. Provide a short, constructive, verbal feedback remark (1-2 sentences) directly addressing the quality or technical depth of their answer. Speak with professional, warm, positive encouragement exactly like a human tech interviewer would (e.g., "That is a very structured explanation of how you handled memory leaks in Node..."). Do NOT be robotic, generic, or overly formal.
      2. Suggest one distinct tactical improvement to their answer.
      3. Suggest a "Senior Level Upgrade Phrasing" to elevate their verbal presence (e.g., "Instead of saying X, say Y").
      4. Score their answer objectively from 1 to 100 based on technical accuracy, clarity, and professionalism.
      5. Generate the NEXT question adaptively. Keep the interview natural, logical, and conversational.
      
      CRITICAL FORMATTING CONSTRAINT:
      - Do NOT use any raw markdown symbols (asterisks **, hashtags #, bold indicators, underscores, or double stars) in ANY of the JSON string fields (feedback, improvement, seniorUpgrade, nextQuestion, nextHint). Keep all text in beautiful, clean plain English ready to be read aloud by Text-to-Speech!
      
      Respond strictly in this JSON structure:
      {
        "feedback": "Verbal encouraging remark to speak out loud...",
        "improvement": "Specific constructive feedback point...",
        "seniorUpgrade": "Senior-level phrasing tip...",
        "score": 85,
        "nextQuestion": "The next custom adaptive interview question...",
        "nextTopic": "Next question topic (1-2 words)",
        "nextHint": "Structuring hint for the next question."
      }
    `;

    const fallback = async () => {
      const length = answerText.split(/\s+/).length;
      const lower = answerText.toLowerCase();
      const score = Math.min(95, Math.max(30, 45 + (length > 25 ? 25 : length) + (lower.includes('because') || lower.includes('example') ? 15 : 0)));
      
      try {
        const query = { isActive: true };
        const catLower = String(category).toLowerCase();
        
        if (['technical', 'hr', 'behavioral', 'case_study', 'rapid_fire'].includes(catLower)) {
          query.category = catLower;
        } else {
          query.category = 'technical';
        }

        if (role) {
          query.$or = [
            { role: new RegExp(role, 'i') },
            { role: 'Any Role' }
          ];
        }

        let dbQuestions = await Question.find(query);

        // Filter out previously asked questions to prevent repeats
        if (previousQuestions && previousQuestions.length > 0) {
          dbQuestions = dbQuestions.filter(q => !previousQuestions.includes(q.text));
        }

        // Try filtering by difficulty
        if (difficulty) {
          const diffQuestions = dbQuestions.filter(q => q.difficulty === difficulty);
          if (diffQuestions.length > 0) dbQuestions = diffQuestions;
        }

        if (dbQuestions.length > 0) {
          const selected = dbQuestions[Math.floor(Math.random() * dbQuestions.length)];
          console.log(`🎯 DB Dynamic Followup Fallback: Loaded question for role "${role}": "${selected.topic}"`);
          return {
            feedback: `I've analyzed your explanation. You demonstrated a clear operational understanding of the situation.`,
            improvement: `Try expanding on the specific hurdles you faced and how you validated the outcome.`,
            seniorUpgrade: `Instead of saying "I did it because it was good," say: "I implemented this architecture as a core scaling solution to mitigate latency..."`,
            score,
            nextQuestion: selected.text,
            nextTopic: selected.topic || 'General',
            nextHint: selected.hint || 'Outline key parameters.'
          };
        }
      } catch (dbErr) {
        console.error('Failed to query next fallback from DB:', dbErr);
      }

      // Hardcoded fallback if DB is empty or fails
      const pool = isTech ? TECHNICAL_FALLBACK_QUESTIONS : BEHAVIORAL_FALLBACK_QUESTIONS;
      const unasked = pool.filter(q => !previousQuestions.includes(q.question));
      const selected = unasked.length > 0 ? unasked[Math.floor(Math.random() * unasked.length)] : pool[Math.floor(Math.random() * pool.length)];

      return {
        feedback: `I've analyzed your explanation. You demonstrated a clear operational understanding of the situation.`,
        improvement: `Try expanding on the specific hurdles you faced and how you validated the outcome.`,
        seniorUpgrade: `Instead of saying "I did it because it was good," say: "I implemented this architecture as a core scaling solution to mitigate latency..."`,
        score,
        nextQuestion: selected.question,
        nextTopic: selected.topic,
        nextHint: selected.hint
      };
    };

    const data = await generateGeminiJSON(prompt, fallback);
    
    // Normalize keys in case Gemini deviates slightly from the requested JSON structure
    if (data) {
      data.nextQuestion = data.nextQuestion || data.question;
      data.nextTopic = data.nextTopic || data.topic;
      data.nextHint = data.nextHint || data.hint;
    }
    
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
