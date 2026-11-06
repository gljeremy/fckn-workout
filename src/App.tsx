import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cloud } from './components/Cloud';
import { BackIcon, GridIcon, Logo, RestartIcon } from './components/Icons';
import { QuestionCard } from './components/QuestionCard';
import { Results } from './components/Results';
import { buildRoutine, isStrongFit, rankTemplates, type Routine } from './model/engine';
import { QUESTIONS, answeredCount, nextQuestion, parseHash, toHash } from './model/quiz';
import { TEMPLATES } from './model/templates';
import type { Answers } from './model/types';

function useAnswers(): [Answers, (a: Answers) => void] {
  const [answers, setAnswers] = useState<Answers>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setAnswers(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const set = useCallback((a: Answers) => {
    const hash = toHash(a);
    // Each answer is a history entry, so the browser's Back button steps back through the quiz.
    if (hash) window.location.hash = hash;
    else history.pushState(null, '', window.location.pathname + window.location.search);
    setAnswers(a);
  }, []);
  return [answers, set];
}

export function App() {
  const [answers, setAnswers] = useAnswers();
  const [open, setOpen] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openResults = (id: string, trigger: HTMLElement) => {
    opener.current = trigger;
    setOpen(id);
  };
  const closeResults = useCallback(() => setOpen(null), []);
  useEffect(() => {
    if (open === null) opener.current?.focus();
  }, [open]);

  const matches = useMemo(() => rankTemplates(answers), [answers]);
  const routines = useMemo(() => {
    const map = new Map<string, Routine>();
    for (const t of TEMPLATES) map.set(t.id, buildRoutine(t, answers));
    return map;
  }, [answers]);
  const strong = useMemo(() => {
    const top = matches.find((m) => !m.excluded)?.score ?? 0;
    return new Set(matches.filter((m) => isStrongFit(m, top)).map((m) => m.template.id));
  }, [matches]);

  const question = nextQuestion(answers);
  const step = answeredCount(answers);

  const answer = (value: unknown) => {
    if (!question) return;
    const v = question.multi ? (value as unknown[]).filter((x) => x !== question.none) : value;
    setAnswers({ ...answers, [question.id]: v });
  };
  const back = () => {
    const at = question ? QUESTIONS.indexOf(question) : QUESTIONS.length;
    const prev = [...QUESTIONS.slice(0, at)].reverse().find((q) => answers[q.id] !== undefined);
    if (!prev) return;
    const next = { ...answers };
    delete next[prev.id];
    setAnswers(next);
  };
  const restart = () => {
    setOpen(null);
    setAnswers({});
  };

  const best = matches.find((m) => !m.excluded);
  const fitting = strong.size;

  return (
    <div className="app">
      <header className="top" inert={open !== null}>
        <a className="brand" href="#" onClick={(e) => (e.preventDefault(), restart())}>
          <Logo />
          <span>fckn workout</span>
        </a>
        <nav className="top-actions">
          <button type="button" className="btn btn-dark btn-small" onClick={(e) => openResults(best?.template.id ?? TEMPLATES[0].id, e.currentTarget)}>
            <GridIcon />
            Browse all
          </button>
          {step > 0 && (
            <button type="button" className="icon-btn ring" onClick={restart} aria-label="Start over">
              <RestartIcon />
            </button>
          )}
        </nav>
      </header>

      <main className="stage" inert={open !== null}>
        <h1 className="sr-only">fckn workout: find a workout routine that fits your week</h1>
        <p className="intro sr-only">
          Answer a few questions about your goal, schedule and equipment, and fckn workout narrows {TEMPLATES.length} routines down to the ones that
          fit, then sends your pick to Liftosaur.
        </p>
        <Cloud matches={matches} routines={routines} strong={strong} onOpen={openResults} />

        <div className="dock">
          <p className="status" aria-live="polite">
            {step === 0 ? (
              <>Find a workout routine that fits your week. <b>{TEMPLATES.length} routines.</b></>
            ) : (
              <>
                <b>
                  {fitting} of {TEMPLATES.length}
                </b>{' '}
                routines are a strong fit for your answers. The best are in the center.
              </>
            )}
          </p>
          {question ? (
            <QuestionCard
              key={question.id}
              question={question}
              answers={answers}
              step={step + 1}
              total={QUESTIONS.length}
              onAnswer={answer}
              onBack={step > 0 ? back : undefined}
              onRestart={step > 0 ? restart : undefined}
            />
          ) : (
            <section className="card done-card" aria-labelledby="done-title">
              <div className="card-head">
                <div className="card-tools">
                  <button type="button" className="icon-btn" onClick={back} aria-label="Previous question">
                    <BackIcon />
                  </button>
                  <button type="button" className="icon-btn" onClick={restart} aria-label="Start over">
                    <RestartIcon />
                  </button>
                </div>
                <h2 id="done-title">Your matches</h2>
                <span className="step" />
              </div>
              <div className="done-actions">
                <button type="button" className="btn btn-primary" onClick={(e) => openResults(best?.template.id ?? TEMPLATES[0].id, e.currentTarget)}>
                  See {best?.template.name ?? 'your matches'}
                </button>
                <button type="button" className="btn btn-quiet" onClick={(e) => openResults(best?.template.id ?? TEMPLATES[0].id, e.currentTarget)}>
                  Compare all {fitting} matches
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {open && (
        <Results matches={matches} routines={routines} selected={open} strong={strong} onSelect={setOpen} onClose={closeResults} />
      )}
    </div>
  );
}
