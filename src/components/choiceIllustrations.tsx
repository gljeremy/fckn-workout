import type { ReactNode } from 'react';
import { Art } from './Icons';

export const ChoiceArt: Record<string, () => ReactNode> = {
  muscle: () => (
    <Art>
      <circle cx="24" cy="8.5" r="4.5" className="art-fill" />
      <path d="M10 16c4-2 9-3 14-3s10 1 14 3l-6 16h-16z" className="art-fill" />
      <path d="M17 33h14l-2 8h-10z" className="art-fill" />
    </Art>
  ),
  strength: () => (
    <Art>
      <rect x="6" y="16" width="5" height="16" rx="1.5" className="art-fill" />
      <rect x="11" y="19" width="4" height="10" rx="1" className="art-fill" />
      <rect x="37" y="16" width="5" height="16" rx="1.5" className="art-fill" />
      <rect x="33" y="19" width="4" height="10" rx="1" className="art-fill" />
      <path d="M15 24h18" className="art-line" />
    </Art>
  ),
  both: () => (
    <Art>
      <rect x="6" y="20" width="4" height="12" rx="1.2" className="art-fill" />
      <rect x="38" y="20" width="4" height="12" rx="1.2" className="art-fill" />
      <path d="M10 26h28" className="art-line" />
      <path d="M17 18c0-5 3-8 7-9l2 3-2 2c2 .5 4 .5 6-1 2 2 2 5 0 7" className="art-line" />
    </Art>
  ),
  fitness: () => (
    <Art>
      <path d="M24 38s-13-7-13-17a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 10-13 17-13 17z" className="art-fill" />
      <path d="M13 25h6l2-4 4 8 2-4h8" className="art-line art-on-fill" />
    </Art>
  ),
  gym: () => (
    <Art>
      <path d="M8 38V18l16-8 16 8v20" className="art-line" />
      <rect x="15" y="25" width="3" height="9" rx="1" className="art-fill" />
      <rect x="30" y="25" width="3" height="9" rx="1" className="art-fill" />
      <path d="M18 29.5h12" className="art-line" />
    </Art>
  ),
  homeBarbell: () => (
    <Art>
      <path d="M8 22L24 9l16 13M12 19v19h24V19" className="art-line" />
      <rect x="16" y="27" width="2.5" height="8" rx="1" className="art-fill" />
      <rect x="29.5" y="27" width="2.5" height="8" rx="1" className="art-fill" />
      <path d="M18.5 31h11" className="art-line" />
    </Art>
  ),
  dumbbells: () => (
    <Art>
      <rect x="8" y="17" width="7" height="14" rx="2.5" className="art-fill" />
      <rect x="33" y="17" width="7" height="14" rx="2.5" className="art-fill" />
      <path d="M15 24h18" className="art-line" />
    </Art>
  ),
  kettlebell: () => (
    <Art>
      <path d="M17 18a7 7 0 0 1 14 0" className="art-line" />
      <path d="M14 30a10 10 0 0 1 20 0c0 5-3 8-6 8h-8c-3 0-6-3-6-8z" className="art-fill" />
    </Art>
  ),
  bodyweight: () => (
    <Art>
      <circle cx="24" cy="10" r="4" className="art-fill" />
      <path d="M24 15v12M24 27l-6 11M24 27l6 11M14 19l10 2 10-2" className="art-line" />
    </Art>
  ),
};
