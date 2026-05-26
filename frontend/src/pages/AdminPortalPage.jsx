/* ── AdminPortalPage — Premium Admin Hub ──────────────────────── */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, BookOpen, UserCheck, UserX,
  Search, ShieldAlert, Check, RefreshCw, BarChart2,
  Upload, Download, FileSpreadsheet, AlertTriangle, Trash2, HelpCircle, Sparkles, Filter
} from 'lucide-react';
import { adminAPI, questionsAPI, codingQuestionsAPI, compilerAPI } from '../utils/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function AdminPortalPage() {
  // General Stats & Users
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalQuestions: 0,
    questionsByCategory: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'questions'

  // Excel Upload state
  const [excelData, setExcelData] = useState([]);
  const [excelErrors, setExcelErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Single Question uploader state
  const [questionsSubTab, setQuestionsSubTab] = useState('single'); // 'single', 'bulk', or 'coding'
  const [singleQuestion, setSingleQuestion] = useState({
    text: '',
    category: 'technical',
    difficulty: 'intermediate',
    role: 'Any Role',
    topic: '',
    hint: '',
    sampleAnswer: '',
    expectedAnswer: '',
    tags: ''
  });
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Dynamic Coding Questions states
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [loadingCoding, setLoadingCoding] = useState(false);
  const [seedingCoding, setSeedingCoding] = useState(false);
  const [submittingCoding, setSubmittingCoding] = useState(false);
  const [auditingCoding, setAuditingCoding] = useState(false);
  
  // Single Coding Question form
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

  // Existing Questions Bank Explorer state
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsSearch, setQuestionsSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const allowedCategories = ['technical', 'hr', 'behavioral', 'case_study', 'rapid_fire'];
  const allowedDifficulties = ['beginner', 'intermediate', 'advanced'];

  const CSV_TEMPLATE = "text,category,difficulty,role,topic,hint,sampleAnswer,expectedAnswer,tags\n" +
    "\"Explain the concept of closures in JavaScript.\",technical,intermediate,Frontend Engineer,JavaScript,\"Think about lexical scope and function boundaries.\",\"A closure is the combination of a function bundled together with references to its surrounding state...\",,javascript,closures,frontend\n" +
    "\"Tell me about a time you had a conflict with a team member and how you resolved it.\",behavioral,intermediate,Any Role,Conflict Resolution,\"Use the STAR method (Situation, Task, Action, Result).\",\"In my previous job as a Software Engineer, we were planning the migration of our main DB...\",,,behavioral,star-method\n" +
    "\"Why do you want to join our company?\",hr,beginner,Any Role,Motivation,\"Align your skills with the company mission and future projects.\",\"I have been following your company's growth in the AI interview prep sector, and...\",,,motivation,hr-round";

  async function loadAdminData() {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers()
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load administrative console data.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchExistingQuestions() {
    setLoadingQuestions(true);
    try {
      // Fetch active questions
      const res = await questionsAPI.getByCategory('', '', 60);
      if (res.data.success) {
        setExistingQuestions(res.data.questions);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve current question bank.');
    } finally {
      setLoadingQuestions(false);
    }
  }

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleQuestion.text.trim()) {
      toast.error('Question text is required.');
      return;
    }
    
    setSubmittingSingle(true);
    try {
      const tagsArray = singleQuestion.tags
        ? singleQuestion.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...singleQuestion,
        tags: tagsArray
      };
      
      const { data } = await questionsAPI.create(payload);
      if (data.success) {
        toast.success('Question added successfully to the bank! 📚🎉');
        setSingleQuestion({
          text: '',
          category: 'technical',
          difficulty: 'intermediate',
          role: 'Any Role',
          topic: '',
          hint: '',
          sampleAnswer: '',
          expectedAnswer: '',
          tags: ''
        });
        loadAdminData();
        fetchExistingQuestions();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to add question.';
      toast.error(errMsg);
    } finally {
      setSubmittingSingle(false);
    }
  };

  // ── Dynamic Coding Questions Actions ──
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
      // Perform the dry run with the JavaScript reference solution
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
      // Filter clean inputs
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
        // Reset form
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

  // Synchronize loading triggers for coding tab
  useEffect(() => {
    if (activeTab === 'questions' && questionsSubTab === 'coding') {
      fetchCodingQuestions();
    }
  }, [activeTab, questionsSubTab]);

  const handleExportQuestions = () => {
    if (existingQuestions.length === 0) {
      toast.error('No questions available to export.');
      return;
    }

    try {
      const dataToExport = existingQuestions.map(q => ({
        text: q.text || '',
        category: q.category || '',
        difficulty: q.difficulty || '',
        role: q.role || 'Any Role',
        topic: q.topic || '',
        hint: q.hint || '',
        sampleAnswer: q.sampleAnswer || '',
        expectedAnswer: q.expectedAnswer || '',
        tags: Array.isArray(q.tags) ? q.tags.join(',') : (q.tags || '')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

      XLSX.writeFile(workbook, "confidentai_question_bank_export.xlsx");
      toast.success("Questions exported successfully as Excel! 📊📥");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export question bank.");
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchExistingQuestions();
    }
  }, [activeTab]);

  async function handleRoleChange(userId, newRole) {
    try {
      const { data } = await adminAPI.updateUser(userId, { role: newRole });
      if (data.success) {
        toast.success(`User role updated to ${newRole}! 👑`);
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        setStats(prev => ({
          ...prev,
          totalAdmins: prev.totalAdmins + (newRole === 'admin' ? 1 : -1)
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user role.');
    }
  }

  async function handleStatusToggle(userId, currentStatus) {
    const newStatus = !currentStatus;
    try {
      const { data } = await adminAPI.updateUser(userId, { isActive: newStatus });
      if (data.success) {
        toast.success(newStatus ? 'Account activated! 🟢' : 'Account deactivated! 🔴');
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: newStatus } : u));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle account status.');
    }
  }

  // Deleting existing question from DB
  async function handleDeleteQuestion(questionId) {
    if (!window.confirm("Are you sure you want to permanently delete this question from the bank?")) return;

    try {
      const { data } = await questionsAPI.delete(questionId);
      if (data.success) {
        toast.success("Question deleted successfully! 🗑️");
        setExistingQuestions(existingQuestions.filter(q => q._id !== questionId));
        setStats(prev => ({
          ...prev,
          totalQuestions: Math.max(0, prev.totalQuestions - 1)
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete question.");
    }
  }

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'confidentai_questions_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV import template downloaded! 📥");
  };

  // Drag and Drop Upload Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [file] } };
      handleExcelUpload(fakeEvent);
    }
  };

  // Excel / CSV File parser
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json(ws);

        if (rawRows.length === 0) {
          toast.error("The uploaded file contains no rows.");
          return;
        }

        // Validate rows and map fields dynamically (robust parser)
        const parsedRows = rawRows.map((row, idx) => {
          const rowNum = idx + 1;
          const errors = [];

          const getVal = (keys) => {
            const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
            return foundKey ? row[foundKey] : undefined;
          };

          const text = getVal(['text', 'question', 'question text', 'questiontext', 'content']);
          const category = getVal(['category', 'type', 'question category', 'cat']);
          const difficulty = getVal(['difficulty', 'level', 'difficulty level', 'diff']);
          const role = getVal(['role', 'job role', 'jobrole', 'target role']) || 'Any Role';
          const topic = getVal(['topic', 'subject', 'sub-topic']) || '';
          const hint = getVal(['hint', 'help', 'question hint']) || '';
          const sampleAnswer = getVal(['sampleanswer', 'sample answer', 'model answer', 'answer']) || '';
          const expectedAnswer = getVal(['expectedanswer', 'expected answer', 'short answer']) || '';
          const tagsVal = getVal(['tags', 'keywords', 'tag']);

          let tags = [];
          if (tagsVal) {
            if (typeof tagsVal === 'string') {
              tags = tagsVal.split(',').map(t => t.trim()).filter(Boolean);
            } else if (Array.isArray(tagsVal)) {
              tags = tagsVal.map(t => String(t).trim()).filter(Boolean);
            }
          }

          if (!text || String(text).trim() === '') {
            errors.push("Question text is empty.");
          }
          if (!category || !allowedCategories.includes(String(category).toLowerCase().trim())) {
            errors.push(`Invalid Category. Allowed: ${allowedCategories.join(', ')}`);
          }
          if (!difficulty || !allowedDifficulties.includes(String(difficulty).toLowerCase().trim())) {
            errors.push(`Invalid Difficulty. Allowed: ${allowedDifficulties.join(', ')}`);
          }

          return {
            text: text ? String(text).trim() : '',
            category: category ? String(category).toLowerCase().trim() : '',
            difficulty: difficulty ? String(difficulty).toLowerCase().trim() : '',
            role: String(role).trim(),
            topic: String(topic).trim(),
            hint: String(hint).trim(),
            sampleAnswer: String(sampleAnswer).trim(),
            expectedAnswer: String(expectedAnswer).trim(),
            tags,
            rowNum,
            errors,
            isValid: errors.length === 0
          };
        });

        setExcelData(parsedRows);
        const allErrors = parsedRows.flatMap(r => r.errors.map(err => `Row ${r.rowNum}: ${err}`));
        setExcelErrors(allErrors);

        if (allErrors.length > 0) {
          toast.warning(`Parsed ${parsedRows.length} rows, but found ${allErrors.length} validation errors.`);
        } else {
          toast.success(`Successfully loaded ${parsedRows.length} questions! Ready for import.`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error reading file. Make sure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk Submit to database
  async function handleImportConfirm() {
    const validQuestions = excelData.filter(q => q.isValid).map(({
      text, category, difficulty, role, topic, hint, sampleAnswer, expectedAnswer, tags
    }) => ({
      text, category, difficulty, role, topic, hint, sampleAnswer, expectedAnswer, tags
    }));

    if (validQuestions.length === 0) {
      toast.error("There are no valid questions to import.");
      return;
    }

    setImporting(true);
    try {
      const { data } = await questionsAPI.bulkCreate(validQuestions);
      if (data.success) {
        toast.success(data.message || `Successfully imported ${validQuestions.length} questions! 📚🎉`);
        // Reset Excel importer
        setExcelData([]);
        setExcelErrors([]);
        setFileName('');
        // Reload data
        loadAdminData();
        fetchExistingQuestions();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to bulk import questions.';
      toast.error(errMsg);
    } finally {
      setImporting(false);
    }
  }

  const handleClearExcel = () => {
    setExcelData([]);
    setExcelErrors([]);
    setFileName('');
    toast.success('Cleared imported spreadsheet data.');
  };

  // Filtered lists
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.preferences?.jobRole?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuestions = existingQuestions.filter(q => {
    const matchSearch = q.text?.toLowerCase().includes(questionsSearch.toLowerCase()) ||
      q.topic?.toLowerCase().includes(questionsSearch.toLowerCase()) ||
      q.role?.toLowerCase().includes(questionsSearch.toLowerCase());
    const matchCat = categoryFilter === '' || q.category === categoryFilter;
    const matchDiff = difficultyFilter === '' || q.difficulty === difficultyFilter;
    return matchSearch && matchCat && matchDiff;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            👑 Admin System Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage user roles, toggle account statuses, and review platform-wide questions distribution.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="p-2.5 rounded-xl border transition-all hover:opacity-85 active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)', color: 'var(--text-secondary)' }}
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              className="p-5 rounded-2xl border flex items-center gap-4 relative overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-blue-400"
                   style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Registered Users</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.totalUsers}</h3>
              </div>
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-400">
                Active Community
              </span>
            </motion.div>

            <motion.div
              className="p-5 rounded-2xl border flex items-center gap-4 relative overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-purple-400"
                   style={{ background: 'rgba(124,58,237,0.1)' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">System Admins</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.totalAdmins}</h3>
              </div>
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/10 text-purple-400">
                Core Admins
              </span>
            </motion.div>

            <motion.div
              className="p-5 rounded-2xl border flex items-center gap-4 relative overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-emerald-400"
                   style={{ background: 'rgba(16,185,129,0.1)' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Bank Questions</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stats.totalQuestions}</h3>
              </div>
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400">
                Ready to Mock
              </span>
            </motion.div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b gap-6 mb-2 border-white/15" style={{ borderColor: 'var(--sidebar-border)' }}>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 font-semibold text-sm transition-all relative ${
                activeTab === 'users' ? 'text-purple-400 font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👤 Users & Analytics
              {activeTab === 'users' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                  layoutId="activeTabUnderline"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-2 ${
                activeTab === 'questions' ? 'text-purple-400 font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📚 Questions Bank & Bulk Excel Import
              {activeTab === 'questions' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                  layoutId="activeTabUnderline"
                />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'users' ? (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* User Management Panel */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                      👤 User Accounts List
                    </h2>
                    <div className="relative w-60">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search name, email, role…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-white/[0.02]" style={{ borderColor: 'var(--sidebar-border)' }}>
                            <th className="p-4 font-semibold text-muted-foreground">User info</th>
                            <th className="p-4 font-semibold text-muted-foreground">Focus Target Role</th>
                            <th className="p-4 font-semibold text-muted-foreground">System Role</th>
                            <th className="p-4 font-semibold text-muted-foreground text-center">Status</th>
                            <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--sidebar-border)' }}>
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-10 text-muted-foreground">
                                No registered users found.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => (
                              <tr key={u._id} className="hover:bg-white/[0.01] transition-colors">
                                {/* User details */}
                                <td className="p-4">
                                  <div className="font-semibold text-foreground">{u.name}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">{u.email}</div>
                                </td>

                                {/* Job preferences */}
                                <td className="p-4">
                                  {u.preferences?.jobRole ? (
                                    <div>
                                      <span className="font-medium text-foreground">{u.preferences.jobRole}</span>
                                      <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded-md">
                                        {u.preferences.experienceLevel || 'mid'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground italic">Not set</span>
                                  )}
                                </td>

                                {/* Role Select */}
                                <td className="p-4">
                                  <select
                                    value={u.role || 'user'}
                                    onChange={e => handleRoleChange(u._id, e.target.value)}
                                    className="bg-transparent border border-white/10 rounded-lg py-1 px-2 text-xs font-semibold outline-none focus:border-purple-500/50 cursor-pointer"
                                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                  >
                                    <option value="user" className="bg-[#0e0e17] text-white">Standard User</option>
                                    <option value="admin" className="bg-[#0e0e17] text-white">Admin 👑</option>
                                  </select>
                                </td>

                                {/* Status */}
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    u.isActive 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${u.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                                    {u.isActive ? 'Active' : 'Deactivated'}
                                  </span>
                                </td>

                                {/* Action toggle */}
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleStatusToggle(u._id, u.isActive)}
                                    className={`p-1.5 rounded-lg border transition-colors inline-flex items-center justify-center ${
                                      u.isActive 
                                        ? 'bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                                        : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                    }`}
                                    title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                                  >
                                    {u.isActive ? <ShieldAlert size={13} /> : <Check size={13} />}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Questions Breakdown Panel */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                    <BarChart2 className="text-purple-400" size={18} />
                    Question Distribution
                  </h2>

                  <div className="p-5 rounded-2xl border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Platform percentage breakdown of interview practice question sets across the central database:
                    </p>

                    <div className="space-y-3.5">
                      {stats.questionsByCategory?.map((cat) => {
                        const pct = stats.totalQuestions > 0 
                          ? Math.round((cat.count / stats.totalQuestions) * 100) 
                          : 0;

                        const colors = {
                          technical:  'bg-purple-500',
                          hr:         'bg-cyan-500',
                          behavioral: 'bg-emerald-500',
                          case_study: 'bg-amber-500',
                          rapid_fire: 'bg-red-500'
                        }[cat._id] || 'bg-gray-500';

                        const label = {
                          technical:  '💻 Technical',
                          hr:         '🤝 HR Round',
                          behavioral: '🎯 Behavioral',
                          case_study: '📊 Case Study',
                          rapid_fire: '⚡ Rapid Fire'
                        }[cat._id] || cat._id;

                        return (
                          <div key={cat._id} className="space-y-1 text-left">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-foreground">{label}</span>
                              <span className="text-muted-foreground">{cat.count} q ({pct}%)</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${colors}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {(!stats.questionsByCategory || stats.questionsByCategory.length === 0) && (
                        <div className="text-center py-6 text-xs text-muted-foreground italic">
                          No questions in bank yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="questions-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Sub-Tabs Selector */}
                <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
                  <button
                    onClick={() => setQuestionsSubTab('single')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      questionsSubTab === 'single'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ✏️ Add Single Question
                  </button>
                  <button
                    onClick={() => setQuestionsSubTab('bulk')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      questionsSubTab === 'bulk'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileSpreadsheet size={13} /> Bulk Excel/CSV Import
                  </button>
                </div>

                {questionsSubTab === 'single' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl border space-y-4"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}
                  >
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-base font-bold text-foreground">Add Single Question to the Bank</h2>
                      <p className="text-xs text-muted-foreground mt-1">Fill out the structural details below to seed a mock question instantly.</p>
                    </div>

                    <form onSubmit={handleSingleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Question Text */}
                        <div className="md:col-span-2 flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-semibold text-muted-foreground">Question Text <span className="text-red-400">*</span></label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Enter the core interview question content..."
                            value={singleQuestion.text}
                            onChange={e => setSingleQuestion({ ...singleQuestion, text: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 resize-y text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-semibold text-muted-foreground">Category <span className="text-red-400">*</span></label>
                          <select
                            value={singleQuestion.category}
                            onChange={e => setSingleQuestion({ ...singleQuestion, category: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 cursor-pointer text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          >
                            <option value="technical" className="bg-[#0e0e17] text-white">💻 Technical</option>
                            <option value="hr" className="bg-[#0e0e17] text-white">🤝 HR Round</option>
                            <option value="behavioral" className="bg-[#0e0e17] text-white">🎯 Behavioral</option>
                            <option value="case_study" className="bg-[#0e0e17] text-white">📊 Case Study</option>
                            <option value="rapid_fire" className="bg-[#0e0e17] text-white">⚡ Rapid Fire</option>
                          </select>
                        </div>

                        {/* Difficulty */}
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-semibold text-muted-foreground">Difficulty <span className="text-red-400">*</span></label>
                          <select
                            value={singleQuestion.difficulty}
                            onChange={e => setSingleQuestion({ ...singleQuestion, difficulty: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 cursor-pointer text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          >
                            <option value="beginner" className="bg-[#0e0e17] text-white">🟢 Beginner</option>
                            <option value="intermediate" className="bg-[#0e0e17] text-white">🟡 Intermediate</option>
                            <option value="advanced" className="bg-[#0e0e17] text-white">🔴 Advanced</option>
                          </select>
                        </div>

                        {/* Target Role */}
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-semibold text-muted-foreground">Target Role</label>
                          <input
                            type="text"
                            placeholder="e.g. Frontend Engineer, Product Manager (Default: Any Role)"
                            value={singleQuestion.role}
                            onChange={e => setSingleQuestion({ ...singleQuestion, role: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Topic */}
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-semibold text-muted-foreground">Topic</label>
                           <input
                            type="text"
                            placeholder="e.g. Closures, Recursion, System Architecture"
                            value={singleQuestion.topic}
                            onChange={e => setSingleQuestion({ ...singleQuestion, topic: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Hint */}
                        <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground">Hint (Optional)</label>
                          <input
                            type="text"
                            placeholder="Provide a quick hint to guide the candidate..."
                            value={singleQuestion.hint}
                            onChange={e => setSingleQuestion({ ...singleQuestion, hint: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Sample Model Answer */}
                        <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground">Sample Answer / Model Solution (Optional)</label>
                          <textarea
                            rows={3}
                            placeholder="Enter the detailed reference answer used to calibrate feedback..."
                            value={singleQuestion.sampleAnswer}
                            onChange={e => setSingleQuestion({ ...singleQuestion, sampleAnswer: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 resize-y text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Expected Answers Keyphrase */}
                        <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground">Expected Keywords / Short Target Answer (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. lexical scope, closures, function reference"
                            value={singleQuestion.expectedAnswer}
                            onChange={e => setSingleQuestion({ ...singleQuestion, expectedAnswer: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Tags */}
                        <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                          <label className="text-xs font-semibold text-muted-foreground">Tags (Comma Separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. javascript, react, logic, behavioral"
                            value={singleQuestion.tags}
                            onChange={e => setSingleQuestion({ ...singleQuestion, tags: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all focus:border-purple-500/50 text-white"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button
                          type="submit"
                          disabled={submittingSingle}
                          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                        >
                          {submittingSingle && <RefreshCw size={12} className="animate-spin" />}
                          Add Question to Bank 🚀
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {questionsSubTab === 'bulk' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bulk Import Form */}
                  <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                      <FileSpreadsheet className="text-purple-400" size={18} />
                      Bulk Excel / CSV Importer
                    </h2>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`p-8 rounded-2xl border-2 border-dashed transition-all relative flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] ${
                        dragActive 
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5' 
                          : 'border-white/10 hover:border-purple-500/40 hover:bg-white/[0.01]'
                      }`}
                      style={{ background: 'var(--bg-card)' }}
                    >
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />

                      <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 animate-pulse">
                        <Upload size={24} />
                      </div>

                      {fileName ? (
                        <div className="space-y-1 z-20">
                          <p className="text-sm font-semibold text-foreground">Selected File:</p>
                          <p className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full font-mono border border-purple-500/20">{fileName}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">Drag another file to replace</p>
                        </div>
                      ) : (
                        <div className="space-y-1 z-20">
                          <p className="text-sm font-semibold text-foreground">Drag and drop your spreadsheet here</p>
                          <p className="text-xs text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV files</p>
                        </div>
                      )}
                    </div>

                    {/* Quick template and active action controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <HelpCircle size={14} className="text-purple-400" />
                        <span>Ready to import questions instantly? Click template →</span>
                      </div>
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-white/5 transition-colors border-white/10 text-foreground"
                      >
                        <Download size={13} />
                        Download Template CSV
                      </button>
                    </div>
                  </div>

                  {/* Excel Column Tips */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                      <Sparkles className="text-yellow-400 animate-spin-slow" size={16} />
                      Spreadsheet Formats
                    </h2>

                    <div className="p-5 rounded-2xl border space-y-4 text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
                      <p className="text-muted-foreground leading-relaxed">
                        To guarantee standard compatibility, make sure your spreadsheet columns match these header names exactly:
                      </p>

                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        <div className="border-b border-white/5 pb-2">
                          <span className="font-semibold text-purple-400 block mb-0.5">text (Required)</span>
                          <span className="text-muted-foreground text-[10px]">The core text content of the interview question.</span>
                        </div>
                        <div className="border-b border-white/5 pb-2">
                          <span className="font-semibold text-purple-400 block mb-0.5">category (Required)</span>
                          <span className="text-muted-foreground text-[10px]">Allowed: <code className="text-yellow-400">technical</code>, <code className="text-yellow-400">hr</code>, <code className="text-yellow-400">behavioral</code>, <code className="text-yellow-400">case_study</code>, <code className="text-yellow-400">rapid_fire</code>.</span>
                        </div>
                        <div className="border-b border-white/5 pb-2">
                          <span className="font-semibold text-purple-400 block mb-0.5">difficulty (Required)</span>
                          <span className="text-muted-foreground text-[10px]">Allowed: <code className="text-emerald-400">beginner</code>, <code className="text-amber-400">intermediate</code>, <code className="text-red-400">advanced</code>.</span>
                        </div>
                        <div className="border-b border-white/5 pb-2">
                          <span className="font-semibold text-muted-foreground block mb-0.5">role / topic (Optional)</span>
                          <span className="text-muted-foreground text-[10px]">Targets specific careers (e.g. <i>Frontend Engineer</i>) and concepts.</span>
                        </div>
                        <div className="pb-1">
                          <span className="font-semibold text-muted-foreground block mb-0.5">hint / tags / sampleAnswer (Optional)</span>
                          <span className="text-muted-foreground text-[10px]">Helps seed high quality model answers and sub-topics.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {/* 2. Interactive Spreadsheet Preview Table (only if data exists) */}
                {excelData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl border space-y-4"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          📊 File Analysis: <span className="text-purple-400">{excelData.length} questions parsed</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Review data validations before writing directly to the MongoDB central cluster.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleClearExcel}
                          disabled={importing}
                          className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all hover:bg-white/5 disabled:opacity-50"
                        >
                          Clear File
                        </button>
                        <button
                          onClick={handleImportConfirm}
                          disabled={importing || excelErrors.length > 0}
                          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-40 flex items-center gap-2"
                        >
                          {importing && <RefreshCw size={12} className="animate-spin" />}
                          Confirm & Import Questions ({excelData.filter(q => q.isValid).length})
                        </button>
                      </div>
                    </div>

                    {/* Quick Warning summary if errors exist */}
                    {excelErrors.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                        <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold">Validation Errors Detected ({excelErrors.length})</p>
                          <p className="mt-0.5 text-red-400/80 leading-relaxed">
                            Some questions fail structural requirements. Please fix them in your spreadsheet and upload again.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div className="border border-white/5 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-[11px] font-semibold text-muted-foreground">
                            <th className="p-3 text-center w-12">Row</th>
                            <th className="p-3 w-28 text-center">Status</th>
                            <th className="p-3">Question Text</th>
                            <th className="p-3 w-28 text-center">Category</th>
                            <th className="p-3 w-24 text-center">Difficulty</th>
                            <th className="p-3 w-28">Target Role</th>
                            <th className="p-3 w-28">Topic</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {excelData.map((row) => (
                            <tr key={row.rowNum} className={`hover:bg-white/[0.01] transition-colors ${!row.isValid ? 'bg-red-500/[0.01]' : ''}`}>
                              <td className="p-3 text-center text-muted-foreground font-mono">{row.rowNum}</td>
                              
                              <td className="p-3 text-center">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <Check size={10} /> Valid
                                  </span>
                                ) : (
                                  <span
                                    title={row.errors.join(' | ')}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 cursor-help"
                                  >
                                    <AlertTriangle size={10} /> {row.errors.length} Error{row.errors.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </td>

                              <td className="p-3 font-medium text-foreground max-w-sm truncate" title={row.text}>
                                {row.text || <span className="text-red-400 italic">Undefined</span>}
                              </td>

                              <td className="p-3 text-center">
                                {row.category ? (
                                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${
                                    {
                                      technical: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                                      hr: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                                      behavioral: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                      case_study: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                      rapid_fire: 'text-red-400 bg-red-500/10 border-red-500/20'
                                    }[row.category] || 'text-muted-foreground bg-white/5 border-white/10'
                                  }`}>
                                    {row.category}
                                  </span>
                                ) : (
                                  <span className="text-red-400 italic">Empty</span>
                                )}
                              </td>

                              <td className="p-3 text-center">
                                {row.difficulty ? (
                                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${
                                    {
                                      beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                      intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                      advanced: 'text-red-400 bg-red-500/10 border-red-500/20'
                                    }[row.difficulty] || 'text-muted-foreground bg-white/5 border-white/10'
                                  }`}>
                                    {row.difficulty}
                                  </span>
                                ) : (
                                  <span className="text-red-400 italic">Empty</span>
                                )}
                              </td>

                              <td className="p-3 text-muted-foreground truncate max-w-[120px]" title={row.role}>{row.role}</td>
                              <td className="p-3 text-muted-foreground truncate max-w-[120px]" title={row.topic}>{row.topic || <span className="italic text-white/20">None</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* 3. Existing Question Bank Explorer */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                        📚 Question Bank Explorer
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Search and inspect the active set of mock questions within the central system repository.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Export Questions */}
                      <button
                        onClick={handleExportQuestions}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-white/5 transition-all border-white/10 text-foreground bg-white/5"
                        title="Export Current Question Bank to Excel"
                      >
                        <Download size={13} className="text-purple-400" /> Export Excel
                      </button>

                      {/* Search */}
                      <div className="relative w-52">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search questions…"
                          value={questionsSearch}
                          onChange={e => setQuestionsSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-all focus:border-purple-500/50"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      {/* Category Filter */}
                      <div className="flex items-center gap-1 bg-[#0e0e17] rounded-lg border border-white/10 px-2 py-1" style={{ borderColor: 'var(--sidebar-border)', background: 'var(--bg-card)' }}>
                        <Filter size={10} className="text-muted-foreground" />
                        <select
                          value={categoryFilter}
                          onChange={e => setCategoryFilter(e.target.value)}
                          className="bg-transparent text-xs text-muted-foreground outline-none border-none cursor-pointer pr-1"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <option value="" className="bg-[#0e0e17]">All Categories</option>
                          <option value="technical" className="bg-[#0e0e17]">💻 Technical</option>
                          <option value="hr" className="bg-[#0e0e17]">🤝 HR Round</option>
                          <option value="behavioral" className="bg-[#0e0e17]">🎯 Behavioral</option>
                          <option value="case_study" className="bg-[#0e0e17]">📊 Case Study</option>
                          <option value="rapid_fire" className="bg-[#0e0e17]">⚡ Rapid Fire</option>
                        </select>
                      </div>

                      {/* Difficulty Filter */}
                      <div className="flex items-center gap-1 bg-[#0e0e17] rounded-lg border border-white/10 px-2 py-1" style={{ borderColor: 'var(--sidebar-border)', background: 'var(--bg-card)' }}>
                        <Filter size={10} className="text-muted-foreground" />
                        <select
                          value={difficultyFilter}
                          onChange={e => setDifficultyFilter(e.target.value)}
                          className="bg-transparent text-xs text-muted-foreground outline-none border-none cursor-pointer pr-1"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <option value="" className="bg-[#0e0e17]">All Difficulties</option>
                          <option value="beginner" className="bg-[#0e0e17]">🟢 Beginner</option>
                          <option value="intermediate" className="bg-[#0e0e17]">🟡 Intermediate</option>
                          <option value="advanced" className="bg-[#0e0e17]">🔴 Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List of existing questions */}
                  <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--sidebar-border)' }}>
                    {loadingQuestions ? (
                      <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs gap-3">
                        <RefreshCw size={18} className="animate-spin text-purple-400" />
                        <span>Fetching current question bank...</span>
                      </div>
                    ) : filteredQuestions.length === 0 ? (
                      <div className="text-center py-12 text-xs text-muted-foreground italic">
                        No matching active questions found in the system.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b bg-white/[0.02]" style={{ borderColor: 'var(--sidebar-border)' }}>
                              <th className="p-4 font-semibold text-muted-foreground w-12 text-center">#</th>
                              <th className="p-4 font-semibold text-muted-foreground">Question Text</th>
                              <th className="p-4 font-semibold text-muted-foreground text-center w-28">Category</th>
                              <th className="p-4 font-semibold text-muted-foreground text-center w-24">Difficulty</th>
                              <th className="p-4 font-semibold text-muted-foreground w-36">Details</th>
                              <th className="p-4 font-semibold text-muted-foreground text-right w-16">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'var(--sidebar-border)' }}>
                            {filteredQuestions.map((q, idx) => (
                              <tr key={q._id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 text-center text-muted-foreground font-mono">{idx + 1}</td>
                                
                                <td className="p-4">
                                  <div className="font-semibold text-foreground leading-normal max-w-md truncate" title={q.text}>{q.text}</div>
                                  {q.tags && q.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {q.tags.map((t, i) => (
                                        <span key={i} className="text-[9px] bg-white/5 border border-white/10 text-muted-foreground px-1.5 py-0.2 rounded-md">
                                          #{t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>

                                <td className="p-4 text-center">
                                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-bold ${
                                    {
                                      technical: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                                      hr: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                                      behavioral: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                      case_study: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                      rapid_fire: 'text-red-400 bg-red-500/10 border-red-500/20'
                                    }[q.category] || 'text-muted-foreground bg-white/5 border-white/10'
                                  }`}>
                                    {q.category === 'rapid_fire' ? '⚡ Rapid Fire' : q.category}
                                  </span>
                                </td>

                                <td className="p-4 text-center">
                                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-bold ${
                                    {
                                      beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                      intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                      advanced: 'text-red-400 bg-red-500/10 border-red-500/20'
                                    }[q.difficulty] || 'text-muted-foreground bg-white/5 border-white/10'
                                  }`}>
                                    {q.difficulty}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <div className="text-[10px] text-foreground"><span className="text-muted-foreground">Role:</span> {q.role || 'Any Role'}</div>
                                  {q.topic && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                      <span className="text-muted-foreground">Topic:</span> <span className="text-foreground">{q.topic}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteQuestion(q._id)}
                                    className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 transition-colors inline-flex items-center justify-center"
                                    title="Delete Question Permanently"
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
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
