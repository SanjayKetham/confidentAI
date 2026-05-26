import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, Sparkles, RefreshCw, Trash2, Info, Plus
} from 'lucide-react';
import { codingQuestionsAPI, compilerAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminCodingPage() {
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [loadingCoding, setLoadingCoding] = useState(false);
  const [seedingCoding, setSeedingCoding] = useState(false);
  const [submittingCoding, setSubmittingCoding] = useState(false);
  const [auditingCoding, setAuditingCoding] = useState(false);

  const [newCoding, setNewCoding] = useState({
    title: '',
    slug: '',
    difficulty: 'Easy',
    category: 'Algorithms',
    description: '',
    entryFunctionName: '',
    starterCodes: {
      javascript: '// Write your function signature here\nfunction entry(args) {\n  \n}',
      python: '# Write your function signature here\ndef entry(args):\n    pass',
      cpp: '// C++ signature',
      java: '// Java signature'
    },
    optimalSolutions: {
      javascript: '// Write JavaScript reference solution here\nfunction entry(args) {\n  \n}',
      python: '# Write Python reference solution here\ndef entry(args):\n    pass'
    },
    examples: [{ input: '', output: '', explanation: '' }],
    constraints: [''],
    hints: [''],
    testCases: [{ inputArgs: '[]', expectedOutput: '""', isSample: true }]
  });

  async function fetchCodingQuestions() {
    setLoadingCoding(true);
    try {
      const res = await codingQuestionsAPI.list();
      if (res.data.success) {
        setCodingQuestions(res.data.questions);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve coding questions collection.');
    } finally {
      setLoadingCoding(false);
    }
  }

  const handleSeedCoding = async () => {
    setSeedingCoding(true);
    const loadToastId = toast.loading('Seeding default curriculum...');
    try {
      const res = await codingQuestionsAPI.seed();
      toast.dismiss(loadToastId);
      if (res.data.success) {
        toast.success(res.data.message || 'Seeded successfully!');
        fetchCodingQuestions();
      }
    } catch (err) {
      toast.dismiss(loadToastId);
      console.error(err);
      toast.error(err.response?.data?.message || 'Error seeding coding questions.');
    } finally {
      setSeedingCoding(false);
    }
  };

  const handleAuditCoding = async () => {
    if (!newCoding.entryFunctionName.trim()) {
      toast.error('Function entry name is required for assertions audit.');
      return;
    }
    if (!newCoding.optimalSolutions.javascript.trim() || newCoding.optimalSolutions.javascript.includes('Write JavaScript reference solution here')) {
      toast.error('Please write a valid JavaScript reference solution to audit.');
      return;
    }
    
    setAuditingCoding(true);
    const auditToastId = toast.loading('Executing optimal solution against assertions in compiler sandbox...');
    
    try {
      const response = await compilerAPI.run({
        language: 'javascript',
        code: newCoding.optimalSolutions.javascript,
        problemId: newCoding.slug.trim()
      });
      
      toast.dismiss(auditToastId);
      
      if (response.data?.success) {
        const { testResults } = response.data.data;
        const allPassed = testResults && testResults.length > 0 && testResults.every(r => r.status === 'PASSED');
        
        if (allPassed) {
          toast.success('🎉 Sandbox Audit PASSED! The optimal reference solution passes all dynamic assertions perfectly.');
        } else {
          const failed = testResults?.find(r => r.status !== 'PASSED');
          if (failed) {
            toast.error(`❌ Audit FAILED: Assert #${failed.caseNum} failed.\nInputArgs: ${failed.input}\nExpected: ${failed.expected}\nActual: ${failed.actual}`);
          } else {
            toast.error('❌ Audit FAILED: Sandbox compiler returned an empty results payload. Make sure your test cases are defined properly.');
          }
        }
      } else {
        toast.error(response.data?.message || 'Sandbox compilation failed.');
      }
    } catch (err) {
      toast.dismiss(auditToastId);
      console.error(err);
      toast.error(err.response?.data?.message || 'Audit failed. Check that your sandbox compiler is active.');
    } finally {
      setAuditingCoding(false);
    }
  };

  const handleCodingSubmit = async (e) => {
    e.preventDefault();
    if (!newCoding.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!newCoding.slug.trim()) {
      toast.error('Unique slug is required.');
      return;
    }
    if (!newCoding.entryFunctionName.trim()) {
      toast.error('Entry function name is required.');
      return;
    }
    
    setSubmittingCoding(true);
    try {
      const filteredExamples = newCoding.examples.filter(ex => ex.input.trim() && ex.output.trim());
      const filteredConstraints = newCoding.constraints.filter(c => c.trim());
      const filteredHints = newCoding.hints.filter(h => h.trim());
      const filteredTestCases = newCoding.testCases.filter(t => t.inputArgs.trim() && t.expectedOutput.trim());
      
      const payload = {
        ...newCoding,
        slug: newCoding.slug.trim().toLowerCase(),
        examples: filteredExamples,
        constraints: filteredConstraints,
        hints: filteredHints,
        testCases: filteredTestCases
      };
      
      const res = await codingQuestionsAPI.create(payload);
      if (res.data.success) {
        toast.success('💻 Dynamic coding challenge registered and compiled successfully!');
        fetchCodingQuestions();
        setNewCoding({
          title: '',
          slug: '',
          difficulty: 'Easy',
          category: 'Algorithms',
          description: '',
          entryFunctionName: '',
          starterCodes: {
            javascript: '// Write your function signature here\nfunction entry(args) {\n  \n}',
            python: '# Write your function signature here\ndef entry(args):\n    pass',
            cpp: '// C++ signature',
            java: '// Java signature'
          },
          optimalSolutions: {
            javascript: '// Write JavaScript reference solution here\nfunction entry(args) {\n  \n}',
            python: '# Write Python reference solution here\ndef entry(args):\n    pass'
          },
          examples: [{ input: '', output: '', explanation: '' }],
          constraints: [''],
          hints: [''],
          testCases: [{ inputArgs: '[]', expectedOutput: '""', isSample: true }]
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit dynamic challenge.');
    } finally {
      setSubmittingCoding(false);
    }
  };

  const handleCodingDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this challenge? This will remove all test scenarios.')) {
      return;
    }
    try {
      const res = await codingQuestionsAPI.delete(id);
      if (res.data.success) {
        toast.success('Challenge deleted successfully! 🗑️');
        fetchCodingQuestions();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete coding question.');
    }
  };

  useEffect(() => {
    fetchCodingQuestions();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-2 relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Code2 className="text-purple-400" size={20} />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight text-left">Manage Coding Challenges</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-left">
            Admin console to define dynamic sandbox coding questions, assign entry function hooks, configure JSON test assertions, and execute optimal reference codes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedCoding}
          disabled={seedingCoding}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 flex items-center gap-2 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <RefreshCw size={12} className={seedingCoding ? 'animate-spin' : ''} />
          {seedingCoding ? 'Seeding Curriculum...' : '🔌 Seed Default Challenges'}
        </button>
      </div>

      <form onSubmit={handleCodingSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: GENERAL DETAILS */}
        <div className="p-6 rounded-2xl border space-y-4 flex flex-col text-left"
             style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-foreground">Challenge Information</h3>
            <p className="text-[10px] text-muted-foreground">Define identifiers, instructions, and complexity limits.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Reverse Linked List"
                value={newCoding.title}
                onChange={e => {
                  const title = e.target.value;
                  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setNewCoding({ ...newCoding, title, slug });
                }}
                className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unique Slug *</label>
              <input
                type="text"
                required
                placeholder="e.g. reverse-linked-list"
                value={newCoding.slug}
                onChange={e => setNewCoding({ ...newCoding, slug: e.target.value.toLowerCase() })}
                className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Difficulty *</label>
              <select
                value={newCoding.difficulty}
                onChange={e => setNewCoding({ ...newCoding, difficulty: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
              >
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. LinkedList, Heap"
                value={newCoding.category}
                onChange={e => setNewCoding({ ...newCoding, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Entry Function Hook Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. reverseList"
                value={newCoding.entryFunctionName}
                onChange={e => setNewCoding({ ...newCoding, entryFunctionName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 font-mono text-purple-300"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description (Markdown Supported) *</label>
            <textarea
              required
              rows={4}
              placeholder="Given the head of a singly linked list, reverse the list..."
              value={newCoding.description}
              onChange={e => setNewCoding({ ...newCoding, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 resize-y text-white leading-relaxed font-mono"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
            />
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Examples</label>
              <button
                type="button"
                onClick={() => setNewCoding({
                  ...newCoding,
                  examples: [...newCoding.examples, { input: '', output: '', explanation: '' }]
                })}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                + Add Example
              </button>
            </div>
            {newCoding.examples.map((ex, idx) => (
              <div key={idx} className="p-3 rounded-xl border space-y-2 relative" style={{ borderColor: 'var(--sidebar-border)' }}>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Input (e.g. head = [1,2,3])"
                    value={ex.input}
                    onChange={e => {
                      const examples = [...newCoding.examples];
                      examples[idx].input = e.target.value;
                      setNewCoding({ ...newCoding, examples });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs outline-none border text-white"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                  />
                  <input
                    type="text"
                    placeholder="Output (e.g. [3,2,1])"
                    value={ex.output}
                    onChange={e => {
                      const examples = [...newCoding.examples];
                      examples[idx].output = e.target.value;
                      setNewCoding({ ...newCoding, examples });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs outline-none border text-white"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Explanation (Optional)"
                  value={ex.explanation}
                  onChange={e => {
                    const examples = [...newCoding.examples];
                    examples[idx].explanation = e.target.value;
                    setNewCoding({ ...newCoding, examples });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border text-white"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
                {newCoding.examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const examples = newCoding.examples.filter((_, i) => i !== idx);
                      setNewCoding({ ...newCoding, examples });
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Constraints</label>
              <button
                type="button"
                onClick={() => setNewCoding({
                  ...newCoding,
                  constraints: [...newCoding.constraints, '']
                })}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                + Add Constraint
              </button>
            </div>
            {newCoding.constraints.map((c, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="e.g. Node.val <= 5000"
                  value={c}
                  onChange={e => {
                    const constraints = [...newCoding.constraints];
                    constraints[idx] = e.target.value;
                    setNewCoding({ ...newCoding, constraints });
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border text-white"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
                {newCoding.constraints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const constraints = newCoding.constraints.filter((_, i) => i !== idx);
                      setNewCoding({ ...newCoding, constraints });
                    }}
                    className="px-2 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Hints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hints</label>
              <button
                type="button"
                onClick={() => setNewCoding({
                  ...newCoding,
                  hints: [...newCoding.hints, '']
                })}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                + Add Hint
              </button>
            </div>
            {newCoding.hints.map((h, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="e.g. Try using an iterative two-pointer technique."
                  value={h}
                  onChange={e => {
                    const hints = [...newCoding.hints];
                    hints[idx] = e.target.value;
                    setNewCoding({ ...newCoding, hints });
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border text-white"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
                {newCoding.hints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const hints = newCoding.hints.filter((_, i) => i !== idx);
                      setNewCoding({ ...newCoding, hints });
                    }}
                    className="px-2 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: COMPILER CONFIG & SOLUTIONS */}
        <div className="p-6 rounded-2xl border space-y-5 flex flex-col text-left"
             style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
          
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-foreground">Sandbox Executable Specification</h3>
            <p className="text-[10px] text-muted-foreground">Provide starter boilerplates, test assertions, and reference solutions.</p>
          </div>

          {/* Starter Codes Boilerplate textareas */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Starter Boilerplates</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-slate-400">JavaScript Starter</span>
                <textarea
                  rows={3}
                  value={newCoding.starterCodes.javascript}
                  onChange={e => setNewCoding({
                    ...newCoding,
                    starterCodes: { ...newCoding.starterCodes, javascript: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg font-mono text-[10px] border outline-none text-purple-300"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-slate-400">Python Starter</span>
                <textarea
                  rows={3}
                  value={newCoding.starterCodes.python}
                  onChange={e => setNewCoding({
                    ...newCoding,
                    starterCodes: { ...newCoding.starterCodes, python: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg font-mono text-[10px] border outline-none text-blue-300"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-slate-400">C++ Starter</span>
                <textarea
                  rows={3}
                  value={newCoding.starterCodes.cpp}
                  onChange={e => setNewCoding({
                    ...newCoding,
                    starterCodes: { ...newCoding.starterCodes, cpp: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg font-mono text-[10px] border outline-none text-emerald-300"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-slate-400">Java Starter</span>
                <textarea
                  rows={3}
                  value={newCoding.starterCodes.java}
                  onChange={e => setNewCoding({
                    ...newCoding,
                    starterCodes: { ...newCoding.starterCodes, java: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg font-mono text-[10px] border outline-none text-amber-300"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
              </div>
            </div>
          </div>

          {/* Reference Optimal solutions for automatic audits */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Optimal Reference Solutions</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-slate-400">JavaScript Reference (Auditable)</span>
                <textarea
                  rows={4}
                  value={newCoding.optimalSolutions.javascript}
                  onChange={e => setNewCoding({
                    ...newCoding,
                    optimalSolutions: { ...newCoding.optimalSolutions, javascript: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg font-mono text-[10px] border outline-none text-purple-300"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-slate-400">Python Reference</span>
                <textarea
                  rows={4}
                  value={newCoding.optimalSolutions.python}
                  onChange={e => setNewCoding({
                    ...newCoding,
                    optimalSolutions: { ...newCoding.optimalSolutions, python: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg font-mono text-[10px] border outline-none text-blue-300"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                />
              </div>
            </div>
          </div>

          {/* Assertions Test Cases */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sandbox Test Cases (JSON Structs)</label>
              <button
                type="button"
                onClick={() => setNewCoding({
                  ...newCoding,
                  testCases: [...newCoding.testCases, { inputArgs: '[]', expectedOutput: '""', isSample: false }]
                })}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
              >
                + Add Test Case
              </button>
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {newCoding.testCases.map((tc, idx) => (
                <div key={idx} className="p-3 rounded-xl border grid grid-cols-12 gap-2 items-center relative" style={{ borderColor: 'var(--sidebar-border)' }}>
                  <div className="col-span-6 flex flex-col gap-1">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider">Input JSON Array</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. [[2,7], 9]"
                      value={tc.inputArgs}
                      onChange={e => {
                        const testCases = [...newCoding.testCases];
                        testCases[idx].inputArgs = e.target.value;
                        setNewCoding({ ...newCoding, testCases });
                      }}
                      className="px-2 py-1 rounded text-[10px] font-mono border text-white"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                    />
                  </div>
                  <div className="col-span-4 flex flex-col gap-1">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider">Expected JSON</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. [0,1]"
                      value={tc.expectedOutput}
                      onChange={e => {
                        const testCases = [...newCoding.testCases];
                        testCases[idx].expectedOutput = e.target.value;
                        setNewCoding({ ...newCoding, testCases });
                      }}
                      className="px-2 py-1 rounded text-[10px] font-mono border text-white"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)' }}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider">Sample</span>
                    <input
                      type="checkbox"
                      checked={tc.isSample}
                      onChange={e => {
                        const testCases = [...newCoding.testCases];
                        testCases[idx].isSample = e.target.checked;
                        setNewCoding({ ...newCoding, testCases });
                      }}
                      className="h-3 w-3 accent-purple-600 rounded cursor-pointer"
                    />
                  </div>
                  {newCoding.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const testCases = newCoding.testCases.filter((_, i) => i !== idx);
                        setNewCoding({ ...newCoding, testCases });
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-[9px] hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Controls for Compiler Audit and Creation */}
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleAuditCoding}
              disabled={auditingCoding || submittingCoding}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border hover:bg-white/5 transition-all text-white flex items-center justify-center gap-2 cursor-pointer"
              style={{ borderColor: 'var(--sidebar-border)' }}
            >
              <Sparkles size={13} className="text-purple-400" />
              {auditingCoding ? 'Running Compiler Sandbox...' : '🔍 Audit Reference Code'}
            </button>

            <button
              type="submit"
              disabled={submittingCoding || auditingCoding}
              className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submittingCoding ? 'Registering Challenge...' : '💾 Save Coding Challenge'}
            </button>
          </div>
        </div>
      </form>

      {/* EXISTING CODING CURRICULUM EXPLORER */}
      <div className="space-y-4 pt-4 border-t border-white/5 text-left">
        <div>
          <h3 className="text-sm font-bold text-foreground">💻 Existing Sandbox Challenges</h3>
          <p className="text-xs text-muted-foreground text-left">List of custom and pre-seeded curriculum modules currently active inside MongoDB.</p>
        </div>

        <div className="rounded-2xl border overflow-hidden"
             style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
          {loadingCoding ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs gap-3">
              <RefreshCw size={18} className="animate-spin text-purple-400" />
              <span>Fetching system curriculum...</span>
            </div>
          ) : codingQuestions.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground italic">
              No active coding challenges loaded in database. Seed default set above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-white/[0.02]" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <th className="p-4 font-semibold text-muted-foreground">Title</th>
                    <th className="p-4 font-semibold text-muted-foreground">Slug</th>
                    <th className="p-4 font-semibold text-muted-foreground text-center">Difficulty</th>
                    <th className="p-4 font-semibold text-muted-foreground text-center">Category</th>
                    <th className="p-4 font-semibold text-muted-foreground text-center">Entry Function</th>
                    <th className="p-4 font-semibold text-muted-foreground text-center">Test Cases</th>
                    <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--sidebar-border)' }}>
                  {codingQuestions.map((q) => (
                    <tr key={q._id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 font-bold text-white">{q.title}</td>
                      <td className="p-4 font-mono text-purple-300">{q.slug}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-extrabold ${
                          q.difficulty === 'Hard' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          q.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-300">{q.category}</td>
                      <td className="p-4 text-center font-mono text-cyan-400">{q.entryFunctionName}</td>
                      <td className="p-4 text-center font-bold text-slate-400">{q.testCases?.length || 0} assertions</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCodingDelete(q._id)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Delete Challenge Permanently"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
