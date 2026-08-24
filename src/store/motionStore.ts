import { create } from "zustand";
import type {
  TimelineSequence,
  AnimationTrack,
  MotionKeyframe,
  KeyframeProperty,
  KeyframeEasing,
  SpringConfig,
  NodeId,
} from "../types/canvas";

export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  tension: 170,
  friction: 26,
  mass: 1.0,
  stiffness: 170,
  damping: 26,
};

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  gentle: { tension: 120, friction: 14, mass: 1 },
  wobbly: { tension: 180, friction: 12, mass: 1 },
  stiff: { tension: 210, friction: 20, mass: 1 },
  bouncy: { tension: 250, friction: 10, mass: 1 },
};

interface MotionStoreState {
  sequences: TimelineSequence[];
  activeSequenceId: string | null;
  currentTimeMs: number;
  isPlaying: boolean;
  playbackSpeed: number;

  // Actions
  createSequence: (name?: string, durationMs?: number) => string;
  setActiveSequence: (id: string | null) => void;
  updateSequence: (id: string, updates: Partial<TimelineSequence>) => void;
  deleteSequence: (id: string) => void;
  addTrack: (sequenceId: string, nodeId: NodeId, property: KeyframeProperty) => string;
  removeTrack: (sequenceId: string, trackId: string) => void;
  addKeyframe: (
    sequenceId: string,
    trackId: string,
    timeMs: number,
    value: number,
    easing?: KeyframeEasing,
    springConfig?: SpringConfig
  ) => void;
  updateKeyframe: (
    sequenceId: string,
    trackId: string,
    keyframeId: string,
    updates: Partial<MotionKeyframe>
  ) => void;
  deleteKeyframe: (sequenceId: string, trackId: string, keyframeId: string) => void;
  setCurrentTimeMs: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

const INITIAL_SEQUENCES: TimelineSequence[] = [
  {
    id: "seq-hero-entrance",
    name: "Hero Entrance Sequence",
    durationMs: 3000,
    loop: false,
    autoPlay: true,
    scrollScrub: false,
    scrollTriggerOffset: 0.1,
    tracks: [
      {
        id: "track-1",
        nodeId: "node-hero-title",
        property: "opacity",
        keyframes: [
          { id: "kf-1", timeMs: 0, property: "opacity", value: 0, easing: "easeOut" },
          { id: "kf-2", timeMs: 800, property: "opacity", value: 1, easing: "spring", springConfig: DEFAULT_SPRING_CONFIG },
        ],
      },
      {
        id: "track-2",
        nodeId: "node-hero-title",
        property: "y",
        keyframes: [
          { id: "kf-3", timeMs: 0, property: "y", value: 40, easing: "spring", springConfig: SPRING_PRESETS.bouncy },
          { id: "kf-4", timeMs: 1200, property: "y", value: 0, easing: "spring", springConfig: SPRING_PRESETS.bouncy },
        ],
      },
    ],
  },
];

export const useMotionStore = create<MotionStoreState>((set) => ({
  sequences: INITIAL_SEQUENCES,
  activeSequenceId: "seq-hero-entrance",
  currentTimeMs: 0,
  isPlaying: false,
  playbackSpeed: 1,

  createSequence: (name = "New Animation Sequence", durationMs = 3000) => {
    const id = "seq-" + crypto.randomUUID().slice(0, 8);
    const newSeq: TimelineSequence = {
      id,
      name,
      durationMs,
      loop: false,
      autoPlay: true,
      scrollScrub: false,
      scrollTriggerOffset: 0.2,
      tracks: [],
    };
    set((state) => ({
      sequences: [...state.sequences, newSeq],
      activeSequenceId: id,
    }));
    return id;
  },

  setActiveSequence: (id) => set({ activeSequenceId: id, currentTimeMs: 0, isPlaying: false }),

  updateSequence: (id, updates) =>
    set((state) => ({
      sequences: state.sequences.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  deleteSequence: (id) =>
    set((state) => {
      const filtered = state.sequences.filter((s) => s.id !== id);
      return {
        sequences: filtered,
        activeSequenceId: state.activeSequenceId === id ? (filtered[0]?.id || null) : state.activeSequenceId,
      };
    }),

  addTrack: (sequenceId, nodeId, property) => {
    const trackId = "tr-" + crypto.randomUUID().slice(0, 8);
    set((state) => ({
      sequences: state.sequences.map((seq) => {
        if (seq.id !== sequenceId) return seq;
        const exists = seq.tracks.find((t) => t.nodeId === nodeId && t.property === property);
        if (exists) return seq;
        const newTrack: AnimationTrack = {
          id: trackId,
          nodeId,
          property,
          keyframes: [
            { id: "kf-" + crypto.randomUUID().slice(0, 6), timeMs: 0, property, value: property === "opacity" ? 1 : 0, easing: "easeInOut" },
          ],
        };
        return { ...seq, tracks: [...seq.tracks, newTrack] };
      }),
    }));
    return trackId;
  },

  removeTrack: (sequenceId, trackId) =>
    set((state) => ({
      sequences: state.sequences.map((seq) =>
        seq.id === sequenceId ? { ...seq, tracks: seq.tracks.filter((t) => t.id !== trackId) } : seq
      ),
    })),

  addKeyframe: (sequenceId, trackId, timeMs, value, easing = "easeInOut", springConfig) =>
    set((state) => ({
      sequences: state.sequences.map((seq) => {
        if (seq.id !== sequenceId) return seq;
        return {
          ...seq,
          tracks: seq.tracks.map((tr) => {
            if (tr.id !== trackId) return tr;
            const newKf: MotionKeyframe = {
              id: "kf-" + crypto.randomUUID().slice(0, 6),
              timeMs,
              property: tr.property,
              value,
              easing,
              springConfig,
            };
            const sortedKf = [...tr.keyframes, newKf].sort((a, b) => a.timeMs - b.timeMs);
            return { ...tr, keyframes: sortedKf };
          }),
        };
      }),
    })),

  updateKeyframe: (sequenceId, trackId, keyframeId, updates) =>
    set((state) => ({
      sequences: state.sequences.map((seq) => {
        if (seq.id !== sequenceId) return seq;
        return {
          ...seq,
          tracks: seq.tracks.map((tr) => {
            if (tr.id !== trackId) return tr;
            const updatedKf = tr.keyframes
              .map((kf) => (kf.id === keyframeId ? { ...kf, ...updates } : kf))
              .sort((a, b) => a.timeMs - b.timeMs);
            return { ...tr, keyframes: updatedKf };
          }),
        };
      }),
    })),

  deleteKeyframe: (sequenceId, trackId, keyframeId) =>
    set((state) => ({
      sequences: state.sequences.map((seq) => {
        if (seq.id !== sequenceId) return seq;
        return {
          ...seq,
          tracks: seq.tracks.map((tr) =>
            tr.id === trackId ? { ...tr, keyframes: tr.keyframes.filter((kf) => kf.id !== keyframeId) } : tr
          ),
        };
      }),
    })),

  setCurrentTimeMs: (time) => set({ currentTimeMs: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
}));
