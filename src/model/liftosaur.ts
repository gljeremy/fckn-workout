import { fullName } from './exercises';
import type { BuiltExercise, Routine } from './engine';

/**
 * Liftosaur's data version for exported programs. The app migrates older
 * versions forward on import, so this only needs bumping if the export shape
 * changes.
 */
export const LIFTOSAUR_VERSION = '20261022120000';
export const LIFTOSAUR_PROGRAM_URL = 'https://www.liftosaur.com/program';

const WEIGHTS_NOTE = '// Starting weights are a best guess. Adjust them in your first session.';
const REPS_NOTE = '// Hit every rep and the next session asks for one more.';

function line(e: BuiltExercise, withProgress: boolean): string {
  const name = `${e.label ? `${e.label}: ` : ''}${fullName(e.option)}`;
  const { rx } = e;
  const parts = [name];
  if (rx.hold) {
    parts.push(`${rx.sets} ${rx.hold}s|${rx.rest}s`);
  } else {
    parts.push(rx.sets);
    parts.push(rx.weight ? `${rx.weight.value}${rx.weight.units} ${rx.rest}s` : `${rx.rest}s`);
  }
  if (withProgress && rx.progress) parts.push(`progress: ${rx.progress.replace(/\s*\n\s*/g, ' ')}`);
  return parts.join(' / ');
}

/** Each day's Liftoscript, with every progression defined once. */
export function dayTexts(r: Routine): string[] {
  const seen = new Set<string>();
  const weighted = r.days.some((d) => d.exercises.some((e) => e.rx.weight));
  return r.days.map((d, di) => {
    const lines: string[] = [];
    d.exercises.forEach((e, ei) => {
      const key = `${e.label ?? ''}:${fullName(e.option)}`;
      if (di === 0 && ei === 0) lines.push(weighted ? WEIGHTS_NOTE : REPS_NOTE);
      lines.push(line(e, !seen.has(key)));
      seen.add(key);
    });
    return lines.join('\n');
  });
}

/** The whole program as Liftoscript, for pasting into Liftosaur's editor. */
export function programText(r: Routine): string {
  const texts = dayTexts(r);
  return ['# Week 1', ...r.days.flatMap((d, i) => [`## ${d.name}`, texts[i]])].join('\n');
}

/** Liftosaur's "v2" export: the same shape its own web editor shares. */
export function exportedProgram(r: Routine) {
  const texts = dayTexts(r);
  return {
    type: 'v2' as const,
    version: LIFTOSAUR_VERSION,
    id: programId(r),
    program: {
      vtype: 'planner' as const,
      name: r.name,
      weeks: [{ name: 'Week 1', days: r.days.map((d, i) => ({ name: d.name, exerciseText: texts[i] })) }],
    },
    settings: { exercises: {}, timer: 180 },
  };
}

/** A stable 8-character id, so re-importing the same routine offers to overwrite it. */
export function programId(r: Routine): string {
  const text = programText(r) + r.name;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `fw${(h >>> 0).toString(36).padStart(6, '0').slice(0, 6)}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/**
 * Liftosaur's link encoding: gzip, wrap as a base64 data URL, then base64 the
 * data URL again.
 */
export async function encode(text: string): Promise<string> {
  const gz = await pipe(new TextEncoder().encode(text), new CompressionStream('gzip'));
  return btoa(`data:application/octet-stream;base64,${toBase64(gz)}`);
}

export async function decode(data: string): Promise<string> {
  const dataUrl = atob(data);
  const b64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const raw = await pipe(fromBase64(b64), new DecompressionStream('gzip'));
  return new TextDecoder().decode(raw);
}

/** A link that opens the routine in Liftosaur and imports into the app. */
export async function liftosaurLink(r: Routine): Promise<string> {
  const data = await encode(JSON.stringify(exportedProgram(r)));
  const url = new URL(LIFTOSAUR_PROGRAM_URL);
  url.searchParams.set('data', data);
  return url.toString();
}
