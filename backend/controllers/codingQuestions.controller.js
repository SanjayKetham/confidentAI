/* ── controllers/codingQuestions.controller.js ─────────────────────── */
const CodingQuestion = require('../models/CodingQuestion');

// ── GET /api/coding-questions ──
async function getCodingQuestions(req, res, next) {
  try {
    const { category, difficulty } = req.query;
    
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    // Project out optimalSolutions and raw testCases for standard candidate views, but keep testCases for admins
    const projection = req.user?.role === 'admin' ? '-optimalSolutions' : '-optimalSolutions -testCases';
    const questions = await CodingQuestion.find(filter)
      .select(projection)
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/coding-questions/:slug ──
async function getCodingQuestionBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const question = await CodingQuestion.findOne({ slug });

    if (!question || (!question.isActive && req.user?.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Coding challenge not found.' });
    }

    // Hide optimalSolutions and non-sample test cases unless the requesting user is an admin
    const questionObj = question.toObject();
    if (req.user?.role !== 'admin') {
      delete questionObj.optimalSolutions;
      // Only return sample test cases for candidate previews
      questionObj.testCases = questionObj.testCases.filter(tc => tc.isSample);
    }

    res.json({
      success: true,
      question: questionObj,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/coding-questions (Admin only) ──
async function createCodingQuestion(req, res, next) {
  try {
    const {
      slug,
      title,
      difficulty,
      category,
      description,
      examples,
      constraints,
      hints,
      starterCodes,
      optimalSolutions,
      testCases,
      entryFunctionName,
    } = req.body;

    // Check slug uniqueness
    const existing = await CodingQuestion.findOne({ slug: slug.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `A challenge with slug '${slug}' already exists.` });
    }

    const question = await CodingQuestion.create({
      slug: slug.trim().toLowerCase(),
      title,
      difficulty,
      category,
      description,
      examples,
      constraints,
      hints,
      starterCodes,
      optimalSolutions,
      testCases,
      entryFunctionName,
    });

    res.status(201).json({
      success: true,
      message: 'Coding challenge created successfully! 💻🚀',
      question,
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/coding-questions/:id (Admin only) ──
async function updateCodingQuestion(req, res, next) {
  try {
    const { id } = req.params;

    const question = await CodingQuestion.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Coding challenge not found.' });
    }

    res.json({
      success: true,
      message: 'Coding challenge updated successfully! 📝⚙️',
      question,
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/coding-questions/:id (Admin only) ──
async function deleteCodingQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await CodingQuestion.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Coding challenge not found.' });
    }

    res.json({
      success: true,
      message: 'Coding challenge deleted successfully from MongoDB! 🗑️',
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/coding-questions/seed (Admin only) ──
// Utility to seed the initial 5 standard questions to Mongo automatically
async function seedCodingQuestions(req, res, next) {
  try {
    const defaultChallenges = [
      {
        slug: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays & Hashing',
        description: 'Given an array of integers `nums` and an integer `target`, return *indices of the two numbers* such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.',
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
          },
        ],
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.',
        ],
        hints: [
          'A brute force approach would search all pairs, which takes O(n^2) time. Can we do better?',
          'Use a Hash Map to store elements we have already visited and their indexes.',
          'The complement lookup in a Hash Map is O(1) time complexity, reducing the overall runtime to O(n).',
        ],
        entryFunctionName: 'twoSum',
        starterCodes: {
          javascript: `function twoSum(nums, target) {\n  // Write your solution here\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
          python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    visited = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in visited:\n            return [visited[complement], i]\n        visited[num] = i\n    return []`,
          cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> visited;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (visited.count(complement)) {\n                return {visited[complement], i};\n            }\n            visited[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
          java: `import java.util.HashMap;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        HashMap<Integer, Integer> visited = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (visited.containsKey(complement)) {\n                return new int[] { visited.get(complement), i };\n            }\n            visited.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
          python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    visited = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in visited: return [visited[comp], i]\n        visited[num] = i\n    return []`,
        },
        testCases: [
          { inputArgs: '[[2,7,11,15], 9]', expectedOutput: '[0,1]', isSample: true },
          { inputArgs: '[[3,2,4], 6]', expectedOutput: '[1,2]', isSample: true },
          { inputArgs: '[[3,3], 6]', expectedOutput: '[0,1]', isSample: false },
        ],
      },
      {
        slug: 'valid-parentheses',
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        category: 'Stack',
        description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
        examples: [
          {
            input: 's = "()"',
            output: 'true',
            explanation: 'The brackets match perfectly.',
          },
          {
            input: 's = "()[]{}"',
            output: 'true',
            explanation: 'All open brackets are closed by their respective partners in order.',
          },
        ],
        constraints: [
          '1 <= s.length <= 10^4',
          's consists of parentheses only: "()[]{}"',
        ],
        hints: [
          'We must process brackets sequentially. The last bracket opened must be the first one closed.',
          'A Stack data structure (LIFO) fits this problem perfectly.',
        ],
        entryFunctionName: 'isValid',
        starterCodes: {
          javascript: `function isValid(s) {\n  // Write your solution here\n  const stack = [];\n  const bracketMap = { ')': '(', '}': '{', ']': '[' };\n  for (let char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else {\n      const top = stack.pop();\n      if (top !== bracketMap[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}`,
          python: `def isValid(s: str) -> bool:\n    stack = []\n    brackets = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in brackets.values():\n            stack.append(char)\n        elif char in brackets.keys():\n            if not stack or stack.pop() != brackets[char]:\n                return False\n        else:\n            return False\n    return len(stack) == 0`,
          cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        stack<char> st;\n        for (char c : s) {\n            if (c == '(' || c == '{' || c == '[') {\n                st.push(c);\n            } else {\n                if (st.empty()) return false;\n                if (c == ')' && st.top() != '(') return false;\n                if (c == '}' && st.top() != '{') return false;\n                if (c == ']' && st.top() != '[') return false;\n                st.pop();\n            }\n        }\n        return st.empty();\n    }\n};`,
          java: `import java.util.Stack;\n\nclass Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(' || c == '{' || c == '[') {\n                stack.push(c);\n            } else {\n                if (stack.isEmpty()) return false;\n                char top = stack.pop();\n                if (c == ')' && top != '(') return false;\n                if (c == '}' && top != '{') return false;\n                if (c == ']' && top != '[') return false;\n            }\n        }\n        return stack.isEmpty();\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (let char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else {\n      if (stack.pop() !== map[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}`,
        },
        testCases: [
          { inputArgs: '["()"]', expectedOutput: 'true', isSample: true },
          { inputArgs: '["()[]{}"]', expectedOutput: 'true', isSample: true },
          { inputArgs: '["(]"]', expectedOutput: 'false', isSample: false },
        ],
      },
      {
        slug: 'longest-substring',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        category: 'Sliding Window',
        description: 'Given a string `s`, find the length of the **longest substring** without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.',
        examples: [
          {
            input: 's = "abcabcbb"',
            output: '3',
            explanation: 'The answer is "abc", with a length of 3.',
          },
        ],
        constraints: [
          '0 <= s.length <= 5 * 10^4',
          's consists of English letters, digits, symbols and spaces.',
        ],
        hints: [
          'Can you traverse the string once while maintaining a sliding window of non-repeating characters?',
          'Use a set or map to store the characters in the current window.',
        ],
        entryFunctionName: 'lengthOfLongestSubstring',
        starterCodes: {
          javascript: `function lengthOfLongestSubstring(s) {\n  const charSet = new Set();\n  let left = 0;\n  let maxLength = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (charSet.has(s[right])) {\n      charSet.delete(s[left]);\n      left++;\n    }\n    charSet.add(s[right]);\n    maxLength = Math.max(maxLength, right - left + 1);\n  }\n  return maxLength;\n}`,
          python: `def lengthOfLongestSubstring(s: str) -> int:\n    char_set = set()\n    left = 0\n    max_len = 0\n    for right in range(len(s)):\n        while s[right] in char_set:\n            char_set.remove(s[left])\n            left += 1\n        char_set.add(s[right])\n        max_len = max(max_len, right - left + 1)\n    return max_len`,
          cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_set<char> charSet;\n        int left = 0;\n        int maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (charSet.count(s[right])) {\n                charSet.erase(s[left]);\n                left++;\n            }\n            charSet.insert(s[right]);\n            maxLen = max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n};`,
          java: `import java.util.HashSet;\n\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        HashSet<Character> charSet = new HashSet<>();\n        int left = 0;\n        int maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (charSet.contains(s.charAt(right))) {\n                charSet.remove(s.charAt(left));\n                left++;\n            }\n            charSet.add(s.charAt(right));\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function lengthOfLongestSubstring(s) {\n  const charSet = new Set();\n  let left = 0, maxLength = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (charSet.has(s[right])) {\n      charSet.delete(s[left++]);\n    }\n    charSet.add(s[right]);\n    maxLength = Math.max(maxLength, right - left + 1);\n  }\n  return maxLength;\n}`,
        },
        testCases: [
          { inputArgs: '["abcabcbb"]', expectedOutput: '3', isSample: true },
          { inputArgs: '["bbbbb"]', expectedOutput: '1', isSample: true },
          { inputArgs: '["pwwkew"]', expectedOutput: '3', isSample: false },
        ],
      },
      {
        slug: 'binary-search',
        title: 'Binary Search',
        difficulty: 'Easy',
        category: 'Algorithms',
        description: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
        examples: [
          {
            input: 'nums = [-1,0,3,5,9,12], target = 9',
            output: '4',
            explanation: '9 exists in nums and its index is 4.',
          },
        ],
        constraints: [
          '1 <= nums.length <= 10^4',
          '-10^4 < nums[i], target < 10^4',
          'All the integers in nums are unique.',
          'nums is sorted in ascending order.',
        ],
        hints: [
          'Use a two-pointer approach with left and right boundaries.',
          'Calculate the midpoint: mid = left + Math.floor((right - left) / 2).',
        ],
        entryFunctionName: 'search',
        starterCodes: {
          javascript: `function search(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
          python: `def search(nums: list[int], target: int) -> int:\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = left + (right - left) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1`,
          cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int left = 0, right = nums.size() - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n};`,
          java: `class Solution {\n    public int search(int[] nums, int target) {\n        int left = 0, right = nums.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function search(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left <= right) {\n    const mid = (left + right) >> 1;\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
        },
        testCases: [
          { inputArgs: '[[-1,0,3,5,9,12], 9]', expectedOutput: '4', isSample: true },
          { inputArgs: '[[-1,0,3,5,9,12], 2]', expectedOutput: '-1', isSample: true },
        ],
      },
      {
        slug: 'lru-cache',
        title: 'LRU Cache',
        difficulty: 'Hard',
        category: 'Design',
        description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(capacity) Initialize the LRU cache with positive size capacity.\n- int get(key) Return the value of the key if the key exists, otherwise return -1.\n- void put(key, value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.\n\nThe functions `get` and `put` must each run in `O(1)` average time complexity.',
        examples: [
          {
            input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
            output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
            explanation: 'LRUCache cache = new LRUCache(2);\ncache.put(1, 1);\ncache.put(2, 2);\ncache.get(1); // returns 1\ncache.put(3, 3); // evicts key 2\ncache.get(2); // returns -1',
          },
        ],
        constraints: [
          '1 <= capacity <= 3000',
          '0 <= key <= 10^4',
          '0 <= value <= 10^5',
          'At most 2 * 10^5 calls will be made to get and put.',
        ],
        hints: [
          'A Hash Map combined with a Doubly Linked List is the classic solution for O(1) LRU get and put.',
          'The Hash Map provides O(1) lookup to the nodes in the Doubly Linked List.',
        ],
        entryFunctionName: 'LRUCache',
        starterCodes: {
          javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.cache.has(key)) this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      const oldest = this.cache.keys().next().value;\n      this.cache.delete(oldest);\n    }\n  }\n}`,
          python: `class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n    def get(self, key: int) -> int:\n        if key not in self.cache: return -1\n        val = self.cache.pop(key)\n        self.cache[key] = val\n        return val\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache: self.cache.pop(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity:\n            oldest = next(iter(self.cache))\n            self.cache.pop(oldest)`,
          cpp: `class LRUCache {\nprivate:\n    int cap;\n    list<pair<int, int>> lru;\n    unordered_map<int, list<pair<int, int>>::iterator> cache;\npublic:\n    LRUCache(int capacity) {\n        cap = capacity;\n    }\n    int get(int key) {\n        if (!cache.count(key)) return -1;\n        lru.splice(lru.begin(), lru, cache[key]);\n        return cache[key]->second;\n    }\n    void put(int key, int value) {\n        if (cache.count(key)) {\n            lru.splice(lru.begin(), lru, cache[key]);\n            cache[key]->second = value;\n            return;\n        }\n        if (cache.size() == cap) {\n            int delete_key = lru.back().first;\n            lru.pop_back();\n            cache.erase(delete_key);\n        }\n        lru.push_front({key, value});\n        cache[key] = lru.begin();\n    }\n};`,
          java: `import java.util.LinkedHashMap;\nimport java.util.Map;\n\nclass LRUCache extends LinkedHashMap<Integer, Integer> {\n    private int capacity;\n    public LRUCache(int capacity) {\n        super(capacity, 0.75F, true);\n        this.capacity = capacity;\n    }\n    public int get(int key) {\n        return super.getOrDefault(key, -1);\n    }\n    public void put(int key, int value) {\n        super.put(key, value);\n    }\n    @Override\n    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {\n        return size() > capacity;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.cache.has(key)) this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      const oldest = this.cache.keys().next().value;\n      this.cache.delete(oldest);\n    }\n  }\n}`,
        },
        testCases: [
          { inputArgs: '[2]', expectedOutput: '-1', isSample: true } // verify constructor instantiation
        ],
      }
    ];

    let insertedCount = 0;
    for (const challenge of defaultChallenges) {
      const existing = await CodingQuestion.findOne({ slug: challenge.slug });
      if (!existing) {
        await CodingQuestion.create(challenge);
        insertedCount++;
      }
    }

    res.status(201).json({
      success: true,
      message: `Seeding completed! Seeded ${insertedCount} new coding challenges successfully. 📚✨`,
      totalCount: await CodingQuestion.countDocuments()
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCodingQuestions,
  getCodingQuestionBySlug,
  createCodingQuestion,
  updateCodingQuestion,
  deleteCodingQuestion,
  seedCodingQuestions,
};
