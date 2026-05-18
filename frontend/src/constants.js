// Dimensiones del frame de referencia
export const FRAME_W = 1280
export const FRAME_H = 720

// Viewfinder — fracción del frame
export const VF_W     = 0.45
export const VF_H     = 0.55
export const VF_LEFT  = (1 - VF_W) / 2          // 0.275
export const VF_TOP   = (1 - VF_H) / 2          // 0.225
export const VF_RIGHT  = VF_LEFT + VF_W          // 0.725
export const VF_BOTTOM = VF_TOP  + VF_H          // 0.775
