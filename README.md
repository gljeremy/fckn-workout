# fckn workout

Find a workout routine that fits your week, then load it straight into [Liftosaur](https://www.liftosaur.com).

fckn workout works like [Shapefinder](https://shapefinder.cc/) does for mice: a cloud of routines floats behind one question at a time, and every answer narrows it, with the best matches in the middle. Eight questions cover goal, experience, days a week, session length, equipment, muscles to bring up, things to leave out, and pounds or kilograms. Answers live in the URL, so a result can be shared or bookmarked.

## How a routine is made

- **24 routine templates** (`src/model/templates.ts`) describe a week as days of movement slots: "squat, main lift", "lateral raise, accessory", each with a priority.
- **The engine** (`src/model/engine.ts`) scores every template against the answers, then builds each one for this lifter:
  - picks exercises the equipment allows, including supporting gear such as a bench or pull-up bar, skipping anything ruled out (`src/model/exercises.ts`); dumbbell, kettlebell and calisthenics templates stay within their native equipment even in a full gym;
  - sets sets, reps, rest and starting weight from goal, level and role;
  - adds extra exercises or sets for the muscles picked where equipment and session time allow, then trims each day using Liftosaur's workout-time model, including timed holds and unilateral work, with five minutes left for warm-ups. It cuts sets on lower-priority exercises first (no lower than three for main lifts or two for other exercises), then drops exercises while keeping at least two per day.
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
npm test           # unit tests: routine rules, exports and URL answers
npx playwright test
npm run lint
```

## Deploying

The Vite build uses the fixed public base `/fckn-workout/`. The Docker image serves the built site at nginx's root (`Dockerfile`, `nginx.conf`, `compose.yml`): the homelab catalog proxy strips `/fckn-workout` before forwarding requests, including asset requests. Health checks go directly to `http://fckn-workout:80/health`, which returns `200 ok`. On the homelab it joins the external `homelab` network and is registered in the homelab repo's `apps/registry.yml`.
