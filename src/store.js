import create from 'zustand'
import niceColorPalette from 'nice-color-palettes/1000'
import produce from 'immer'
import debounce from 'lodash.debounce'

export const MAX_INDEX = 900
export const INIT_INDEX = MAX_INDEX / 2 + (Math.random() > 0.5 ? -1 : 1) * Math.round(200 * Math.random())
export const NUM = 8

const persist = (config) => (set, get, api) =>
  config(
    (args) => {
      set(args)

      const { colors, wheelIndex } = get()

      const currentS = window.location.search

      const s = new URLSearchParams({
        c: btoa(colors.join('')),
        p: wheelIndex
      })

      const sString = s.toString()
      if (currentS !== sString) {
        window.history.replaceState('', '', `?${s.toString()}`)
      }
    },
    get,
    api
  )

const params = new URLSearchParams(window.location.search)

const c = params.get('c')
const p = params.get('p') || INIT_INDEX

const colors = c
  ? atob(c).split('')
  : [...new Array(36)].map((_) => {
      return Math.round(Math.random() * 4)
    })

const wheelIndex = p <= MAX_INDEX ? parseInt(p, 10) : INIT_INDEX

export const useWheel = create(
  persist((set, get) => ({
    wheelIndex,
    wheelOpen: false,
    palette: niceColorPalette[wheelIndex],
    colors,

    setIndex: (index, paletteIndex) =>
      set({
        colors: produce(get().colors, (draft) => {
          draft[index] = paletteIndex
        })
      }),

    setPalette: (palette) => set({ palette }),
    setWheelIndex: (wheelIndex) => set({wheelIndex}),
    increaseWheelIndex: debounce(() => set((state) => ({ wheelIndex: state.wheelIndex + 1 })), 20),
    decreaseWheelIndex: debounce(() => set((state) => ({ wheelIndex: state.wheelIndex - 1 })), 20),
    toggleWheel: () => set((state) => ({ wheelOpen: !state.wheelOpen }))
  }))
)
