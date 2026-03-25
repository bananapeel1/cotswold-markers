// Seasonal and wildlife notes for each marker
// These highlight what's special about each location at different times of year

interface SeasonalNote {
  icon: string;
  text: string;
  months: string;
}

export const SEASONAL_NOTES: Record<string, SeasonalNote[]> = {
  "cw-01-chipping-campden": [
    { icon: "local_florist", text: "Wisteria blooms on the High Street buildings", months: "May-Jun" },
    { icon: "festival", text: "Robert Dover's Cotswold Olimpick Games", months: "Jun-Jun" },
    { icon: "cruelty_free", text: "Swifts nesting in the Market Hall arches", months: "May-Aug" },
  ],
  "cw-02-broadway-tower": [
    { icon: "visibility", text: "Clearest views on cold, still mornings — up to 16 counties", months: "Oct-Feb" },
    { icon: "cruelty_free", text: "Red kites and buzzards soaring on thermals", months: "Year-round" },
    { icon: "ac_unit", text: "First frost often visible from the tower at dawn", months: "Nov-Jan" },
  ],
  "cw-03-broadway-village": [
    { icon: "local_florist", text: "Lavender fields in bloom near Snowshill", months: "Jun-Aug" },
    { icon: "festival", text: "Broadway Arts Festival", months: "Jun-Jun" },
  ],
  "cw-04-stanway-house": [
    { icon: "water_drop", text: "The gravity fountain operates on set days — 300ft jet", months: "Jun-Sep" },
    { icon: "local_florist", text: "Bluebells carpet the woodland approach", months: "Apr-May" },
  ],
  "cw-05-winchcombe": [
    { icon: "cruelty_free", text: "Peregrine falcons nesting at Sudeley Castle", months: "Apr-Jul" },
    { icon: "local_florist", text: "Sudeley Castle gardens in full bloom", months: "Jun-Aug" },
    { icon: "festival", text: "Winchcombe Walking Festival", months: "May-May" },
  ],
  "cw-06-cleeve-hill": [
    { icon: "local_florist", text: "Wild orchids including pyramidal and bee orchids", months: "May-Jul" },
    { icon: "cruelty_free", text: "Skylarks singing above the common", months: "Mar-Jul" },
    { icon: "grass", text: "Rare limestone grassland wildflowers at peak", months: "Jun-Jul" },
  ],
  "cw-07-leckhampton": [
    { icon: "cruelty_free", text: "Peregrine falcons on the quarry face", months: "Mar-Jul" },
    { icon: "local_florist", text: "Wild thyme and rockrose on the escarpment", months: "Jun-Aug" },
  ],
  "cw-08-painswick": [
    { icon: "local_florist", text: "The 99 yew trees are clipped annually in August", months: "Aug-Sep" },
    { icon: "cruelty_free", text: "Greater horseshoe bats in the surrounding valleys", months: "May-Sep" },
    { icon: "festival", text: "Painswick Rococo Garden snowdrop season", months: "Jan-Mar" },
  ],
  "cw-09-standish-wood": [
    { icon: "local_florist", text: "Bluebell carpet through the ancient beechwood", months: "Apr-May" },
    { icon: "cruelty_free", text: "Dormice in the hazel understory (listen for rustling)", months: "May-Oct" },
    { icon: "forest", text: "Autumn colour peaks in the beech canopy", months: "Oct-Nov" },
  ],
  "cw-10-coaley-peak": [
    { icon: "visibility", text: "Sunset views across the Severn to the Welsh hills", months: "Year-round" },
    { icon: "cruelty_free", text: "Migrating birds visible from the escarpment edge", months: "Sep-Oct" },
  ],
  "cw-11-dursley": [
    { icon: "cruelty_free", text: "Gloucester Old Spots pigs in surrounding farms", months: "Year-round" },
    { icon: "local_florist", text: "Wild garlic in Stinchcombe Hill woods", months: "Apr-May" },
  ],
  "cw-12-wotton": [
    { icon: "local_florist", text: "Ancient woodland flowers along the Wotton ridge", months: "Apr-Jun" },
    { icon: "cruelty_free", text: "Roe deer in the beechwoods at dawn", months: "Year-round" },
  ],
  "cw-13-old-sodbury": [
    { icon: "grass", text: "Wildflowers on the Iron Age hillfort ramparts", months: "May-Jul" },
    { icon: "visibility", text: "Clear days reveal the Mendip Hills to the south", months: "Year-round" },
  ],
  "cw-14-cold-ashton": [
    { icon: "cruelty_free", text: "Barn owls hunting at dusk along the ridge fields", months: "Year-round" },
    { icon: "local_florist", text: "Cowslips on the limestone grassland", months: "Apr-May" },
  ],
  "cw-15-bath": [
    { icon: "festival", text: "Bath Christmas Market fills the Abbey square", months: "Nov-Dec" },
    { icon: "local_florist", text: "Prior Park gardens — designed by Capability Brown", months: "Apr-Oct" },
    { icon: "water_drop", text: "Natural hot springs at 46°C — even warmer in winter", months: "Year-round" },
  ],
};
