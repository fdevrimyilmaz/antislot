/**
 * Keşfet (Explore) modül sistemi tipleri.
 * Tasarım: docs/KESFET_SYSTEM_DESIGN.md
 */

export type ExploreModuleType = "core" | "external";

export type ExploreModuleId =
  | "future-simulator"
  | "invisible-cost"
  | "brain-map"
  | "identity-mode"
  | "loss-counter"
  | "urge-masks"
  | "reality-feed"
  | "alternative-life";

export interface ExploreModuleMeta {
  id: ExploreModuleId;
  type: ExploreModuleType;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  route: string;
  order: number;
  featureFlag?: string;
}
