import { useState } from 'react';
import type { Question } from '../model/quiz';
import type { Answers } from '../model/types';
import { BackIcon, CheckIcon, ChoiceArt, ClockArt, DaysArt, RestartIcon } from './Icons';
import { TRAINING_DAYS } from '../model/week';

interface Props {
  question: Question;
  answers: Answers;
  step: number;
  total: number;
  onAnswer: (value: unknown) => void;
  onBack?: () => void;
  onRestart?: () => void;
}

function art(q: Question, value: unknown) {
  if (q.id === 'days') return <DaysArt slots={TRAINING_DAYS[value as number]} />;
  if (q.id === 'minutes') return <ClockArt minutes={value as number} />;
  const draw = ChoiceArt[String(value)];
  return draw ? draw() : null;
}

export function QuestionCard({ question: q, answers, step, total, onAnswer, onBack, onRestart }: Props) {
  // Multi-select picks stay local until Continue.
  const [picked, setPicked] = useState<unknown[]>(() => (answers[q.id] as unknown[] | undefined) ?? []);
  const recommended = q.recommend?.(answers);
  const withArt = q.id === 'goal' || q.id === 'setup' || q.id === 'days' || q.id === 'minutes';

  const toggle = (value: unknown) => {
    if (value === q.none) return setPicked(picked.includes(value) ? [] : [value]);
    const rest = picked.filter((v) => v !== q.none);
    setPicked(rest.includes(value) ? rest.filter((v) => v !== value) : [...rest, value]);
  };

  return (
    <section className="card quiz-card" aria-labelledby="question-title">
      <div className="card-head">
        <div className="card-tools">
          {onBack && (
            <button type="button" className="icon-btn" onClick={onBack} aria-label="Previous question">
              <BackIcon />
            </button>
          )}
          {onRestart && (
            <button type="button" className="icon-btn" onClick={onRestart} aria-label="Start over">
              <RestartIcon />
            </button>
          )}
        </div>
        <h2 id="question-title">{q.title}</h2>
        <span className="step" aria-label={`Question ${step} of ${total}`}>
          {step}/{total}
        </span>
      </div>
      {q.hint && <p className="hint">{q.hint}</p>}
      <div className={`choices choices-${q.choices.length}${withArt ? ' with-art' : ''}`} role={q.multi ? 'group' : 'radiogroup'} aria-labelledby="question-title">
        {q.choices.map((c) => {
          const on = q.multi ? picked.includes(c.value) : answers[q.id] === c.value;
          return (
            <button
              type="button"
              key={String(c.value)}
              className={`choice${on ? ' on' : ''}`}
              role={q.multi ? 'checkbox' : 'radio'}
              aria-checked={on}
              onClick={() => (q.multi ? toggle(c.value) : onAnswer(c.value))}
            >
              {recommended === c.value && <span className="badge-rec">Recommended</span>}
              {on && q.multi && (
                <span className="check" aria-hidden="true">
                  <CheckIcon />
                </span>
              )}
              {withArt && art(q, c.value)}
              <span className="choice-title">{c.title}</span>
              {c.sub && <span className="choice-sub">{c.sub}</span>}
            </button>
          );
        })}
      </div>
      {q.multi && (
        <button type="button" className="btn btn-primary btn-wide" disabled={picked.length === 0} onClick={() => onAnswer(picked)}>
          Continue
        </button>
      )}
    </section>
  );
}
