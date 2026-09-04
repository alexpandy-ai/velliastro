export type Graha = {
  id: string;
  nameTamil: string;
  nameShort: string;
  firstLetterTamil: string;
  nameEnglish: string;
  color: string;
  symbol: string;
};

/** Navagrahas with Tamil names. */
export const grahas: Graha[] = [
  { id: "surya", nameTamil: "சூரியன்", nameShort: "சூ", firstLetterTamil: "ச", nameEnglish: "Sun", color: "#ff8c00", symbol: "☉" },
  { id: "chandra", nameTamil: "சந்திரன்", nameShort: "ச", firstLetterTamil: "ச", nameEnglish: "Moon", color: "#94a3b8", symbol: "☽" },
  { id: "sevvai", nameTamil: "செவ்வாய்", nameShort: "செ", firstLetterTamil: "ச", nameEnglish: "Mars", color: "#c1440e", symbol: "♂" },
  { id: "budhan", nameTamil: "புதன்", nameShort: "பு", firstLetterTamil: "ப", nameEnglish: "Mercury", color: "#4caf50", symbol: "☿" },
  { id: "guru", nameTamil: "வியாழன்", nameShort: "வி", firstLetterTamil: "வ", nameEnglish: "Jupiter", color: "#f5c842", symbol: "♃" },
  { id: "sukran", nameTamil: "சுக்கிரன்", nameShort: "சு", firstLetterTamil: "ச", nameEnglish: "Venus", color: "#f8b4d9", symbol: "♀" },
  { id: "sani", nameTamil: "சனி", nameShort: "ச", firstLetterTamil: "ச", nameEnglish: "Saturn", color: "#5b7fd4", symbol: "♄" },
  { id: "rahu", nameTamil: "ராகு", nameShort: "ரா", firstLetterTamil: "ர", nameEnglish: "Rahu", color: "#6b5b7a", symbol: "☊" },
  { id: "ketu", nameTamil: "கேது", nameShort: "கே", firstLetterTamil: "க", nameEnglish: "Ketu", color: "#9a7b5c", symbol: "☋" },
];
