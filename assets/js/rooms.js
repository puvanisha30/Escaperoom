// ============================================================
// ROOM DEFINITIONS — 20 unique chambers of the Cursed Palace.
// Each room has its own palette, particle atmosphere, guardian,
// math topic, and (sometimes) a unique relic reward.
// ============================================================

const ROOMS = [
  { name: "Main Gate", topic: "Algebra", particle: "dust", colors: ["#2b2f3a", "#171a22", "#6b5b2f"], guardian: "🛡️", guardianName: "Stone Sentinel", item: "Bronze Key" },
  { name: "Royal Garden", topic: "Geometry", particle: "leaves", colors: ["#1f4034", "#0e2019", "#7a9e5c"], guardian: "🌿", guardianName: "Garden Warden", item: "Compass" },
  { name: "Hall of Mirrors", topic: "Number Theory", particle: "fireflies", colors: ["#2a1f45", "#120c24", "#b9a6ff"], guardian: "🪞", guardianName: "Mirror Wraith", item: "Silver Key" },
  { name: "Knight Hall", topic: "Logic", particle: "dust", colors: ["#3a1414", "#1a0a0a", "#9a8360"], guardian: "⚔️", guardianName: "Iron Knight", item: null },
  { name: "Ancient Library", topic: "Patterns", particle: "dust", colors: ["#3a2c17", "#1c140a", "#c9a227"], guardian: "📖", guardianName: "Whispering Scribe", item: "Magic Scroll" },
  { name: "Dragon Chamber", topic: "Coordinate Geometry", particle: "embers", colors: ["#3a0f0f", "#160505", "#ff7b3d"], guardian: "🐲", guardianName: "Ember Drake", item: "Dragon Scale" },
  { name: "Crystal Cave", topic: "Sequences", particle: "fireflies", colors: ["#0f3a38", "#081b1a", "#6be2d6"], guardian: "💎", guardianName: "Crystal Golem", item: "Magic Gem" },
  { name: "Magic Observatory", topic: "Probability", particle: "fireflies", colors: ["#0d0f2b", "#050614", "#c9a227"], guardian: "🔭", guardianName: "Star Oracle", item: null },
  { name: "Clock Tower", topic: "Algebra", particle: "dust", colors: ["#332a1c", "#171208", "#b08d57"], guardian: "⏰", guardianName: "Time Keeper", item: "Ancient Coin" },
  { name: "The Maze", topic: "Geometry", particle: "fog", colors: ["#232d24", "#101512", "#8fae8a"], guardian: "🌀", guardianName: "Maze Phantom", item: null },
  { name: "Treasure Room", topic: "Number Theory", particle: "embers", colors: ["#3a2e0a", "#1a1404", "#ffd166"], guardian: "💰", guardianName: "Treasure Wisp", item: "Golden Key" },
  { name: "Royal Kitchen", topic: "Logic", particle: "dust", colors: ["#3a230f", "#1a0f06", "#e0995e"], guardian: "🍲", guardianName: "Kitchen Ghost", item: null },
  { name: "Dungeon", topic: "Patterns", particle: "fog", colors: ["#1c1c1e", "#0a0a0b", "#6d6d70"], guardian: "⛓️", guardianName: "Chained Brute", item: "Shield" },
  { name: "Bridge Room", topic: "Coordinate Geometry", particle: "snowRain", colors: ["#1c2a3a", "#0a121c", "#9fc4e0"], guardian: "🌉", guardianName: "Bridge Keeper", item: null },
  { name: "Royal Vault", topic: "Sequences", particle: "embers", colors: ["#332400", "#170f00", "#ffcf40"], guardian: "🔐", guardianName: "Vault Guardian", item: "Royal Ring" },
  { name: "Temple Hall", topic: "Probability", particle: "dust", colors: ["#3a3218", "#1a1608", "#d9c27e"], guardian: "🛕", guardianName: "Temple Statue", item: null },
  { name: "King's Court", topic: "Algebra", particle: "fireflies", colors: ["#2a1440", "#120821", "#e0b84c"], guardian: "👑", guardianName: "Court Herald", item: "Sword" },
  { name: "Secret Tunnel", topic: "Geometry", particle: "fog", colors: ["#1a2418", "#0a0f08", "#6b8c5a"], guardian: "🕳️", guardianName: "Tunnel Shade", item: null },
  { name: "Guardian Chamber", topic: "Number Theory", particle: "embers", colors: ["#3a0a14", "#1a0508", "#ff5c7a"], guardian: "🗿", guardianName: "Ancient Guardian", item: "Crystal" },
  { name: "Final Throne Room", topic: "Logic", particle: "fireflies", colors: ["#2a2005", "#141002", "#ffe08a"], guardian: "🌑", guardianName: "Lord Chaos", item: "Final Crown Piece" }
];

window.PalaceRooms = ROOMS;
