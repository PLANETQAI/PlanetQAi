export const TEXTURE_PATH = "/textures/avatarBackground.png";

// Updated to match the available morph targets: mouthOpen and mouthSmile
export const CORRESPONDING_VISEME = {
  // Vowels and open sounds
  A: "mouthOpen",
  E: "mouthSmile",
  I: "mouthSmile",
  O: "mouthOpen",
  U: "mouthOpen",
  
  // Consonants and other sounds
  B: "mouthSmile",
  C: "mouthSmile",
  D: "mouthSmile",
  F: "mouthSmile",
  G: "mouthOpen",
  H: "mouthOpen",
  J: "mouthSmile",
  K: "mouthOpen",
  L: "mouthSmile",
  M: "mouthSmile",
  N: "mouthSmile",
  P: "mouthSmile",
  Q: "mouthOpen",
  R: "mouthSmile",
  S: "mouthSmile",
  T: "mouthSmile",
  V: "mouthSmile",
  W: "mouthOpen",
  X: "mouthSmile",
  Y: "mouthSmile",
  Z: "mouthSmile",
  
  // Default/fallback
  ' ': 'mouthSmile'
};