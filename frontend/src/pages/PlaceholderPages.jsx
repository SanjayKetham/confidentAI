/* Placeholder pages — Tailwind */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

function ComingSoon({ title, emoji, desc }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        className="text-center max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-6xl mb-5">{emoji}</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{desc}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/dashboard">
            <Button className="h-9 text-white text-sm rounded-xl hover:opacity-90"
                    style={{ background: 'var(--gradient-brand)' }}>
              ← Dashboard
            </Button>
          </Link>
          <Link to="/practice">
            <Button variant="outline" className="h-9 text-sm rounded-xl border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-foreground">
              Start Practice
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export const QuestionsPage    = () => <ComingSoon emoji="📚" title="Question Bank"    desc="Browse 1000+ interview questions by category, role, and difficulty. Coming in Day 6 implementation." />;
export const CodingPage       = () => <ComingSoon emoji="💻" title="Coding Interview" desc="Monaco editor + test cases + timer. Coming in Day 15 implementation." />;
export const AnalyticsPage    = () => <ComingSoon emoji="📊" title="Analytics"        desc="Full performance charts, confidence trends, and session history. Coming in Day 13." />;
export const NotFoundPage     = () => <ComingSoon emoji="🔍" title="Page Not Found"   desc="The page you're looking for doesn't exist." />;
