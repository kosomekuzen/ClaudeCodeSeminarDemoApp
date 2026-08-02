export type Station = {
  line: string;
  name: string;
  walkMinutes: number;
};

export type NearbyFacility = {
  name: string;
  distanceMeters: number;
  walkMinutes: number;
};

export type PropertyImage = {
  src: string;
  alt: string;
};

export type Property = {
  id: string;
  name: string;
  ward: string;
  address: string;
  rentManYen: number;
  managementFeeYen: number;
  layout: string;
  sizeSqm: number;
  buildingAgeYears: number;
  floorInfo: string;
  images: PropertyImage[];
  station: Station;
  supermarket: NearbyFacility;
  hospital: NearbyFacility;
};
