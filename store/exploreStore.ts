/**
 * Keşfet (Explore) hub state.
 * Modül listesi ve son ziyaret; tasarım: docs/KESFET_SYSTEM_DESIGN.md
 */

import type { ExploreModuleId, ExploreModuleMeta, ExploreModuleType } from "@/types/explore";
import { create } from "zustand";

const EXPLORE_MODULES: ExploreModuleMeta[] = [
  { id: "future-simulator", type: "core", titleKey: "exploreModules.futureSimulator.title", subtitleKey: "exploreModules.futureSimulator.subtitle", icon: "chart.line.uptrend.xyaxis", route: "/explore/future-simulator", order: 1 },
  { id: "invisible-cost", type: "core", titleKey: "exploreModules.invisibleCost.title", subtitleKey: "exploreModules.invisibleCost.subtitle", icon: "eye.slash", route: "/explore/invisible-cost", order: 2 },
  { id: "brain-map", type: "core", titleKey: "exploreModules.brainMap.title", subtitleKey: "exploreModules.brainMap.subtitle", icon: "brain.head.profile", route: "/explore/brain-map", order: 3 },
  { id: "identity-mode", type: "core", titleKey: "exploreModules.identityMode.title", subtitleKey: "exploreModules.identityMode.subtitle", icon: "person.2", route: "/explore/identity-mode", order: 4 },
  { id: "loss-counter", type: "core", titleKey: "exploreModules.lossCounter.title", subtitleKey: "exploreModules.lossCounter.subtitle", icon: "chart.bar", route: "/explore/loss-counter", order: 5 },
  { id: "urge-masks", type: "core", titleKey: "exploreModules.urgeMasks.title", subtitleKey: "exploreModules.urgeMasks.subtitle", icon: "theatermasks", route: "/explore/urge-masks", order: 6 },
  { id: "reality-feed", type: "external", titleKey: "exploreModules.realityFeed.title", subtitleKey: "exploreModules.realityFeed.subtitle", icon: "newspaper", route: "/explore/reality-feed", order: 7 },
  { id: "alternative-life", type: "external", titleKey: "exploreModules.alternativeLife.title", subtitleKey: "exploreModules.alternativeLife.subtitle", icon: "leaf", route: "/explore/alternative-life", order: 8 },
];

interface ExploreStoreState {
  modules: ExploreModuleMeta[];
  lastVisitedModule: ExploreModuleId | null;
  getModulesByType: (type: ExploreModuleType) => ExploreModuleMeta[];
  setLastVisited: (id: ExploreModuleId | null) => void;
}

export const useExploreStore = create<ExploreStoreState>((set, get) => ({
  modules: EXPLORE_MODULES,
  lastVisitedModule: null,
  getModulesByType: (type) => get().modules.filter((m) => m.type === type).sort((a, b) => a.order - b.order),
  setLastVisited: (id) => set({ lastVisitedModule: id }),
}));
