import create from 'zustand'
import niceColorPalette from 'nice-color-palettes/1000'

export const MAX_INDEX = 900
export const INIT_INDEX = MAX_INDEX / 2
export const NUM = 8
export const useWheel = create((set) => ({
    wheelIndex: INIT_INDEX,
    wheelOpen: false,
    palette: niceColorPalette[INIT_INDEX],
    setPalette: (palette) => set({ palette }),
    increaseWheelIndex: () => set((state) => ({ wheelIndex: state.wheelIndex + 1 })),
    decreaseWheelIndex: () => set((state) => ({ wheelIndex: state.wheelIndex - 1 })),
    toggleWheel: () => set((state) => ({ wheelOpen: !state.wheelOpen }))
  }))