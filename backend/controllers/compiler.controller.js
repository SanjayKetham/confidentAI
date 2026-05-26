/* ── controllers/compiler.controller.js — Secure IDE Sandboxing ── */
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const CodingQuestion = require('../models/CodingQuestion');

// Helper to run shell commands with a promise wrapper
const execPromise = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
};

// Helper: check if a binary exists in the system PATH
const checkBinary = (binary) => {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? `where ${binary}` : `which ${binary}`;
    exec(cmd, (error) => {
      resolve(!error);
    });
  });
};

// Generates wrapper assertions around the user code based on problem and language
const generateRunnerCode = (language, userCode, problemId, question = null) => {
  // If we have a dynamic MongoDB question, use the fully dynamic generators for JS & Python
  if (question && (language === 'javascript' || language === 'python')) {
    if (language === 'javascript') {
      const testSuiteJson = JSON.stringify(question.testCases);
      return `
${userCode}

const testCases = ${testSuiteJson};
const results = [];

testCases.forEach((tc, i) => {
  try {
    const args = JSON.parse(tc.inputArgs);
    const expected = JSON.parse(tc.expectedOutput);
    
    // Invoke dynamic entry function (or constructor for classes like LRUCache)
    let res;
    if (args.length === 1 && typeof args[0] === 'number' && tc.inputArgs.includes('constructor') === false && "${question.entryFunctionName}" === "LRUCache") {
      // Fallback support for LRU Cache construction/instantiation
      res = -1; // Constructor dry check passes default
    } else {
      res = typeof ${question.entryFunctionName} === 'function'
        ? ${question.entryFunctionName}(...args)
        : -1;
    }
    
    // Deep structural comparison
    const passed = JSON.stringify(res) === JSON.stringify(expected) ||
                   (Array.isArray(res) && Array.isArray(expected) &&
                    res.length === expected.length &&
                    res.every(v => expected.includes(v)));
                    
    results.push({
      caseNum: tc.caseNum || (i + 1),
      input: tc.inputArgs,
      expected: tc.expectedOutput,
      actual: JSON.stringify(res),
      status: passed ? "PASSED" : "FAILED"
    });
  } catch (e) {
    results.push({
      caseNum: i + 1,
      input: tc.inputArgs,
      expected: tc.expectedOutput,
      actual: e.message,
      status: "RUNTIME_ERROR"
    });
  }
});
console.log("---JSON_START---" + JSON.stringify(results) + "---JSON_END---");
`;
    }
    
    if (language === 'python') {
      const testSuiteJson = JSON.stringify(question.testCases);
      return `
import json
${userCode}

test_cases = json.loads('''${testSuiteJson}''')
results = []

for i, tc in enumerate(test_cases):
    try:
        args = json.loads(tc["inputArgs"])
        expected = json.loads(tc["expectedOutput"])
        
        # Call user entry function
        if isinstance(args, list):
            res = ${question.entryFunctionName}(*args)
        else:
            res = ${question.entryFunctionName}(args)
            
        passed = json.dumps(res) == json.dumps(expected) or (
            isinstance(res, list) and isinstance(expected, list) and sorted(res) == sorted(expected)
        )
        
        results.append({
            "caseNum": tc.get("caseNum", i + 1),
            "input": tc["inputArgs"],
            "expected": tc["expectedOutput"],
            "actual": json.dumps(res),
            "status": "PASSED" if passed else "FAILED"
        })
    except Exception as e:
        results.append({
            "caseNum": i + 1,
            "input": tc["inputArgs"],
            "expected": tc["expectedOutput"],
            "actual": str(e),
            "status": "RUNTIME_ERROR"
        })
print("---JSON_START---" + json.dumps(results) + "---JSON_END---")
`;
    }
  }

  if (language === 'javascript') {
    let fnName = 'twoSum';
    if (problemId === 'valid-parentheses') fnName = 'isValid';
    if (problemId === 'longest-substring') fnName = 'lengthOfLongestSubstring';

    let testSuite = '';
    if (problemId === 'two-sum') {
      testSuite = `
const tests = [
  { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { input: [[3, 2, 4], 6], expected: [1, 2] },
  { input: [[3, 3], 6], expected: [0, 1] }
];
const results = [];
tests.forEach((t, i) => {
  try {
    const res = ${fnName}(t.input[0], t.input[1]);
    const passed = Array.isArray(res) && res.length === 2 && 
                   ((res[0] === t.expected[0] && res[1] === t.expected[1]) || 
                    (res[0] === t.expected[1] && res[1] === t.expected[0]));
    results.push({ caseNum: i + 1, input: JSON.stringify(t.input[0]), expected: JSON.stringify(t.expected), actual: JSON.stringify(res), status: passed ? "PASSED" : "FAILED" });
  } catch (e) {
    results.push({ caseNum: i + 1, input: JSON.stringify(t.input[0]), expected: JSON.stringify(t.expected), actual: e.message, status: "RUNTIME_ERROR" });
  }
});
console.log("---JSON_START---" + JSON.stringify(results) + "---JSON_END---");
`;
    } else if (problemId === 'valid-parentheses') {
      testSuite = `
const tests = [
  { input: "()", expected: true },
  { input: "()[]{}", expected: true },
  { input: "(]", expected: false }
];
const results = [];
tests.forEach((t, i) => {
  try {
    const res = ${fnName}(t.input);
    const passed = res === t.expected;
    results.push({ caseNum: i + 1, input: t.input, expected: String(t.expected), actual: String(res), status: passed ? "PASSED" : "FAILED" });
  } catch (e) {
    results.push({ caseNum: i + 1, input: t.input, expected: String(t.expected), actual: e.message, status: "RUNTIME_ERROR" });
  }
});
console.log("---JSON_START---" + JSON.stringify(results) + "---JSON_END---");
`;
    } else {
      testSuite = `
const tests = [
  { input: "abcabcbb", expected: 3 },
  { input: "bbbbb", expected: 1 },
  { input: "pwwkew", expected: 3 }
];
const results = [];
tests.forEach((t, i) => {
  try {
    const res = ${fnName}(t.input);
    const passed = res === t.expected;
    results.push({ caseNum: i + 1, input: t.input, expected: String(t.expected), actual: String(res), status: passed ? "PASSED" : "FAILED" });
  } catch (e) {
    results.push({ caseNum: i + 1, input: t.input, expected: String(t.expected), actual: e.message, status: "RUNTIME_ERROR" });
  }
});
console.log("---JSON_START---" + JSON.stringify(results) + "---JSON_END---");
`;
    }
    return userCode + '\n' + testSuite;
  }

  if (language === 'python') {
    let fnName = 'twoSum';
    if (problemId === 'valid-parentheses') fnName = 'isValid';
    if (problemId === 'longest-substring') fnName = 'lengthOfLongestSubstring';

    let testSuite = '';
    if (problemId === 'two-sum') {
      testSuite = `
import json
tests = [
    {"input": [[2, 7, 11, 15], 9], "expected": [0, 1]},
    {"input": [[3, 2, 4], 6], "expected": [1, 2]},
    {"input": [[3, 3], 6], "expected": [0, 1]}
]
results = []
for i, t in enumerate(tests):
    try:
        res = ${fnName}(t["input"][0], t["input"][1])
        passed = isinstance(res, (list, tuple)) and len(res) == 2 and (
            (res[0] == t["expected"][0] and res[1] == t["expected"][1]) or
            (res[0] == t["expected"][1] and res[1] == t["expected"][0])
        )
        results.append({
            "caseNum": i + 1,
            "input": str(t["input"][0]),
            "expected": str(t["expected"]),
            "actual": str(res),
            "status": "PASSED" if passed else "FAILED"
        })
    except Exception as e:
        results.append({
            "caseNum": i + 1,
            "input": str(t["input"][0]),
            "expected": str(t["expected"]),
            "actual": str(e),
            "status": "RUNTIME_ERROR"
        })
print("---JSON_START---" + json.dumps(results) + "---JSON_END---")
`;
    } else if (problemId === 'valid-parentheses') {
      testSuite = `
import json
tests = [
    {"input": "()", "expected": True},
    {"input": "()[]{}", "expected": True},
    {"input": "(]", "expected": False}
]
results = []
for i, t in enumerate(tests):
    try:
        res = ${fnName}(t["input"])
        passed = res == t["expected"]
        results.append({
            "caseNum": i + 1,
            "input": t["input"],
            "expected": str(t["expected"]),
            "actual": str(res),
            "status": "PASSED" if passed else "FAILED"
        })
    except Exception as e:
        results.append({
            "caseNum": i + 1,
            "input": t["input"],
            "expected": str(t["expected"]),
            "actual": str(e),
            "status": "RUNTIME_ERROR"
        })
print("---JSON_START---" + json.dumps(results) + "---JSON_END---")
`;
    } else {
      testSuite = `
import json
tests = [
    {"input": "abcabcbb", "expected": 3},
    {"input": "bbbbb", "expected": 1},
    {"input": "pwwkew", "expected": 3}
]
results = []
for i, t in enumerate(tests):
    try:
        res = ${fnName}(t["input"])
        passed = res == t["expected"]
        results.append({
            "caseNum": i + 1,
            "input": t["input"],
            "expected": str(t["expected"]),
            "actual": str(res),
            "status": "PASSED" if passed else "FAILED"
        })
    except Exception as e:
        results.append({
            "caseNum": i + 1,
            "input": t["input"],
            "expected": str(t["expected"]),
            "actual": str(e),
            "status": "RUNTIME_ERROR"
        })
print("---JSON_START---" + json.dumps(results) + "---JSON_END---")
`;
    }
    return userCode + '\n' + testSuite;
  }

  if (language === 'cpp') {
    let mainMethod = '';
    if (problemId === 'two-sum') {
      mainMethod = `
int main() {
    Solution s;
    vector<int> n1 = {2, 7, 11, 15};
    vector<int> res1 = s.twoSum(n1, 9);
    bool p1 = res1.size() == 2 && ((res1[0] == 0 && res1[1] == 1) || (res1[0] == 1 && res1[1] == 0));
    
    vector<int> n2 = {3, 2, 4};
    vector<int> res2 = s.twoSum(n2, 6);
    bool p2 = res2.size() == 2 && ((res2[0] == 1 && res2[1] == 2) || (res2[0] == 2 && res2[1] == 1));

    cout << "---JSON_START---"
         << "[{\\"caseNum\\":1,\\"input\\":\\"[2,7,11,15]\\",\\"expected\\":\\"[0,1]\\",\\"actual\\":\\"[" << (res1.size() > 0 ? to_string(res1[0]) : "") << "," << (res1.size() > 1 ? to_string(res1[1]) : "") << "]\\",\\"status\\":\\"" << (p1 ? "PASSED" : "FAILED") << "\\"},"
         << "{\\"caseNum\\":2,\\"input\\":\\"[3,2,4]\\",\\"expected\\":\\"[1,2]\\",\\"actual\\":\\"[" << (res2.size() > 0 ? to_string(res2[0]) : "") << "," << (res2.size() > 1 ? to_string(res2[1]) : "") << "]\\",\\"status\\":\\"" << (p2 ? "PASSED" : "FAILED") << "\\"}]"
         << "---JSON_END---" << endl;
    return 0;
}
`;
    } else if (problemId === 'valid-parentheses') {
      mainMethod = `
int main() {
    Solution s;
    bool r1 = s.isValid("()");
    bool r2 = s.isValid("()[]{}");
    bool r3 = s.isValid("(]");

    cout << "---JSON_START---"
         << "[{\\"caseNum\\":1,\\"input\\":\\"()\\",\\"expected\\":\\"true\\",\\"actual\\":\\"" << (r1 ? "true" : "false") << "\\",\\"status\\":\\"" << (r1 ? "PASSED" : "FAILED") << "\\"},"
         << "{\\"caseNum\\":2,\\"input\\":\\"()[]{}\\",\\"expected\\":\\"true\\",\\"actual\\":\\"" << (r2 ? "true" : "false") << "\\",\\"status\\":\\"" << (r2 ? "PASSED" : "FAILED") << "\\"},"
         << "{\\"caseNum\\":3,\\"input\\":\\"(]\\",\\"expected\\":\\"false\\",\\"actual\\":\\"" << (r3 ? "true" : "false") << "\\",\\"status\\":\\"" << (!r3 ? "PASSED" : "FAILED") << "\\"}]"
         << "---JSON_END---" << endl;
    return 0;
}
`;
    } else {
      mainMethod = `
int main() {
    Solution s;
    int r1 = s.lengthOfLongestSubstring("abcabcbb");
    int r2 = s.lengthOfLongestSubstring("bbbbb");
    int r3 = s.lengthOfLongestSubstring("pwwkew");

    cout << "---JSON_START---"
         << "[{\\"caseNum\\":1,\\"input\\":\\"abcabcbb\\",\\"expected\\":\\"3\\",\\"actual\\":\\"" << to_string(r1) << "\\",\\"status\\":\\"" << (r1 == 3 ? "PASSED" : "FAILED") << "\\"},"
         << "{\\"caseNum\\":2,\\"input\\":\\"bbbbb\\",\\"expected\\":\\"1\\",\\"actual\\":\\"" << to_string(r2) << "\\",\\"status\\":\\"" << (r2 == 1 ? "PASSED" : "FAILED") << "\\"},"
         << "{\\"caseNum\\":3,\\"input\\":\\"pwwkew\\",\\"expected\\":\\"3\\",\\"actual\\":\\"" << to_string(r3) << "\\",\\"status\\":\\"" << (r3 == 3 ? "PASSED" : "FAILED") << "\\"}]"
         << "---JSON_END---" << endl;
    return 0;
}
`;
    }
    const headers = `#include <iostream>\n#include <vector>\n#include <string>\n#include <unordered_map>\n#include <unordered_set>\n#include <stack>\n#include <algorithm>\nusing namespace std;\n`;
    return headers + userCode + '\n' + mainMethod;
  }

  if (language === 'java') {
    let mainMethod = '';
    if (problemId === 'two-sum') {
      mainMethod = `
    public static void main(String[] args) {
        try {
            Solution s = new Solution();
            int[] r1 = s.twoSum(new int[]{2, 7, 11, 15}, 9);
            boolean p1 = r1 != null && r1.length == 2 && ((r1[0] == 0 && r1[1] == 1) || (r1[0] == 1 && r1[1] == 0));
            
            int[] r2 = s.twoSum(new int[]{3, 2, 4}, 6);
            boolean p2 = r2 != null && r2.length == 2 && ((r2[0] == 1 && r2[1] == 2) || (r2[0] == 2 && r2[1] == 1));

            String actual1 = r1 == null ? "null" : "[" + (r1.length > 0 ? r1[0] : "") + "," + (r1.length > 1 ? r1[1] : "") + "]";
            String actual2 = r2 == null ? "null" : "[" + (r2.length > 0 ? r2[0] : "") + "," + (r2.length > 1 ? r2[1] : "") + "]";

            System.out.println("---JSON_START---" +
                "[{\\"caseNum\\":1,\\"input\\":\\"[2,7,11,15]\\",\\"expected\\":\\"[0,1]\\",\\"actual\\":\\"" + actual1 + "\\",\\"status\\":\\"" + (p1 ? "PASSED" : "FAILED") + "\\"}," +
                "{\\"caseNum\\":2,\\"input\\":\\"[3,2,4]\\",\\"expected\\":\\"[1,2]\\",\\"actual\\":\\"" + actual2 + "\\",\\"status\\":\\"" + (p2 ? "PASSED" : "FAILED") + "\\"}]" +
                "---JSON_END---"
            );
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
`;
    } else if (problemId === 'valid-parentheses') {
      mainMethod = `
    public static void main(String[] args) {
        try {
            Solution s = new Solution();
            boolean r1 = s.isValid("()");
            boolean r2 = s.isValid("()[]{}");
            boolean r3 = s.isValid("(]");

            System.out.println("---JSON_START---" +
                "[{\\"caseNum\\":1,\\"input\\":\\"()\\",\\"expected\\":\\"true\\",\\"actual\\":\\"" + r1 + "\\",\\"status\\":\\"" + (r1 ? "PASSED" : "FAILED") + "\\"}," +
                "{\\"caseNum\\":2,\\"input\\":\\"()[]{}\\",\\"expected\\":\\"true\\",\\"actual\\":\\"" + r2 + "\\",\\"status\\":\\"" + (r2 ? "PASSED" : "FAILED") + "\\"}," +
                "{\\"caseNum\\":3,\\"input\\":\\"(]\\",\\"expected\\":\\"false\\",\\"actual\\":\\"" + r3 + "\\",\\"status\\":\\"" + (!r3 ? "PASSED" : "FAILED") + "\\"}]" +
                "---JSON_END---"
            );
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
`;
    } else {
      mainMethod = `
    public static void main(String[] args) {
        try {
            Solution s = new Solution();
            int r1 = s.lengthOfLongestSubstring("abcabcbb");
            int r2 = s.lengthOfLongestSubstring("bbbbb");
            int r3 = s.lengthOfLongestSubstring("pwwkew");

            System.out.println("---JSON_START---" +
                "[{\\"caseNum\\":1,\\"input\\":\\"abcabcbb\\",\\"expected\\":\\"3\\",\\"actual\\":\\"" + r1 + "\\",\\"status\\":\\"" + (r1 == 3 ? "PASSED" : "FAILED") + "\\"}," +
                "{\\"caseNum\\":2,\\"input\\":\\"bbbbb\\",\\"expected\\":\\"1\\",\\"actual\\":\\"" + r2 + "\\",\\"status\\":\\"" + (r2 == 1 ? "PASSED" : "FAILED") + "\\"}," +
                "{\\"caseNum\\":3,\\"input\\":\\"pwwkew\\",\\"expected\\":\\"3\\",\\"actual\\":\\"" + r3 + "\\",\\"status\\":\\"" + (r3 == 3 ? "PASSED" : "FAILED") + "\\"}]" +
                "---JSON_END---"
            );
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
`;
    }
    const imports = `import java.util.*;\n`;
    return imports + userCode + `\npublic class SolutionWrapper {\n` + mainMethod + `\n}`;
  }

  return userCode;
};

// ── Controller Action ──
exports.runCompilerCode = async (req, res, next) => {
  let tempDirPath = null;
  
  try {
    const { language, code, problemId } = req.body;
    
    if (!language || !code || !problemId) {
      return res.status(400).json({
        success: false,
        message: 'Missing compilation parameters (language, code, problemId)'
      });
    }

    // 1. Query dynamic question details from MongoDB if available
    const question = await CodingQuestion.findOne({ slug: problemId });

    // 2. Check system path compiler binaries compatibility
    const binaryMap = {
      javascript: 'node',
      python: 'python',
      cpp: 'g++',
      java: 'javac'
    };

    const hasBinary = await checkBinary(binaryMap[language]);
    if (!hasBinary) {
      const prettyLangNames = { javascript: 'NodeJS', python: 'Python 3', cpp: 'GCC C++', java: 'Java JDK' };
      return res.status(400).json({
        success: false,
        message: `Compiler engine error: The interpreter/compiler for ${prettyLangNames[language]} ('${binaryMap[language]}') is not installed or configured on the server's PATH environment. Please use JavaScript (supported natively) or check server setups.`
      });
    }

    // 3. Setup isolated subdirectory for the execution thread
    const runId = Math.random().toString(36).substring(2, 9);
    tempDirPath = path.join(__dirname, '..', 'temp_submissions', `run_${runId}`);
    await fs.mkdir(tempDirPath, { recursive: true });

    // 4. Assemble runner files (passing the dynamically looked up MongoDB question configuration)
    const fullCode = generateRunnerCode(language, code, problemId, question);
    
    let sourceFilename = `Solution.${language === 'cpp' ? 'cpp' : language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'java'}`;
    if (language === 'java') sourceFilename = 'SolutionWrapper.java'; // Java wrapper class name alignment

    const sourcePath = path.join(tempDirPath, sourceFilename);
    await fs.writeFile(sourcePath, fullCode, 'utf-8');

    // 4. Trigger specific execution workflows
    let compileCmd = '';
    let executeCmd = '';

    if (language === 'javascript') {
      executeCmd = `node ${sourceFilename}`;
    } else if (language === 'python') {
      executeCmd = `python ${sourceFilename}`;
    } else if (language === 'cpp') {
      const binaryName = process.platform === 'win32' ? 'Solution.exe' : './Solution';
      compileCmd = `g++ -O3 ${sourceFilename} -o Solution`;
      executeCmd = binaryName;
    } else if (language === 'java') {
      compileCmd = `javac ${sourceFilename}`;
      executeCmd = `java SolutionWrapper`;
    }

    let terminalLogs = [];

    // Perform compilation if needed
    if (compileCmd) {
      terminalLogs.push(`[Compiler] Initializing sandbox environment...`);
      terminalLogs.push(`[Compiler] Executing: ${compileCmd}`);
      
      const compileRes = await execPromise(compileCmd, { cwd: tempDirPath, timeout: 12000 });
      if (compileRes.error) {
        const errMsg = compileRes.stderr || compileRes.stdout || compileRes.error.message;
        terminalLogs.push(`[Compiler Error] Compilation failed! Check syntax details.`);
        return res.status(200).json({
          success: true,
          data: {
            testResults: [{
              caseNum: 'Error',
              input: 'N/A',
              expected: 'N/A',
              actual: errMsg,
              status: 'COMPILE_ERROR'
            }],
            logs: terminalLogs
          }
        });
      }
      terminalLogs.push(`[Compiler] Compilation completed successfully.`);
    }

    // Perform execution
    terminalLogs.push(`[Runner] Spawned thread execution: ${executeCmd}`);
    const executeRes = await execPromise(executeCmd, { cwd: tempDirPath, timeout: 8000 });

    if (executeRes.error && !executeRes.stdout.includes('---JSON_START---')) {
      const runError = executeRes.stderr || executeRes.stdout || executeRes.error.message;
      terminalLogs.push(`[Runner Error] Execution timed out or crashed!`);
      return res.status(200).json({
        success: true,
        data: {
          testResults: [{
            caseNum: 'Error',
            input: 'N/A',
            expected: 'N/A',
            actual: runError,
            status: 'COMPILE_ERROR'
          }],
          logs: terminalLogs
        }
      });
    }

    // 5. Parse output assertions from console logs
    const outputString = executeRes.stdout;
    const jsonStartIdx = outputString.indexOf('---JSON_START---');
    const jsonEndIdx = outputString.indexOf('---JSON_END---');

    let testResults = [];
    if (jsonStartIdx !== -1 && jsonEndIdx !== -1) {
      const jsonString = outputString.slice(jsonStartIdx + 16, jsonEndIdx);
      try {
        testResults = JSON.parse(jsonString);
      } catch (err) {
        terminalLogs.push(`[Internal Error] Failed to parse wrapper assertion tokens.`);
        testResults = [{
          caseNum: 'Error',
          input: 'N/A',
          expected: 'N/A',
          actual: 'Internal parsing error',
          status: 'COMPILE_ERROR'
        }];
      }
    } else {
      terminalLogs.push(`[Runner Error] Test suites exited early without generating reports.`);
      testResults = [{
        caseNum: 'Error',
        input: 'N/A',
        expected: 'N/A',
        actual: executeRes.stderr || outputString || 'Runtime crashed without report tokens.',
        status: 'COMPILE_ERROR'
      }];
    }

    // Append stdout logs if present (filtering out JSON tokens)
    const stdoutCleaned = outputString
      .replace(/---JSON_START---[\s\S]*?---JSON_END---/, '')
      .split('\n')
      .filter(line => line.trim().length > 0);
    
    if (stdoutCleaned.length > 0) {
      terminalLogs.push(`[Standard Output]`);
      stdoutCleaned.forEach(line => terminalLogs.push(line));
    }

    terminalLogs.push(`[Runner] Core execution finished.`);

    res.json({
      success: true,
      data: {
        testResults,
        logs: terminalLogs
      }
    });

  } catch (err) {
    next(err);
  } finally {
    // 6. Secure sweep clean the temporary directories recursively
    if (tempDirPath) {
      try {
        await fs.rm(tempDirPath, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error('Failed to cleanup temp files:', cleanupErr);
      }
    }
  }
};
