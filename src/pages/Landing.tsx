import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Zap,
  Users,
  Code2,
  Play,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/* ---------- Animated counter ---------- */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setVal(Math.floor(p * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

const features = [
  { icon: Zap, title: 'Real-time sync', desc: 'Every keystroke is shared instantly across the classroom via WebSockets.' },
  { icon: Play, title: 'Run code live', desc: 'Execute Python, JS, Java, C & C++ in-browser with instant results.' },
  { icon: Users, title: 'Live participants', desc: 'See who is online, with live cursors and presence indicators.' },
  { icon: MessageSquare, title: 'Built-in chat', desc: 'Discuss problems without leaving the editor.' },
  { icon: ShieldCheck, title: 'Secure auth', desc: 'Firebase authentication with token-verified API access.' },
  { icon: Sparkles, title: 'Beautiful UI', desc: 'Glassmorphism, dark mode, and buttery-smooth animations.' },
];

const stats = [
  { value: 12000, suffix: '+', label: 'Lines synced daily' },
  { value: 850, suffix: '+', label: 'Active classrooms' },
  { value: 99, suffix: '%', label: 'Uptime' },
  { value: 5, suffix: '', label: 'Languages supported' },
];

const pricing = [
  { name: 'Student', price: '$0', period: '/forever', features: ['Join classrooms', 'Live code sync', 'Run code', 'Chat'], cta: 'Start free', highlight: false },
  { name: 'Instructor', price: '$12', period: '/month', features: ['Everything in Student', 'Create classrooms', 'Assign problems', 'Track submissions', 'Analytics'], cta: 'Go Pro', highlight: true },
  { name: 'Institution', price: 'Custom', period: '', features: ['Unlimited classrooms', 'SSO', 'Priority support', 'Custom branding'], cta: 'Contact us', highlight: false },
];

const faqs = [
  { q: 'How does real-time collaboration work?', a: 'CodeSync uses WebSockets (Socket.IO) to broadcast code changes, cursors, and chat to everyone in a classroom instantly.' },
  { q: 'Which languages can I run?', a: 'Python, JavaScript, Java, C, and C++ — powered by the Judge0 execution engine.' },
  { q: 'Is my data secure?', a: 'Authentication is handled by Firebase, and every API request is verified with a signed token on the backend.' },
  { q: 'Do I need to install anything?', a: 'No. CodeSync runs entirely in the browser — just sign in and start coding together.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="cursor-pointer" >
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen((o) => !o)}>
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={18} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pt-3 text-sm text-muted">{a}</p>
      </motion.div>
    </Card>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pt-20 pb-28">
        <div className="pointer-events-none absolute inset-0 gradient-bg opacity-70" />
        <motion.div
          style={{ y }}
          className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-float"
        />
        <motion.div
          style={{ y }}
          className="pointer-events-none absolute top-40 -left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-float"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-muted"
          >
            <Sparkles size={14} className="text-primary" />
            Real-time collaborative learning platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl"
          >
            Code together,<br />
            <span className="gradient-text">learn faster.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted"
          >
            A live coding classroom where instructors and students write, run, and
            discuss code in real time — with instant execution and zero setup.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button size="lg">Start coding free</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">See features</Button>
            </a>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="relative mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <Card className="text-center">
                <div className="text-3xl font-extrabold gradient-text md:text-4xl">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs text-muted">{s.label}</div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-extrabold tracking-tight">
                Everything a modern classroom needs
              </h2>
              <p className="mt-4 text-muted">
                Built for instructors and students who want to move fast together.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Card className="h-full">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                      <f.icon size={22} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted">{f.desc}</p>
                  </Card>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product demo mock */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted">classroom · main.py</span>
              </div>
              <pre className="overflow-x-auto bg-bg p-6 text-sm leading-relaxed">
<code><span className="text-accent">def</span> <span className="text-primary">greet</span>(name):
    <span className="text-accent">return</span> <span className="text-green-500">f"Hello, {'{name}'}! 👋"</span>

<span className="text-accent">print</span>(greet(<span className="text-green-500">"classroom"</span>))
<span className="text-muted"># → Hello, classroom! 👋  (synced live to everyone)</span></code>
              </pre>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-extrabold tracking-tight">Simple pricing</h2>
              <p className="mt-4 text-muted">Start free. Upgrade when you teach.</p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {pricing.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <Card className={`h-full ${p.highlight ? 'border-primary ring-2 ring-primary/40' : ''}`}>
                  {p.highlight && (
                    <div className="mb-3 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      Most popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <div className="mt-3 text-4xl font-extrabold">
                    {p.price}
                    <span className="text-base font-normal text-muted">{p.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="mt-6 block">
                    <Button variant={p.highlight ? 'primary' : 'outline'} className="w-full">
                      {p.cta}
                    </Button>
                  </Link>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-4xl font-extrabold tracking-tight">
              Frequently asked questions
            </h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.05}>
                <FAQItem {...f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <Card className="relative overflow-hidden text-center">
              <div className="absolute inset-0 gradient-bg opacity-60" />
              <div className="relative py-10">
                <h2 className="text-3xl font-extrabold md:text-4xl">
                  Ready to code together?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted">
                  Create your first classroom in seconds. No credit card required.
                </p>
                <Link to="/register" className="mt-8 inline-block">
                  <Button size="lg">Get started — it's free</Button>
                </Link>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
