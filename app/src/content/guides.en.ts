import type { Guide, Source } from './guides';

const USU_PACK: Source = { title: 'USU Extension: Food storage packaging', url: 'https://extension.usu.edu/preserve-the-harvest/food-storage-packaging' };
const MYLAR: Source = { title: 'Survival Freedom: Mylar bags and oxygen absorbers (blog, not an academic source)', url: 'https://survivalfreedom.com/how-to-use-mylar-bags-and-oxygen-absorbers-for-long-term-food-storage' };
const CSU_PRESSURE: Source = { title: 'CSU Extension: Adjusting for elevation when pressure cooking', url: 'https://extension.colostate.edu/resource/adjusting-for-elevation-when-pressure-cooking' };
const CSU_BEANS: Source = { title: 'CSU Extension: Cooking dry beans', url: 'https://extension.colostate.edu/resource/cooking-dry-beans/' };
const CSU_HIGH: Source = { title: 'CSU Extension: High elevation food preparation', url: 'https://extension.colostate.edu/resource/high-elevation-food-preparation/' };
const READY: Source = { title: 'Ready.gov: Build a Kit', url: 'https://www.ready.gov/kit' };
const REDCROSS: Source = { title: 'American Red Cross: Survival Kit Supplies', url: 'https://redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html' };
const MDN: Source = { title: 'MDN: Storage quotas and eviction criteria', url: 'https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria' };

export const GUIDES_EN: Guide[] = [
  {
    id: 'reembalar',
    title: 'Repack rice, beans and pasta',
    summary: 'From the big Costco bag to Mylar with an absorber, inside the bucket.',
    intro: [
      'Store paper bags and thin plastic bags let moisture and oxygen through and do not stop insects or rodents. Mylar has an aluminum layer that greatly reduces the passage of oxygen and moisture, and the bucket protects the bag from punctures and rodents. Open the big bag, divide it into Mylar bags and seal each one with an oxygen absorber.',
      'Materials: food-grade 5-gallon plastic buckets with lids; Mylar bags of 1.5 to 2 gallons (each bucket’s card, under Stock, says how many); 700 cc oxygen absorbers for the grain bags; a clothes iron, hair straightener or sealer; a glass jar with a lid for the leftover absorbers; a permanent marker.',
    ],
    steps: [
      {
        title: 'Check that the food is dry',
        text: 'Only store dry food, under 10% moisture. White rice, beans and boxed pasta are usually within that. Moist food must not be sealed in Mylar with an absorber.',
      },
      {
        title: 'Freeze to kill insects (recommended)',
        text: 'USU Extension suggests putting rice in the freezer for 3 days to kill insects or larvae. Do the same with beans and pasta. Then let it come back to room temperature before packing, so no moisture forms inside the bag. If the bag is still closed, leave it closed while it warms up.',
      },
      {
        title: 'Prepare everything before opening the absorbers',
        text: 'Leave all the Mylar bags open, standing inside the buckets, and the food already measured. The absorber starts working as soon as the pack is opened, and outside the pack it lasts only 10 to 15 minutes.',
      },
      {
        title: 'Fill the bags',
        text: 'Pour in the food and leave about 5 cm (2 in) free at the top so you can seal it. Tap the bag lightly to settle the contents.',
      },
      {
        title: 'Add the absorber and seal right away',
        text: 'Open the absorber pack, drop one 700 cc absorber into each grain bag and close the glass jar with the leftovers, preferably with the pink indicator card inside. Seal the mouth of the bag with an iron or straightener (the source uses a straightener at about 220 °C / 430 °F), leaving a small opening, press out the air and seal the rest. Run the seal twice.',
      },
      {
        title: 'Check the seal',
        text: 'The bag does not always look vacuum-packed, and that is normal. What matters is that the seal is complete, with no folds or gaps. If in doubt, open it, replace the absorber and seal again.',
      },
      {
        title: 'Label and store',
        text: 'Write the contents, the date and the absorber size. Put the bags in the bucket, close the lid and store in a dry, cool place, off the floor. Then tap Seal on the bucket, under Stock, with today’s date. That date decides when the bucket enters rotation.',
      },
    ],
    notes: [
      'Pasta: the tips can puncture the bag. Use thick bags and place the pasta carefully. This is an app precaution, not from the sources.',
      'Bucket 7 (sugar, salt, powdered milk, coffee): sugar and salt do not get an absorber, because they can cake. Use an absorber with the powdered milk and the coffee. Pack each item in a separate bag.',
      'Brown rice has too much oil for this method. The plan uses white rice.',
      'Absorber size: the source cites 300 to 500 cc for a 1-gallon bag. The app uses 700 cc for 2-gallon bags (13×17 in), which is what the absorber seller recommends for that size.',
    ],
    sources: [USU_PACK, MYLAR],
  },
  {
    id: 'rotacao',
    title: 'Rotation: eat, replace, reseal',
    summary: 'Why to rotate the buckets and how to do one at a time.',
    intro: [
      'Stored food has to be used before it spoils, and the only way to know the reserve is good is to eat it from time to time. KeepReady’s rotation opens one bucket at a time, uses the contents in normal meals, buys the replacement and reseals with a new bag and absorber. That way each replacement costs little and the food you buy is food you were going to eat anyway.',
    ],
    steps: [
      { title: 'Every bucket has a date', text: 'When you seal, the app calculates the date of the first rotation. In the first cycle the dates are spread out (with N buckets, bucket 1 comes due at 1/N of the interval, bucket 2 at 2/N, and so on), so the buckets do not all come due together. After that, each bucket returns every interval, counted from the date it was resealed.' },
      { title: 'Start rotation', text: 'On the Rotation screen, tap Start. The app only lets you open one bucket at a time and puts the replacement on the Shopping list, in the Replacement section.' },
      { title: 'Consume within 30 days', text: 'Use the contents in normal meals. While it is open, the bucket does not count as stock on the dashboard.' },
      { title: 'Replace and finish', text: 'Buy the replacement, repack (see the repacking guide) and tap Finish. The seal date and the deadline start over.' },
    ],
    notes: [
      'The default 24-month interval is a conservative app choice. Well-sealed rice and beans last much longer, according to the repository’s sources, and you can lengthen the interval under Rotation. Very old beans tend to harden and take longer to cook, and that matters more at altitude.',
      'If two buckets end up with dates very close together, the app warns you. Reseal one at a time or lengthen the interval.',
    ],
    estimates: ['The 24-month interval and the 30-day window to consume are app choices, not values from a standard.'],
    sources: [USU_PACK, CSU_BEANS],
  },
  {
    id: 'altitude',
    title: 'Water and gas at altitude',
    summary: 'Where the water, cooking time and cylinder numbers come from.',
    intro: [
      'In Thornton (about 5,300 ft, 1,600 m) water boils at a lower temperature, so rice, beans and pasta take longer and more water, and the gas lasts less. The app calculates this from the altitude you enter in Settings.',
    ],
    steps: [
      { title: 'Pressure cooker', text: 'CSU Extension says to increase cooking time by 5% for every 1,000 ft above 2,000 ft. The app uses that value, and it is the firmest in the whole model.' },
      { title: 'Open pot', text: 'For cooking without pressure the app estimates a 25% increase in time for every 3,000 ft above 2,000 and 15% more cooking water, on the same basis. Those two values are app estimates, calibrated by the CSU text saying that cooking at altitude takes more time and more liquid.' },
      { title: 'Starting times', text: 'For the plan of 4 people and 8,000 kcal per day, the app starts from 37.5 min for rice, 18 min for pasta, 12 min for oats, 15 min for hot water and 60 min for beans with pressure (135 min without pressure), and multiplies by the altitude factor.' },
      { title: 'Gas', text: 'A 10,000 BTU per hour burner, propane at 21,500 BTU per pound and a 20 lb cylinder, which gives 430,000 BTU. The app adds a 20% buffer. Typical result: 3 cylinders with a pressure cooker and 4 without.' },
      { title: 'Water', text: 'Drinking: 3 liters per person per day (app default, less than the gallon per person that Ready.gov and the Red Cross cite, which also covers hygiene; clean water for hygiene is counted separately under Water). Cooking: 1.86 liters per 2,000 kcal person per day, at sea level, only on the part of the food that is dry (74% for goals above 14 days, 10% for short ones, app estimates). The altitude factor increases the cooking part.' },
    ],
    estimates: [
      'App estimates: the open-pot factors, the cooking water and the 20% gas buffer.',
      'The starting cooking times are reference averages for this plan, not from a single recipe.',
    ],
    notes: ['Test on your own stove. Cook a "test" bucket at home, note the real time and the amount of gas used, and adjust the altitude or the cooking mode in Settings if needed.'],
    sources: [CSU_PRESSURE, CSU_HIGH, CSU_BEANS],
  },
  {
    id: 'plano',
    title: 'How the plan calculates quantities',
    summary: 'People, days and profile become food, buckets, water, gas and 27-gallon totes. What is sourced and what is an estimate.',
    intro: [
      'You enter how many people, how many days of self-reliance and each person’s profile (age, sex, activity, ongoing medication, glasses). The app adds up the household calories and calculates the rest from that. Everything is recalculated the moment you change a number.',
    ],
    steps: [
      {
        title: 'Food',
        text: 'Household calories per day × days × (1 + buffer). The default buffer is 10%. For goals above 14 days, the food is split as in the sample plan: about 62% in grain buckets, 12% in the mixed bucket (sugar, milk, salt, coffee) and the rest in the ready-to-eat pantry, with at least 10% in the pantry. The number of grain buckets always rounds up to the next whole number and the pantry absorbs the difference, so the plan never covers less than the goal. For goals of up to 14 days, the app uses only store-bought ready-to-eat food, with no Mylar buckets: Mylar is for storing food for years, and store-bought food lasts long enough for a short goal. You can choose "Always" under Plan options.',
      },
      {
        title: 'Water and gas',
        text: 'Water: drinking (app default: 3 liters per person per day; Ready.gov and the Red Cross cite 1 gallon, which includes hygiene) plus the cooking water for the dry food. Gas: minutes of flame per day, corrected for altitude and cooking mode, with a 20% buffer. See the altitude guide.',
      },
      {
        title: '27-gallon totes',
        text: 'The totes hold what is non-perishable, needs no sealing and is used often. The item list comes from Ready.gov and the Red Cross, plus the trauma kit and the radio from the KeepReady repository. The app multiplies each item by people and days (or 1 per household), sorts by category and fills one tote at a time up to 80% of the 27-gallon volume (about 102 L) or the maximum weight (20 kg by default). Large items, such as blankets, fire extinguisher, pressure cooker and stove, stay out of the tote count.',
      },
      {
        title: 'Each person’s profile',
        text: 'Women aged 12 to 51 count toward pads. Children up to 3 count toward diapers. Anyone on ongoing medication counts toward the medication supply, and anyone who wears glasses or contacts, toward spare glasses. With no age or sex given, those items do not appear.',
      },
    ],
    notes: [
      'Public sources list the items, but almost never the amount per person per day. The Red Cross gives numbers for water (1 gallon per person per day), food (3 days to evacuate, 2 weeks at home) and 7 days of medication. Ready.gov says 1 gallon per person per day and "several days" of food. For the other items, the amount is an app estimate and is marked as such on each item. Adjust to your consumption: mark "Have" and turn off what does not apply.',
      'Medication: the app only counts days of supply. It does not calculate doses. Follow the label and your doctor. The trauma kit is only useful with training.',
      'Babies under 1 year: formula and baby food are not in the calculation. The calorie table also does not apply to children under 2. Talk to the pediatrician.',
      'The pantry is scaled in proportion to the sample plan. If you changed its items, the proportion between them is kept. Variety and micronutrients are not calculated: the plan aims at calories.',
      'Applying the plan does not touch sealed or rotating buckets, what you already have in the pantry, what you marked as bought or the items you added.',
    ],
    estimates: [
      'Toilet paper: 0.4 roll per person per day.',
      'Wet wipes, soap, toothpaste, hand sanitizer, trash bags, paper towels, dish soap, sponge: per person-day rates set by the app.',
      'AA batteries: 0.3 per person per day.',
      'Flashlights (1 per person), power banks (1 per 2 people), N95 masks (2 per person).',
      'Pads: 20 every 28 days. Diapers: 8, 6 and 5 per day up to 1, 2 and 3 years.',
      'Volume and weight of each item (to estimate how many totes), 80% fill of the tote and the 20 kg limit.',
      'Split of the food between buckets and pantry, the 10% minimum in the pantry and the 14-day limit for a short goal.',
    ],
    sources: [READY, REDCROSS],
  },
  {
    id: 'calorias',
    title: 'Where the calories come from',
    summary: 'Recommendation by age, sex and activity, and the emergency reference.',
    intro: [
      'The Family screen shows, for each person, the estimated calories per day to maintain weight, by age, sex and activity level. The table comes from Appendix 6 of the 2010 Dietary Guidelines for Americans (Institute of Medicine equations), rounded to 200 kcal. The adult ranges in the 2020–2025 editions are consistent with it.',
      'The emergency reference is 2,100 kcal per person per day, used in humanitarian aid (Sphere standard). You decide which number counts: it appears as "Goal used in the calculations" and is what the dashboard uses to calculate the days of food.',
    ],
    notes: [
      'The table does not apply to pregnant or nursing women and children under 2. For those people, set the goal manually, preferably with the doctor or pediatrician.',
      'If you leave the goal blank, the app uses the recommendation. If there is no recommendation either (age or sex missing), the person counts as 0 kcal in the calculations.',
    ],
    sources: [],
  },
  {
    id: 'offline',
    title: 'Install and use without internet',
    summary: 'How to install on your phone and what to do so you do not lose data.',
    steps: [
      { title: 'Open it once with internet', text: 'The app downloads what it needs to work. After that it opens without internet.' },
      { title: 'Install on the home screen', text: 'On iPhone: Safari, Share button, Add to Home Screen. On Android: Chrome, menu, Install app or Add to home screen.' },
      { title: 'Join a household to sync', text: 'Under Family, create an account and a household. Whoever gets the invite code sees and edits the same data. Edits made offline go up when the connection returns. If two people edit the same item, the last one to sync wins.' },
      { title: 'Make a backup', text: 'Under Settings, export the backup as a file and keep it off your phone. Also under Settings, the Print button makes a paper sheet in case the phone’s battery dies.' },
    ],
    notes: [
      'On iPhone, Safari may erase the data a site stored on the device after 7 days without use. It is not confirmed whether apps installed on the home screen are exempt from that rule. That is why the app asks for persistent storage, but what really protects you is the account with sync and the file backup.',
      'If the device stays offline for a long time, the data stays on the device, but only reaches the other household members when the connection returns.',
    ],
    sources: [MDN],
  },
];
