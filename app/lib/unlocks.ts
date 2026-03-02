// app/lib/unlocks.ts
import type { City } from '../data/city';

export interface UnlockItem {
  id: string;
  type: 'district' | 'building' | 'floor';
  name: string;
  subtitle: string;   // district tagline | building "know" at its start level | "New floor — <Building>"
  districtId: string;
  buildingId?: string;
}

export function getUnlocksForLevel(level: number, city: City): UnlockItem[] {
  const items: UnlockItem[] = [];

  for (const district of city.districts) {
    // New district
    if (district.appearsAtLevel === level) {
      items.push({
        id: `district:${district.id}`,
        type: 'district',
        name: district.name,
        subtitle: district.tagline,
        districtId: district.id,
      });
    }

    for (const building of district.buildings) {
      const buildingAppearsAt = building.appearsAtLevel ?? district.appearsAtLevel;

      // New building (appeared at this level, district existed before OR same level)
      if (buildingAppearsAt === level) {
        const firstFloor = building.floors[0];
        items.push({
          id: `building:${building.id}`,
          type: 'building',
          name: building.name,
          subtitle: firstFloor?.know ?? '',
          districtId: district.id,
          buildingId: building.id,
        });
      }

      // New floor on a pre-existing building (building appeared before this level)
      if (buildingAppearsAt < level && building.floorStartLevel === level) {
        items.push({
          id: `floor:${building.id}:${level}`,
          type: 'floor',
          name: building.name,
          subtitle: `New floor — ${district.name}`,
          districtId: district.id,
          buildingId: building.id,
        });
      }
    }
  }

  return items;
}
