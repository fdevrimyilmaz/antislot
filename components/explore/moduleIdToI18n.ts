import type { Translations } from "@/i18n/translations";
import type { ExploreModuleId } from "@/types/explore";

const ID_TO_KEY: Record<ExploreModuleId, keyof Translations["exploreModules"]> = {
  "future-simulator": "futureSimulator",
  "invisible-cost": "invisibleCost",
  "brain-map": "brainMap",
  "identity-mode": "identityMode",
  "loss-counter": "lossCounter",
  "urge-masks": "urgeMasks",
  "reality-feed": "realityFeed",
  "alternative-life": "alternativeLife",
};

export function getModuleTitle(t: Translations, id: ExploreModuleId): string {
  return t.exploreModules[ID_TO_KEY[id]].title;
}

export function getModuleSubtitle(t: Translations, id: ExploreModuleId): string {
  return t.exploreModules[ID_TO_KEY[id]].subtitle;
}
