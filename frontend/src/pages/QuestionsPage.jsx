/* ── QuestionsPage — Upgraded Question Bank & Admin CRUD ───────── */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Code2, Users, Heart,
  Briefcase, Zap, ChevronDown, ChevronUp,
  Lightbulb, Eye, EyeOff, Filter, RefreshCw,
  Plus, Pencil, Trash2, X, AlertCircle, Save,
  Download, Upload, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { questionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ── Constants ───────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',        label: 'All',        emoji: '📚', icon: BookOpen  },
  { id: 'technical',  label: 'Technical',  emoji: '💻', icon: Code2     },
  { id: 'hr',         label: 'HR Round',   emoji: '🤝', icon: Users     },
  { id: 'behavioral', label: 'Behavioral', emoji: '🎯', icon: Heart     },
  { id: 'case_study', label: 'Case Study', emoji: '📊', icon: Briefcase },
  { id: 'rapid_fire', label: 'Rapid Fire', emoji: '⚡', icon: Zap       },
];

const DIFFICULTIES = [
  { id: 'all',          label: 'All Levels', color: 'var(--text-secondary)' },
  { id: 'beginner',     label: 'Beginner',   color: '#10b981' },
  { id: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
  { id: 'advanced',     label: 'Advanced',   color: '#ef4444' },
];

const DIFF_BADGE = {
  beginner:     { label: 'Beginner',     color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  advanced:     { label: 'Advanced',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)'    },
};

const CAT_COLORS = {
  technical:  { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  hr:         { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  behavioral: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  case_study: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  rapid_fire: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

/* ── Question Card ───────────────────────────────────────────── */
function QuestionCard({ q, index, isAdmin, onEdit, onDelete }) {
  const [open, setOpen]         = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const diff  = DIFF_BADGE[q.difficulty]  || DIFF_BADGE.beginner;
  const cat   = CAT_COLORS[q.category]    || CAT_COLORS.technical;
  const catMeta = CATEGORIES.find(c => c.id === q.category) || CATEGORIES[1];

  return (
    <motion.div
      className="rounded-2xl border overflow-hidden cursor-pointer"
      style={{
        background: 'var(--bg-card)',
        borderColor: open ? cat.color + '55' : 'var(--sidebar-border)',
        transition: 'border-color 0.2s',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4"
        onClick={() => { setOpen(o => !o); setShowAnswer(false); }}
      >
        {/* Number */}
        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
             style={{ background: cat.color }}>
          {index + 1}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed">{q.text}</p>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {/* Category */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: cat.bg, color: cat.color }}>
              {catMeta.emoji} {catMeta.label}
            </span>
            {/* Difficulty */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: diff.bg, color: diff.color }}>
              {diff.label}
            </span>
            {/* Topic */}
            {q.topic && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {q.topic}
              </span>
            )}
            {/* Role */}
            {q.role && q.role !== 'Any Role' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                👤 {q.role}
              </span>
            )}
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 shrink-0 self-center mr-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(q); }}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
              title="Edit Question"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(q._id); }}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              title="Delete Question"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Chevron */}
        <div className="shrink-0 text-muted-foreground mt-0.5">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
              {/* Hint */}
              {q.hint && (
                <div className="flex items-start gap-2 mt-3 p-3 rounded-xl"
                     style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <Lightbulb size={14} className="shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
                  <div>
                    <div className="text-[11px] font-semibold text-purple-400 mb-0.5">HINT</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{q.hint}</p>
                  </div>
                </div>
              )}

              {/* Sample / Expected Answer toggle */}
              {(q.sampleAnswer || q.expectedAnswer) && (
                <div>
                  <button
                    onClick={() => setShowAnswer(a => !a)}
                    className="flex items-center gap-1.5 text-xs font-semibold mb-2 transition-colors"
                    style={{ color: showAnswer ? '#10b981' : 'var(--text-secondary)' }}
                  >
                    {showAnswer ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showAnswer ? 'Hide Answer' : 'Show Sample Answer'}
                  </button>

                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 rounded-xl text-xs leading-relaxed"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--text-secondary)' }}
                      >
                        {q.sampleAnswer || q.expectedAnswer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Tags */}
              {q.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {q.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function QuestionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [questions,   setQuestions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState('all');
  const [difficulty,  setDifficulty]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal Control for Create/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Bulk Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelErrors, setExcelErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Form Field States
  const [text, setText] = useState('');
  const [categoryInput, setCategoryInput] = useState('technical');
  const [difficultyInput, setDifficultyInput] = useState('beginner');
  const [roleInput, setRoleInput] = useState('Any Role');
  const [topicInput, setTopicInput] = useState('');
  const [hintInput, setHintInput] = useState('');
  const [sampleAnswerInput, setSampleAnswerInput] = useState('');
  const [expectedAnswerInput, setExpectedAnswerInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await questionsAPI.getByCategory(
        category   !== 'all' ? category   : undefined,
        difficulty !== 'all' ? difficulty : undefined,
      );
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, [category, difficulty]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // Export questions to Excel
  const handleExport = () => {
    if (questions.length === 0) {
      toast.error('No questions available to export.');
      return;
    }

    try {
      const dataToExport = questions.map(q => ({
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
      XLSX.writeFile(workbook, "confidentai_questions_export.xlsx");
      toast.success("Questions exported successfully as Excel! 📊📥");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export question bank.");
    }
  };

  // Wipe all questions
  const handleWipeAll = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: You are about to permanently DELETE ALL interview questions from the system. " +
      "This includes all seed questions. This action CANNOT be undone.\n\n" +
      "Do you want to proceed and wipe the database?"
    );
    if (!confirmed) return;

    try {
      const { data } = await questionsAPI.wipeAll();
      if (data.success) {
        toast.success("Question bank wiped completely! 🗑️🧹");
        fetchQuestions();
      }
    } catch (err) {
      console.error("Wipe failed:", err);
      toast.error(err.response?.data?.message || "Failed to wipe question bank.");
    }
  };

  // Drag and drop handlers
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
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleExcelUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
    }
  };

  const processExcelFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
          toast.error('The selected file has no records.');
          return;
        }

        const validated = [];
        const errors = [];
        const allowedCats = ['technical', 'hr', 'behavioral', 'case_study', 'rapid_fire'];
        const allowedDiffs = ['beginner', 'intermediate', 'advanced'];

        rawData.forEach((row, index) => {
          const rowNum = index + 2;
          const text = row.text || row.Question || row.question;
          let category = row.category || row.Category;
          let difficulty = row.difficulty || row.Difficulty;

          if (!text) {
            errors.push(`Row ${rowNum}: 'text' column is empty.`);
            return;
          }

          if (category) {
            category = String(category).toLowerCase().trim();
            if (category === 'hr round') category = 'hr';
            if (category === 'case study') category = 'case_study';
            if (category === 'rapid fire') category = 'rapid_fire';
          }

          if (difficulty) {
            difficulty = String(difficulty).toLowerCase().trim();
          }

          if (!category || !allowedCats.includes(category)) {
            errors.push(`Row ${rowNum}: category must be one of: ${allowedCats.join(', ')}.`);
            return;
          }

          if (!difficulty || !allowedDiffs.includes(difficulty)) {
            errors.push(`Row ${rowNum}: difficulty must be beginner, intermediate, or advanced.`);
            return;
          }

          validated.push({
            text: String(text).trim(),
            category,
            difficulty,
            role: row.role || row.Role || 'Any Role',
            topic: row.topic || row.Topic || '',
            hint: row.hint || row.Hint || '',
            sampleAnswer: row.sampleAnswer || row.Answer || row.sample_answer || '',
            expectedAnswer: row.expectedAnswer || row.expected_answer || '',
            tags: row.tags ? String(row.tags).split(',').map(t => t.trim()).filter(Boolean) : []
          });
        });

        setExcelData(validated);
        setExcelErrors(errors);

        if (errors.length > 0) {
          toast.error(`Found ${errors.length} formatting errors in the file.`);
        } else {
          toast.success(`Successfully parsed ${validated.length} questions! 🎉`);
        }
      } catch (error) {
        console.error('Spreadsheet parse failed:', error);
        toast.error('Invalid spreadsheet file format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportConfirm = async () => {
    if (excelData.length === 0) return;
    setImporting(true);
    try {
      const res = await questionsAPI.bulkCreate(excelData);
      if (res.data.success) {
        toast.success(`Successfully uploaded ${res.data.count} questions! 📚🚀`);
        setExcelData([]);
        setFileName('');
        setExcelErrors([]);
        setShowImportModal(false);
        fetchQuestions();
      }
    } catch (err) {
      console.error('Import failed:', err);
      const errMsg = err.response?.data?.message || 'Failed to complete bulk import.';
      toast.error(errMsg);
    } finally {
      setImporting(false);
    }
  };

  // Client-side search filter
  const filtered = questions.filter(q =>
    !search ||
    q.text.toLowerCase().includes(search.toLowerCase()) ||
    q.topic?.toLowerCase().includes(search.toLowerCase()) ||
    q.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  // Modal actions
  function openAddModal() {
    setEditingQuestion(null);
    setText('');
    setCategoryInput('technical');
    setDifficultyInput('beginner');
    setRoleInput('Any Role');
    setTopicInput('');
    setHintInput('');
    setSampleAnswerInput('');
    setExpectedAnswerInput('');
    setTagsInput('');
    setShowModal(true);
  }

  function openEditModal(q) {
    setEditingQuestion(q);
    setText(q.text || '');
    setCategoryInput(q.category || 'technical');
    setDifficultyInput(q.difficulty || 'beginner');
    setRoleInput(q.role || 'Any Role');
    setTopicInput(q.topic || '');
    setHintInput(q.hint || '');
    setSampleAnswerInput(q.sampleAnswer || '');
    setExpectedAnswerInput(q.expectedAnswer || '');
    setTagsInput(q.tags?.join(', ') || '');
    setShowModal(true);
  }

  // Submit new or edited question
  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      text,
      category: categoryInput,
      difficulty: difficultyInput,
      role: roleInput,
      topic: topicInput,
      hint: hintInput,
      sampleAnswer: sampleAnswerInput,
      expectedAnswer: expectedAnswerInput,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    };

    try {
      if (editingQuestion) {
        const { data } = await questionsAPI.update(editingQuestion._id, payload);
        if (data.success) {
          toast.success('Question updated successfully! 📝');
          fetchQuestions();
          setShowModal(false);
        }
      } else {
        const { data } = await questionsAPI.create(payload);
        if (data.success) {
          toast.success('New question added successfully! 📚');
          fetchQuestions();
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save question.');
    }
  }

  // Delete question
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const { data } = await questionsAPI.delete(id);
      if (data.success) {
        toast.success('Question deleted successfully. 🗑️');
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete question.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            📚 Question Bank 
            {isAdmin && <span className="badge badge-purple py-1 text-[10px]">Admin Manager</span>}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin 
              ? 'Manage, add, and update the central AI mock interview database.' 
              : 'Browse, filter, and study interview questions across all categories.'
            }
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={openAddModal}
              className="btn btn-primary inline-flex items-center gap-2 text-xs font-semibold py-2 px-3 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Plus size={14} /> Add Question
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white inline-flex items-center gap-1.5 text-xs font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
              title="Export Question Bank to Excel"
            >
              <Download size={13} className="text-purple-400" /> Export Excel
            </button>
            <button
              onClick={() => {
                setExcelData([]);
                setFileName('');
                setExcelErrors([]);
                setShowImportModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white inline-flex items-center gap-1.5 text-xs font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
              title="Import Spreadsheet in Bulk"
            >
              <Upload size={13} className="text-purple-400" /> Import Excel
            </button>
            <button
              onClick={handleWipeAll}
              className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 inline-flex items-center gap-1.5 text-xs font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
              title="Permanently Delete All Questions (Clear Seed Questions)"
            >
              <Trash2 size={13} /> Wipe Bank
            </button>
          </div>
        )}
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions, topics, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--sidebar-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: showFilters ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
            border: `1px solid ${showFilters ? 'rgba(124,58,237,0.4)' : 'var(--sidebar-border)'}`,
            color: showFilters ? '#a78bfa' : 'var(--text-secondary)',
          }}
        >
          <Filter size={14} /> Filters
        </button>
        <button
          onClick={fetchQuestions}
          className="p-2.5 rounded-xl transition-all hover:opacity-80"
          title="Shuffle / Refresh"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--sidebar-border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl space-y-4"
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--sidebar-border)' }}>

              {/* Category filter */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: category === c.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-elevated)',
                        border: `1px solid ${category === c.id ? 'rgba(124,58,237,0.5)' : 'transparent'}`,
                        color: category === c.id ? '#a78bfa' : 'var(--text-secondary)',
                      }}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty filter */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: difficulty === d.id ? d.color + '22' : 'var(--bg-elevated)',
                        border: `1px solid ${difficulty === d.id ? d.color + '66' : 'transparent'}`,
                        color: difficulty === d.id ? d.color : 'var(--text-secondary)',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground font-semibold">{filtered.length}</span> question{filtered.length !== 1 ? 's' : ''}
          {search && <span> for "<span className="text-purple-400">{search}</span>"</span>}
        </p>
        {(category !== 'all' || difficulty !== 'all') && (
          <button
            onClick={() => { setCategory('all'); setDifficulty('all'); }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear filters ✕
          </button>
        )}
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse"
                 style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">No questions found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <QuestionCard
              key={q._id}
              q={q}
              index={i}
              isAdmin={isAdmin}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ADMIN ADD/EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0e0e17] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <BookOpen className="text-purple-400" size={22} />
                  {editingQuestion ? 'Edit Question Details' : 'Add New Interview Question'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="divider"></div>

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                {/* Textarea for text */}
                <div className="form-group">
                  <label className="form-label text-sm font-semibold">Question Prompt *</label>
                  <textarea
                    required
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="e.g. Tell me about a time you had a conflict with a co-worker and how you resolved it."
                    rows={3}
                    className="form-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      value={categoryInput}
                      onChange={e => setCategoryInput(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <option value="technical">Technical</option>
                      <option value="hr">HR Round</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="case_study">Case Study</option>
                      <option value="rapid_fire">Rapid Fire</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty *</label>
                    <select
                      value={difficultyInput}
                      onChange={e => setDifficultyInput(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Role</label>
                    <input
                      type="text"
                      value={roleInput}
                      onChange={e => setRoleInput(e.target.value)}
                      placeholder="e.g. Frontend Engineer, Any Role"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Focus Topic</label>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      placeholder="e.g. React Hooks, STAR Method"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Helpful Hint / Tip</label>
                  <textarea
                    value={hintInput}
                    onChange={e => setHintInput(e.target.value)}
                    placeholder="Provide a hint or conceptual outline..."
                    rows={2}
                    className="form-input"
                  />
                </div>

                {categoryInput === 'rapid_fire' ? (
                  <div className="form-group animate-fadeIn">
                    <label className="form-label">Expected Answer (Rapid Fire Concise Answer)</label>
                    <input
                      type="text"
                      value={expectedAnswerInput}
                      onChange={e => setExpectedAnswerInput(e.target.value)}
                      placeholder="A short concise answer to display immediately..."
                      className="form-input"
                    />
                  </div>
                ) : (
                  <div className="form-group animate-fadeIn">
                    <label className="form-label">Sample Answer / Response Model</label>
                    <textarea
                      value={sampleAnswerInput}
                      onChange={e => setSampleAnswerInput(e.target.value)}
                      placeholder="Detailed exemplary standard response..."
                      rows={3}
                      className="form-input"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="e.g. react, hooks, javascript, state"
                    className="form-input"
                  />
                </div>

                <div className="divider"></div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-5"
                  >
                    <Save size={14} /> {editingQuestion ? 'Save Updates' : 'Add to Bank'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN BULK IMPORT MODAL */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0e0e17] p-6 shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <FileSpreadsheet className="text-purple-400" size={22} />
                  Bulk Excel / CSV Question Importer
                </h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="divider" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>

              {/* Drag and Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`p-8 rounded-2xl border-2 border-dashed transition-all relative flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] ${
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

                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
                  <Upload size={20} />
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

              {/* Validation errors or success */}
              {excelErrors.length > 0 && (
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-2">
                  <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Validation Errors Found ({excelErrors.length})
                  </p>
                  <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                    {excelErrors.map((err, i) => (
                      <p key={i} className="text-[10px] text-red-400/80 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {excelData.length > 0 && excelErrors.length === 0 && (
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    ✔️ Excel File Parsed Successfully!
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Found <strong className="text-foreground">{excelData.length} valid questions</strong> ready to import.
                  </p>
                </div>
              )}

              <div className="divider" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-[11px] text-muted-foreground">
                  Need a template?{' '}
                  <span
                    onClick={() => {
                      const templateData = [
                        {
                          text: "Tell me about a time you resolved a major team conflict.",
                          category: "behavioral",
                          difficulty: "intermediate",
                          role: "Product Manager",
                          topic: "Conflict Resolution",
                          hint: "Use the STAR method.",
                          sampleAnswer: "I once managed a designer and developer who disagreed on...",
                          expectedAnswer: "STAR method, collaboration",
                          tags: "teamwork, conflict"
                        }
                      ];
                      const worksheet = XLSX.utils.json_to_sheet(templateData);
                      const workbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
                      XLSX.writeFile(workbook, "confidentai_template.csv");
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
                  >
                    Download CSV Template
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="btn btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={importing || excelData.length === 0 || excelErrors.length > 0}
                    onClick={handleImportConfirm}
                    className="btn btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-5 disabled:opacity-50"
                  >
                    {importing && <RefreshCw size={12} className="animate-spin" />}
                    Confirm Batch Upload 🚀
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
