function twoSum(nums, target) {
  // Write your native JS code here
  // Click "Run Code" to compile and execute it!
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  
  return [];
}

const tests = [
  { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { input: [[3, 2, 4], 6], expected: [1, 2] },
  { input: [[3, 3], 6], expected: [0, 1] }
];
const results = [];
tests.forEach((t, i) => {
  try {
    const res = twoSum(t.input[0], t.input[1]);
    const passed = Array.isArray(res) && res.length === 2 && 
                   ((res[0] === t.expected[0] && res[1] === t.expected[1]) || 
                    (res[0] === t.expected[1] && res[1] === t.expected[0]));
    results.push({ caseNum: i + 1, input: JSON.stringify(t.input[0]), expected: JSON.stringify(t.expected), actual: JSON.stringify(res), status: passed ? "PASSED" : "FAILED" });
  } catch (e) {
    results.push({ caseNum: i + 1, input: JSON.stringify(t.input[0]), expected: JSON.stringify(t.expected), actual: e.message, status: "RUNTIME_ERROR" });
  }
});
console.log("---JSON_START---" + JSON.stringify(results) + "---JSON_END---");
