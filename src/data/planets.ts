export type Planet = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  distanceFromSun: string;
  diameter: string;
  dayLength: string;
  yearLength: string;
  moons: number;
  temperature: string;
  color: string;
  glow: string;
  orbitRadius: number;
  size: number;
};

export const planets: Planet[] = [
  {
    id: "mercury",
    name: "Mercury",
    tagline: "The Swift Messenger",
    description:
      "The smallest planet and closest to the Sun. Mercury has no atmosphere to retain heat, creating extreme temperature swings from scorching days to freezing nights.",
    distanceFromSun: "57.9 million km",
    diameter: "4,879 km",
    dayLength: "59 Earth days",
    yearLength: "88 Earth days",
    moons: 0,
    temperature: "−173°C to 427°C",
    color: "#b5b5b5",
    glow: "rgba(181, 181, 181, 0.4)",
    orbitRadius: 70,
    size: 12,
  },
  {
    id: "venus",
    name: "Venus",
    tagline: "Earth's Twin",
    description:
      "Similar in size to Earth but shrouded in thick clouds of sulfuric acid. Venus has a runaway greenhouse effect, making it the hottest planet in our solar system.",
    distanceFromSun: "108.2 million km",
    diameter: "12,104 km",
    dayLength: "243 Earth days",
    yearLength: "225 Earth days",
    moons: 0,
    temperature: "462°C average",
    color: "#e8cda0",
    glow: "rgba(232, 205, 160, 0.45)",
    orbitRadius: 95,
    size: 18,
  },
  {
    id: "earth",
    name: "Earth",
    tagline: "The Blue Marble",
    description:
      "The only known planet with life. Earth's liquid water, protective atmosphere, and magnetic field create the perfect conditions for diverse ecosystems.",
    distanceFromSun: "149.6 million km",
    diameter: "12,742 km",
    dayLength: "24 hours",
    yearLength: "365.25 days",
    moons: 1,
    temperature: "15°C average",
    color: "#4a90d9",
    glow: "rgba(74, 144, 217, 0.5)",
    orbitRadius: 120,
    size: 20,
  },
  {
    id: "mars",
    name: "Mars",
    tagline: "The Red Planet",
    description:
      "A cold desert world with the largest volcano and canyon in the solar system. Evidence suggests Mars once had flowing water and a thicker atmosphere.",
    distanceFromSun: "227.9 million km",
    diameter: "6,779 km",
    dayLength: "24.6 hours",
    yearLength: "687 Earth days",
    moons: 2,
    temperature: "−65°C average",
    color: "#c1440e",
    glow: "rgba(193, 68, 14, 0.45)",
    orbitRadius: 145,
    size: 16,
  },
  {
    id: "jupiter",
    name: "Jupiter",
    tagline: "King of Planets",
    description:
      "A gas giant so massive it could fit all other planets inside it. The Great Red Spot is a storm larger than Earth that has raged for centuries.",
    distanceFromSun: "778.5 million km",
    diameter: "139,820 km",
    dayLength: "9.9 hours",
    yearLength: "12 Earth years",
    moons: 95,
    temperature: "−110°C",
    color: "#c88b3a",
    glow: "rgba(200, 139, 58, 0.4)",
    orbitRadius: 185,
    size: 44,
  },
  {
    id: "saturn",
    name: "Saturn",
    tagline: "Lord of the Rings",
    description:
      "Famous for its spectacular ring system made of ice and rock. Saturn is less dense than water — it would float in a bathtub big enough to hold it.",
    distanceFromSun: "1.43 billion km",
    diameter: "116,460 km",
    dayLength: "10.7 hours",
    yearLength: "29 Earth years",
    moons: 146,
    temperature: "−140°C",
    color: "#e8d5a3",
    glow: "rgba(232, 213, 163, 0.4)",
    orbitRadius: 225,
    size: 38,
  },
  {
    id: "uranus",
    name: "Uranus",
    tagline: "The Sideways Planet",
    description:
      "An ice giant that rotates on its side, likely due to an ancient collision. Its pale blue-green color comes from methane in the atmosphere.",
    distanceFromSun: "2.87 billion km",
    diameter: "50,724 km",
    dayLength: "17.2 hours",
    yearLength: "84 Earth years",
    moons: 28,
    temperature: "−195°C",
    color: "#7de3f4",
    glow: "rgba(125, 227, 244, 0.35)",
    orbitRadius: 260,
    size: 28,
  },
  {
    id: "neptune",
    name: "Neptune",
    tagline: "The Windy Giant",
    description:
      "The most distant planet, with supersonic winds reaching 2,100 km/h. Neptune was the first planet discovered through mathematical prediction.",
    distanceFromSun: "4.5 billion km",
    diameter: "49,244 km",
    dayLength: "16.1 hours",
    yearLength: "165 Earth years",
    moons: 16,
    temperature: "−200°C",
    color: "#3b5bdb",
    glow: "rgba(59, 91, 219, 0.45)",
    orbitRadius: 295,
    size: 27,
  },
];
