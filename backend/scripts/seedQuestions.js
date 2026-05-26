/* ── scripts/seedQuestions.js ───────────────────────────────────── */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

const questions = [

  // ══════════════════════════════════════════════════════
  // TECHNICAL — BEGINNER
  // ══════════════════════════════════════════════════════
  { category:'technical', difficulty:'beginner', topic:'JavaScript', role:'Frontend Developer',
    text:'What is the difference between `let`, `const`, and `var` in JavaScript?',
    hint:'Focus on scope, hoisting, and mutability.',
    sampleAnswer:'`var` is function-scoped and hoisted. `let` and `const` are block-scoped. `const` prevents reassignment but not mutation of objects.',
    tags:['js','scope'] },

  { category:'technical', difficulty:'beginner', topic:'JavaScript', role:'Frontend Developer',
    text:'Explain what a closure is in JavaScript with an example.',
    hint:'Think about functions that remember their outer scope.',
    sampleAnswer:'A closure is a function that retains access to its outer scope even after the outer function returns. Example: a counter factory function.',
    tags:['js','closure'] },

  { category:'technical', difficulty:'beginner', topic:'HTML/CSS', role:'Frontend Developer',
    text:'What is the CSS Box Model?',
    hint:'Content, padding, border, margin.',
    sampleAnswer:'The box model describes how elements are rendered: content area, surrounded by padding, then border, then margin.',
    tags:['css','layout'] },

  { category:'technical', difficulty:'beginner', topic:'Data Structures', role:'Backend Developer',
    text:'What is the difference between a stack and a queue?',
    hint:'LIFO vs FIFO.',
    sampleAnswer:'A stack is Last In First Out (LIFO). A queue is First In First Out (FIFO). Stack uses push/pop; queue uses enqueue/dequeue.',
    tags:['dsa','stack','queue'] },

  { category:'technical', difficulty:'beginner', topic:'Networking', role:'Backend Developer',
    text:'What is the difference between HTTP and HTTPS?',
    hint:'Security and encryption.',
    sampleAnswer:'HTTPS uses TLS/SSL encryption, making data transfer secure. HTTP sends data in plaintext.',
    tags:['networking','security'] },

  { category:'technical', difficulty:'beginner', topic:'Database', role:'Backend Developer',
    text:'What is the difference between SQL and NoSQL databases?',
    hint:'Structure, scalability, use cases.',
    sampleAnswer:'SQL is relational, uses tables and schemas. NoSQL is document/key-value/graph based, schema-less, and often more horizontally scalable.',
    tags:['database','sql','nosql'] },

  { category:'technical', difficulty:'beginner', topic:'Git', role:'Any Role',
    text:'What is the difference between `git merge` and `git rebase`?',
    hint:'History preservation vs linear history.',
    sampleAnswer:'`git merge` combines branches and preserves history with a merge commit. `git rebase` rewrites history to create a linear commit line.',
    tags:['git','version-control'] },

  { category:'technical', difficulty:'beginner', topic:'OOP', role:'Backend Developer',
    text:'What are the four pillars of Object-Oriented Programming?',
    hint:'APIE.',
    sampleAnswer:'Abstraction, Polymorphism, Inheritance, and Encapsulation.',
    tags:['oop','concepts'] },

  { category:'technical', difficulty:'beginner', topic:'React', role:'Frontend Developer',
    text:'What is the Virtual DOM in React and why is it used?',
    hint:'Performance and diffing algorithm.',
    sampleAnswer:'The Virtual DOM is an in-memory representation of the real DOM. React uses a diffing algorithm to update only changed parts, improving performance.',
    tags:['react','dom'] },

  { category:'technical', difficulty:'beginner', topic:'REST', role:'Full Stack',
    text:'What are the main HTTP methods and when would you use each?',
    hint:'GET, POST, PUT, PATCH, DELETE.',
    sampleAnswer:'GET fetches data, POST creates, PUT replaces, PATCH partially updates, DELETE removes. These map to CRUD operations in REST APIs.',
    tags:['rest','http'] },

  // ══════════════════════════════════════════════════════
  // TECHNICAL — INTERMEDIATE
  // ══════════════════════════════════════════════════════
  { category:'technical', difficulty:'intermediate', topic:'JavaScript', role:'Frontend Developer',
    text:'Explain event delegation in JavaScript.',
    hint:'Bubbling and single listener.',
    sampleAnswer:'Event delegation attaches a single listener to a parent element instead of multiple children. Events bubble up from child to parent, so you check `event.target` to identify the source.',
    tags:['js','events'] },

  { category:'technical', difficulty:'intermediate', topic:'Data Structures', role:'Backend Developer',
    text:'Explain the time complexity of common operations in a HashMap.',
    hint:'Average vs worst case.',
    sampleAnswer:'Average case O(1) for get, put, delete. Worst case O(n) due to hash collisions. Load factor and rehashing affect performance.',
    tags:['dsa','hashmap','complexity'] },

  { category:'technical', difficulty:'intermediate', topic:'System Design', role:'Backend Developer',
    text:'What is database indexing and what are its trade-offs?',
    hint:'Speed vs storage.',
    sampleAnswer:'Indexes speed up reads by creating a lookup structure (B-tree). Trade-offs: more storage, slower writes because indexes must be updated.',
    tags:['database','indexing'] },

  { category:'technical', difficulty:'intermediate', topic:'React', role:'Frontend Developer',
    text:'What is the difference between `useMemo` and `useCallback` in React?',
    hint:'Memoizing values vs functions.',
    sampleAnswer:'`useMemo` memoizes a computed value. `useCallback` memoizes a function reference. Both prevent unnecessary recalculations on re-renders.',
    tags:['react','hooks','performance'] },

  { category:'technical', difficulty:'intermediate', topic:'Algorithms', role:'Backend Developer',
    text:'Explain the difference between BFS and DFS graph traversal.',
    hint:'Queue vs stack, use cases.',
    sampleAnswer:'BFS uses a queue and explores level by level — good for shortest path. DFS uses a stack/recursion and goes deep first — good for cycle detection or topological sort.',
    tags:['dsa','graph','algorithms'] },

  { category:'technical', difficulty:'intermediate', topic:'System Design', role:'Full Stack',
    text:'What is REST vs GraphQL? When would you choose one over the other?',
    hint:'Over/under-fetching, flexibility.',
    sampleAnswer:'REST uses fixed endpoints; GraphQL lets clients request exactly the data they need. GraphQL reduces over-fetching. REST is simpler and better cached.',
    tags:['rest','graphql','api'] },

  { category:'technical', difficulty:'intermediate', topic:'Node.js', role:'Backend Developer',
    text:'What is the Node.js event loop and how does it handle async operations?',
    hint:'Call stack, callback queue, microtasks.',
    sampleAnswer:'Node.js is single-threaded. The event loop processes the call stack, then microtasks (promises), then the callback queue (setTimeout, I/O). This enables non-blocking I/O.',
    tags:['nodejs','async','event-loop'] },

  { category:'technical', difficulty:'intermediate', topic:'CSS', role:'Frontend Developer',
    text:'Explain Flexbox vs CSS Grid. When would you use each?',
    hint:'1D vs 2D layout.',
    sampleAnswer:'Flexbox is 1D (row or column). Grid is 2D (rows and columns). Use Flexbox for components, Grid for page layouts.',
    tags:['css','flexbox','grid'] },

  { category:'technical', difficulty:'intermediate', topic:'Security', role:'Full Stack',
    text:'What is SQL injection and how do you prevent it?',
    hint:'Parameterized queries, ORM.',
    sampleAnswer:'SQL injection inserts malicious SQL into inputs. Prevent it with parameterized queries, ORMs, input validation, and never concatenating user input into queries.',
    tags:['security','sql','web'] },

  { category:'technical', difficulty:'intermediate', topic:'JavaScript', role:'Full Stack',
    text:'What is the difference between `Promise.all`, `Promise.race`, and `Promise.allSettled`?',
    hint:'Failure behavior.',
    sampleAnswer:'`Promise.all` rejects if any promise fails. `Promise.race` resolves/rejects with the first to settle. `Promise.allSettled` waits for all and returns status of each.',
    tags:['js','promises','async'] },

  // ══════════════════════════════════════════════════════
  // TECHNICAL — ADVANCED
  // ══════════════════════════════════════════════════════
  { category:'technical', difficulty:'advanced', topic:'System Design', role:'Full Stack',
    text:'Design a URL shortener like bit.ly. Walk me through your approach.',
    hint:'Hashing, storage, redirection, scale.',
    sampleAnswer:'Use a base62 hash to generate short codes, store in a key-value store (Redis + DB). Handle redirects with 301/302. Scale with CDN, caching, and sharding.',
    tags:['system-design','scale'] },

  { category:'technical', difficulty:'advanced', topic:'System Design', role:'Backend Developer',
    text:'How would you design a notification system that handles millions of users?',
    hint:'Message queues, fan-out, push vs pull.',
    sampleAnswer:'Use a message queue (Kafka/RabbitMQ) for fan-out. Separate workers for email, SMS, push. Store preferences in DB, use Redis for rate limiting and deduplication.',
    tags:['system-design','notifications','scale'] },

  { category:'technical', difficulty:'advanced', topic:'Algorithms', role:'Backend Developer',
    text:'Explain the CAP theorem and its implications for distributed systems.',
    hint:'Consistency, Availability, Partition tolerance — pick 2.',
    sampleAnswer:'CAP theorem states you can only guarantee 2 of 3: Consistency (all nodes see same data), Availability (every request gets response), Partition Tolerance (system works despite network failures).',
    tags:['distributed-systems','cap','theory'] },

  { category:'technical', difficulty:'advanced', topic:'JavaScript', role:'Frontend Developer',
    text:'How does JavaScript garbage collection work? What causes memory leaks?',
    hint:'Mark-and-sweep, references.',
    sampleAnswer:'JS uses mark-and-sweep GC. Memory leaks occur via: global variables, detached DOM nodes, event listeners not removed, closures holding references, and circular references.',
    tags:['js','memory','performance'] },

  { category:'technical', difficulty:'advanced', topic:'System Design', role:'DevOps Engineer',
    text:'Design a CI/CD pipeline for a microservices application.',
    hint:'Git triggers, build, test, deploy stages.',
    sampleAnswer:'On push: run linting + unit tests, build Docker image, push to registry, deploy to staging, run integration tests, promote to prod with blue-green or canary deployment.',
    tags:['devops','cicd','microservices'] },

  // ══════════════════════════════════════════════════════
  // HR — ALL LEVELS
  // ══════════════════════════════════════════════════════
  { category:'hr', difficulty:'beginner', topic:'Introduction', role:'Any Role',
    text:'Tell me about yourself.',
    hint:'Structure: present role, past experience, future goals. Keep it under 2 minutes.',
    sampleAnswer:'I\'m a software engineer with X years of experience in Y. I\'ve worked on Z, where I accomplished W. I\'m excited about this role because...',
    tags:['introduction','personal'] },

  { category:'hr', difficulty:'beginner', topic:'Motivation', role:'Any Role',
    text:'Why do you want to work at our company?',
    hint:'Research the company first. Mention mission, culture, product.',
    sampleAnswer:'I admire your mission of [X] and the product\'s impact on [Y]. Your engineering culture of [Z] aligns with how I like to work.',
    tags:['motivation','company-research'] },

  { category:'hr', difficulty:'beginner', topic:'Strengths', role:'Any Role',
    text:'What is your greatest strength and how has it helped you professionally?',
    hint:'Pick one specific strength and back it with a concrete example.',
    sampleAnswer:'My greatest strength is problem-solving. In my last role, I identified a performance bottleneck that was causing 20% of API calls to time out and reduced latency by 60%.',
    tags:['strengths','self-awareness'] },

  { category:'hr', difficulty:'beginner', topic:'Weaknesses', role:'Any Role',
    text:'What is your greatest weakness? What are you doing to improve it?',
    hint:'Be honest but show self-awareness and active improvement.',
    sampleAnswer:'I tend to over-engineer solutions. I\'ve been working on this by setting time-boxes and asking "what\'s the simplest thing that could work?" before diving in.',
    tags:['weaknesses','growth'] },

  { category:'hr', difficulty:'intermediate', topic:'Salary', role:'Any Role',
    text:'What are your salary expectations?',
    hint:'Research market rates. Give a range, not a single number.',
    sampleAnswer:'Based on my research and experience level, I\'m targeting ₹X–₹Y LPA. I\'m open to discussion based on the complete compensation package.',
    tags:['salary','negotiation'] },

  { category:'hr', difficulty:'intermediate', topic:'Career Goals', role:'Any Role',
    text:'Where do you see yourself in 5 years?',
    hint:'Align with the company\'s growth path. Show ambition but realism.',
    sampleAnswer:'I see myself growing into a senior/lead engineer role, taking ownership of larger systems. I\'d love to mentor junior engineers and contribute to technical strategy.',
    tags:['career','goals','growth'] },

  { category:'hr', difficulty:'intermediate', topic:'Conflict', role:'Any Role',
    text:'Describe a time you disagreed with your manager. How did you handle it?',
    hint:'Show respect, data-driven approach, and willingness to compromise.',
    sampleAnswer:'I disagreed with a timeline decision. I scheduled a 1:1, presented my concerns with data on technical debt risk, and we agreed on a compromise that added 2 days for testing.',
    tags:['conflict','manager','communication'] },

  { category:'hr', difficulty:'advanced', topic:'Resignation', role:'Any Role',
    text:'Why are you leaving your current job?',
    hint:'Be positive. Focus on growth, not negativity about current employer.',
    sampleAnswer:'I\'ve learned a lot in my current role but I\'m looking for new challenges where I can [grow specific skill / work on bigger scale problems / have more ownership].',
    tags:['resignation','motivation'] },

  { category:'hr', difficulty:'advanced', topic:'Negotiation', role:'Any Role',
    text:'We\'d like to offer you the role, but our budget is below your expectation. What would you do?',
    hint:'Negotiate professionally — consider total comp, not just base.',
    sampleAnswer:'I\'m very excited about this opportunity. Could we explore other components — signing bonus, equity, extra PTO, or a 6-month performance review? I want to make this work.',
    tags:['negotiation','offer'] },

  // ══════════════════════════════════════════════════════
  // BEHAVIORAL
  // ══════════════════════════════════════════════════════
  { category:'behavioral', difficulty:'beginner', topic:'Teamwork', role:'Any Role',
    text:'Tell me about a time you worked effectively in a team.',
    hint:'Use the STAR method: Situation, Task, Action, Result.',
    sampleAnswer:'Situation: Our team had a tight sprint deadline. Task: I was responsible for the API layer. Action: I paired with the frontend engineer daily. Result: We shipped on time with 0 bugs.',
    tags:['teamwork','star','collaboration'] },

  { category:'behavioral', difficulty:'beginner', topic:'Deadline', role:'Any Role',
    text:'Describe a time you had to meet a tight deadline. How did you manage it?',
    hint:'Prioritization and communication are key here.',
    sampleAnswer:'I broke the project into must-haves vs nice-to-haves, communicated blockers early, worked efficiently, and delivered the core features on time while deferring non-critical items.',
    tags:['deadline','prioritization'] },

  { category:'behavioral', difficulty:'intermediate', topic:'Failure', role:'Any Role',
    text:'Tell me about a time you failed. What did you learn?',
    hint:'Own it, show what you learned, and how you applied that learning.',
    sampleAnswer:'I underestimated a migration task and missed a sprint goal. I learned to break work into smaller estimates, add buffers, and flag risks early. I applied this in the next sprint and delivered ahead of schedule.',
    tags:['failure','learning','growth'] },

  { category:'behavioral', difficulty:'intermediate', topic:'Conflict', role:'Any Role',
    text:'Tell me about a conflict with a coworker and how you resolved it.',
    hint:'Show empathy, active listening, and constructive resolution.',
    sampleAnswer:'A colleague and I disagreed on an architecture choice. I requested a design review meeting, we each presented our approach, and combined the best parts of both solutions.',
    tags:['conflict','resolution','communication'] },

  { category:'behavioral', difficulty:'intermediate', topic:'Leadership', role:'Team Lead',
    text:'Tell me about a time you led a project or team.',
    hint:'Describe your leadership style, decisions made, and measurable outcome.',
    sampleAnswer:'I led a 4-person team to migrate our monolith to microservices over 3 months. I ran daily standups, unblocked team members, coordinated with stakeholders, and we launched 2 weeks ahead of schedule.',
    tags:['leadership','project-management'] },

  { category:'behavioral', difficulty:'advanced', topic:'Ambiguity', role:'Any Role',
    text:'Tell me about a time you had to make a decision with incomplete information.',
    hint:'Show structured thinking under uncertainty.',
    sampleAnswer:'During an outage I had limited logs. I formed hypotheses, tested the most likely one first (a DB connection pool issue), confirmed it, and rolled back a config change to restore service in 12 minutes.',
    tags:['ambiguity','decision-making','pressure'] },

  { category:'behavioral', difficulty:'advanced', topic:'Influence', role:'Senior Developer',
    text:'Describe a time you influenced a team or organization to change a process.',
    hint:'Show initiative, communication, and measurable impact.',
    sampleAnswer:'I noticed our code review process was slow. I proposed a 48-hour SLA and async review guidelines. After presenting data showing 3x faster review times in pilot teams, the org adopted it.',
    tags:['influence','process','leadership'] },

  // ══════════════════════════════════════════════════════
  // CASE STUDY
  // ══════════════════════════════════════════════════════
  { category:'case_study', difficulty:'beginner', topic:'Product Thinking', role:'Product Manager',
    text:'How would you improve the onboarding experience for a new app?',
    hint:'User research, friction reduction, activation metrics.',
    sampleAnswer:'I\'d map the current onboarding funnel, identify drop-off points via analytics, interview churned users, then A/B test changes like reducing form fields, adding progress indicators, and showing value quickly.',
    tags:['product','onboarding','ux'] },

  { category:'case_study', difficulty:'intermediate', topic:'Estimation', role:'Product Manager',
    text:'Estimate the number of ATMs in India.',
    hint:'Break it down: population, bank accounts, transactions per day, ATM capacity.',
    sampleAnswer:'India has ~1.4B people, ~50% banked = 700M account holders. Each ATM serves ~200 transactions/day, ~1000 users. 700M / 1000 ≈ 700,000 ATMs. India actually has ~260,000 — reasonable ballpark.',
    tags:['estimation','market-sizing'] },

  { category:'case_study', difficulty:'intermediate', topic:'Strategy', role:'Business Analyst',
    text:'A company\'s revenue dropped 20% last quarter. How would you diagnose the problem?',
    hint:'Segment by product, region, customer type. Check internal vs external factors.',
    sampleAnswer:'I\'d first check if it\'s a single product/segment or company-wide. Then examine: new competitors, pricing changes, churn rates, sales pipeline, seasonality, and product issues.',
    tags:['analysis','revenue','strategy'] },

  { category:'case_study', difficulty:'advanced', topic:'Product Design', role:'Product Manager',
    text:'Design a feature for a food delivery app that increases order frequency.',
    hint:'Define the metric, identify user pain points, propose and prioritize solutions.',
    sampleAnswer:'Goal: increase weekly orders/user. Pain point: decision fatigue. Solution: "Order Again in 1-tap" with personalized meal suggestions based on past orders and time-of-day. Measure: order frequency per active user.',
    tags:['product-design','metrics','user-research'] },

  // ══════════════════════════════════════════════════════
  // RAPID FIRE
  // ══════════════════════════════════════════════════════
  { category:'rapid_fire', difficulty:'beginner', topic:'JavaScript', role:'Any Role',
    text:'What does `typeof null` return in JavaScript?',
    expectedAnswer:'"object" — this is a known JavaScript bug.',
    tags:['js','trivia'] },

  { category:'rapid_fire', difficulty:'beginner', topic:'HTTP', role:'Any Role',
    text:'What HTTP status code means "Not Found"?',
    expectedAnswer:'404',
    tags:['http','trivia'] },

  { category:'rapid_fire', difficulty:'beginner', topic:'Git', role:'Any Role',
    text:'What git command undoes the last commit but keeps the changes staged?',
    expectedAnswer:'`git reset --soft HEAD~1`',
    tags:['git','trivia'] },

  { category:'rapid_fire', difficulty:'beginner', topic:'CSS', role:'Any Role',
    text:'What CSS property makes an element invisible but still take up space?',
    expectedAnswer:'`visibility: hidden`',
    tags:['css','trivia'] },

  { category:'rapid_fire', difficulty:'intermediate', topic:'Algorithms', role:'Any Role',
    text:'What is the time complexity of binary search?',
    expectedAnswer:'O(log n)',
    tags:['dsa','trivia'] },

  { category:'rapid_fire', difficulty:'intermediate', topic:'Database', role:'Any Role',
    text:'What does ACID stand for in databases?',
    expectedAnswer:'Atomicity, Consistency, Isolation, Durability',
    tags:['database','trivia'] },

  { category:'rapid_fire', difficulty:'intermediate', topic:'JavaScript', role:'Any Role',
    text:'What is the output of `0.1 + 0.2 === 0.3` in JavaScript?',
    expectedAnswer:'false — due to floating point precision',
    tags:['js','trivia'] },

  { category:'rapid_fire', difficulty:'intermediate', topic:'Networking', role:'Any Role',
    text:'What port does HTTPS run on by default?',
    expectedAnswer:'443',
    tags:['networking','trivia'] },

  { category:'rapid_fire', difficulty:'advanced', topic:'System Design', role:'Any Role',
    text:'What is the difference between horizontal and vertical scaling?',
    expectedAnswer:'Horizontal = add more machines. Vertical = add more power to existing machine.',
    tags:['system-design','trivia'] },

  { category:'rapid_fire', difficulty:'advanced', topic:'JavaScript', role:'Any Role',
    text:'What is the difference between `==` and `===` in JavaScript?',
    expectedAnswer:'`==` does type coercion; `===` checks type AND value (strict equality).',
    tags:['js','trivia'] },

  { category:'rapid_fire', difficulty:'advanced', topic:'Database', role:'Any Role',
    text:'What is a deadlock in a database?',
    expectedAnswer:'Two transactions each waiting for the other to release a lock, causing both to hang indefinitely.',
    tags:['database','trivia'] },
];

async function seedQuestions() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Clear existing questions
  await Question.deleteMany({});
  console.log('🗑️   Cleared existing questions');

  // Insert all
  const inserted = await Question.insertMany(questions);
  console.log(`🌱  Seeded ${inserted.length} questions across all categories`);

  // Log breakdown
  const stats = await Question.aggregate([
    { $group: { _id: { cat: '$category', diff: '$difficulty' }, count: { $sum: 1 } } },
    { $sort: { '_id.cat': 1, '_id.diff': 1 } },
  ]);
  console.log('\n📊  Breakdown:');
  stats.forEach(s => console.log(`    ${s._id.cat} / ${s._id.diff}: ${s.count} questions`));

  await mongoose.disconnect();
  console.log('\n✅  Question seeding complete.');
  process.exit(0);
}

seedQuestions().catch(err => {
  console.error('❌  Seed error:', err);
  process.exit(1);
});
