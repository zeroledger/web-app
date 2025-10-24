// Generate a simple hash from a string to use as seed
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate a seeded random number
const seededRandom = (seed: number, max: number): number => {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
};

// Generate a random color palette
const generateColorPalette = (seed: number): string[] => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
  ];

  const shuffled = [...colors];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = seededRandom(seed + i, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 5);
};

// Generate pixel pattern
const generatePixelPattern = (seed: number): boolean[][] => {
  const pattern: boolean[][] = [];
  for (let i = 0; i < 5; i++) {
    pattern[i] = [];
    for (let j = 0; j < 5; j++) {
      // Create a symmetric pattern
      const shouldFill = seededRandom(seed + i * 5 + j, 2) === 0;
      pattern[i][j] = shouldFill;
    }
  }
  return pattern;
};

// Create SVG for the pixel avatar
const createPixelAvatar = (seed: number): string => {
  const colors = generateColorPalette(seed);
  const pattern = generatePixelPattern(seed);

  let svg = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svg += `<rect width="40" height="40" fill="${colors[0]}" rx="8"/>`;

  // Generate pixels
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (pattern[i][j]) {
        const colorIndex = seededRandom(seed + i + j, colors.length);
        const x = j * 8;
        const y = i * 8;
        svg += `<rect x="${x}" y="${y}" width="8" height="8" fill="${colors[colorIndex]}"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
};

export const Avatar = ({
  avatar,
  className,
  address,
}: {
  avatar?: string;
  className?: string;
  address?: string;
}) => {
  if (avatar) {
    return <img src={avatar} alt="avatar" className={className} />;
  }

  // Generate seed from address or fallback to a random one
  const seed = address
    ? hashString(address)
    : Math.floor(Math.random() * 1000000);
  const svgData = createPixelAvatar(seed);
  const dataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;

  return (
    <img
      src={dataUrl}
      alt="generated avatar"
      className={className}
      aria-label="generated pixel avatar"
    />
  );
};
