# fckn workout

Find a workout routine that fits your week, then load it straight into [Liftosaur](https://www.liftosaur.com).

fckn workout works like [Shapefinder](https://shapefinder.cc/) does for mice: a cloud of routines floats behind one question at a time, and every answer narrows it, with the best matches in the middle. Eight questions cover goal, experience, days a week, session length, equipment, muscles to bring up, things to leave out, and pounds or kilograms. Answers live in the URL, so a result can be shared or bookmarked.

## How a routine is made

- **24 routine templates** (`src/model/templates.ts`) describe a week as days of movement slots: "squat, main lift", "lateral raise, accessory", each with a priority.
- **The engine** (`src/model/engine.ts`) scores every template against the answers, then builds each one for this lifter:
  - picks exercises the equipment allows, skipping anything ruled out (`src/model/exercises.ts`);
  - sets sets, reps, rest and starting weight from goal, level and role;
  - adds extra work for the muscles picked, then trims each day to the session length, using Liftosaur's own workout-time estimate (20 s to set up, 7 s a rep, plus rest) with five minutes left for warm-ups.
- **Progression** is written in Liftoscript: `lp` for fixed-rep strength work, `dp` (double progression) for rep ranges, and a small custom script that adds a rep to unloaded bodyweight moves.

## Getting it into Liftosaur

`src/model/liftosaur.ts` writes the routine as a Liftosaur "v2" planner export, the same shape Liftosaur's web editor shares, and encodes it the way Liftosaur does (gzip, base64 data URL, base64 again) into `https://www.liftosaur.com/program?data=…`. That one link:

- opens the routine in Liftosaur's web editor (**Open in Liftosaur**), and
- imports into the app from **Choose program → Import from link** (**Copy import link**).

**Copy Liftoscript** gives the plain program text for pasting into the editor.

No account, API key or server is involved: it all runs in the browser. Exercise names come from Liftosaur's built-in library; `tests/fixtures/liftosaur-exercises.json` (taken from Liftosaur's source) is what the tests check them against.

## Development

```bash
npm install
npm run dev        # http://localhost:5173/fckn-workout/
npm test           # unit tests: every routine for every combination of answers
npx playwright test
npm run lint
```

## Deploying

A Docker image builds the site and serves it from nginx under `/fckn-workout/` (`Dockerfile`, `nginx.conf`, `compose.yml`), with `/fckn-workout/health` for health checks. On the homelab it joins the `homelab` network and is registered in the homelab repo's `apps/registry.yml`.
