// Thanksgiving trivia — fun but a little challenging for 20–40 year olds
module.exports = {
  jeopardy: {
    name: "Thanksgiving!",
    values: [200, 400, 600, 800, 1000],
    dailyDoubles: 1,
    categories: [
      {
        title: "THE BIG MEAL",
        clues: [
          { clue: "This traditional side is made from mashed potatoes, butter, and often topped with marshmallows in the U.S.", answer: "Sweet potato casserole" },
          { clue: "Green bean casserole was invented by this company in the 1950s.", answer: "Campbell’s" },
          { clue: "The official name of the orange root vegetable often pureed into a pie filling is this.", answer: "Pumpkin" },
          { clue: "This herb is the classic pairing with sage in a traditional stuffing or dressing.", answer: "Thyme" },
          { clue: "A proper gravy starts with drippings and this flour-based thickener.", answer: "A roux" }
        ]
      },
      {
        title: "HISTORY & MYTH",
        clues: [
          { clue: "The first Thanksgiving is traditionally dated to this year in Plymouth.", answer: "1621" },
          { clue: "This Native American is often credited with teaching the Pilgrims how to grow corn.", answer: "Squanto (Tisquantum)" },
          { clue: "Thanksgiving became a national holiday under this U.S. president in 1863.", answer: "Abraham Lincoln" },
          { clue: "Sarah Josepha Hale campaigned for decades to make Thanksgiving this.", answer: "A national holiday" },
          { clue: "The Macy’s Thanksgiving Day Parade debuted in this decade.", answer: "The 1920s" }
        ]
      },
      {
        title: "FAMILY CHAOS",
        clues: [
          { clue: "The day after Thanksgiving is infamous for this shopping event.", answer: "Black Friday" },
          { clue: "This relative is statistically most likely to start a political argument at dinner.", answer: "Uncle (or aunt)" },
          { clue: "The term for the post-meal nap many people take is named after this food.", answer: "A food coma / turkey coma" },
          { clue: "Leftovers are often turned into this sandwich the next day.", answer: "A turkey sandwich" },
          { clue: "This phrase describes the awkward silence when someone asks about your relationship status.", answer: "The third degree / an interrogation" }
        ]
      },
      {
        title: "MOVIES & TV",
        clues: [
          { clue: "This 1987 movie features a disastrous Thanksgiving dinner with a frozen turkey.", answer: "Planes, Trains and Automobiles" },
          { clue: "In Friends, Monica’s Thanksgiving usually involves this bird being ruined.", answer: "The turkey" },
          { clue: "This animated special features Charlie Brown hosting a Thanksgiving meal.", answer: "A Charlie Brown Thanksgiving" },
          { clue: "The Addams Family celebrates Thanksgiving in this 1991 sequel.", answer: "Addams Family Values" },
          { clue: "This 2023 movie follows a dysfunctional family’s Thanksgiving gathering.", answer: "The Holdovers" }
        ]
      },
      {
        title: "TRAVEL & TRADITIONS",
        clues: [
          { clue: "The busiest travel day of the year in the U.S. is typically this day.", answer: "The Wednesday before Thanksgiving" },
          { clue: "Many people watch this football game on Thanksgiving afternoon.", answer: "The Detroit Lions game (or Dallas Cowboys)" },
          { clue: "Canada celebrates Thanksgiving on this Monday in October.", answer: "The second Monday" },
          { clue: "This city hosts the famous Thanksgiving Day Parade with giant balloons.", answer: "New York City" },
          { clue: "Some families do a “friendsgiving” instead of the traditional family version.", answer: "Friendsgiving" }
        ]
      },
      {
        title: "RANDOM FACTS",
        clues: [
          { clue: "The average American consumes this many pounds of turkey on Thanksgiving.", answer: "About 13–15 pounds (or ~1 pound per person)" },
          { clue: "This president was the first to pardon a turkey.", answer: "Harry Truman (or George H.W. Bush for the modern version)" },
          { clue: "The tryptophan in turkey is often blamed for this, though the real culprit is overeating.", answer: "Sleepiness" },
          { clue: "A “wishbone” comes from this part of the turkey.", answer: "The collarbone / furcula" },
          { clue: "This is the most popular pie served at Thanksgiving.", answer: "Pumpkin pie" }
        ]
      }
    ]
  },
  double: {
    name: "Double Jeopardy!",
    values: [400, 800, 1200, 1600, 2000],
    dailyDoubles: 2,
    categories: [
      {
        title: "DEEPER HISTORY",
        clues: [
          { clue: "The Pilgrims’ ship was named this.", answer: "The Mayflower" },
          { clue: "This Native American confederation helped the early settlers.", answer: "The Wampanoag" },
          { clue: "The first Thanksgiving feast lasted this many days.", answer: "Three" },
          { clue: "Franklin Roosevelt briefly moved Thanksgiving to this earlier date in the 1930s.", answer: "The third Thursday" },
          { clue: "This 19th-century writer’s novel “The Last of the Mohicans” popularized many Thanksgiving myths.", answer: "James Fenimore Cooper" }
        ]
      },
      {
        title: "FOOD SCIENCE",
        clues: [
          { clue: "Brining a turkey helps it stay this.", answer: "Moist / juicy" },
          { clue: "This temperature is the safe internal temp for a cooked turkey.", answer: "165°F / 74°C" },
          { clue: "Cranberries are native to this continent.", answer: "North America" },
          { clue: "The Maillard reaction is responsible for this on the turkey skin.", answer: "Browning" },
          { clue: "Stuffing cooked inside the bird can be a risk for this type of illness.", answer: "Food poisoning / salmonella" }
        ]
      },
      {
        title: "POP CULTURE",
        clues: [
          { clue: "This SNL sketch features a dysfunctional family at Thanksgiving dinner.", answer: "The “Aunt Linda” sketch / any SNL Thanksgiving bit" },
          { clue: "This 2000 film has a famous “I love you” scene during Thanksgiving chaos.", answer: "Meet the Parents" },
          { clue: "The Friends episode where everyone gets locked out is set on this holiday.", answer: "Thanksgiving" },
          { clue: "This streaming show has a memorable Thanksgiving episode involving a stolen pie.", answer: "The Office / Parks and Rec" },
          { clue: "This celebrity chef has a famous Thanksgiving special every year.", answer: "Ina Garten / Bobby Flay" }
        ]
      },
      {
        title: "CANADA EDITION",
        clues: [
          { clue: "Canadian Thanksgiving is celebrated in this month.", answer: "October" },
          { clue: "This province hosts the biggest Canadian Thanksgiving parade.", answer: "Ontario (or Toronto)" },
          { clue: "Many Canadians eat this bird instead of or in addition to turkey.", answer: "Goose or chicken" },
          { clue: "The first Canadian Thanksgiving was held in this year.", answer: "1578" },
          { clue: "This is the traditional Canadian dessert often served.", answer: "Pumpkin pie (or apple pie)" }
        ]
      },
      {
        title: "FAMILY DYNAMICS",
        clues: [
          { clue: "This relative is most likely to bring a controversial political opinion to dinner.", answer: "The uncle" },
          { clue: "The term for the person who always does the dishes is this.", answer: "The dishwasher / the hero" },
          { clue: "This app is often used to coordinate who’s bringing what dish.", answer: "A group chat / Google Docs" },
          { clue: "The person who shows up late with store-bought food is called this.", answer: "The slacker / the latecomer" },
          { clue: "This is the most common Thanksgiving argument topic besides politics.", answer: "Sports / the Lions" }
        ]
      },
      {
        title: "ODD FACTS",
        clues: [
          { clue: "A full-grown wild turkey can run this fast.", answer: "About 20–25 mph" },
          { clue: "The record for the largest pumpkin is over this many pounds.", answer: "2,000" },
          { clue: "This is the only day of the year when most U.S. grocery stores are closed.", answer: "Thanksgiving (or Christmas)" },
          { clue: "The wishbone tradition comes from this ancient civilization.", answer: "The Etruscans / Romans" },
          { clue: "This is the average number of calories consumed on Thanksgiving.", answer: "About 3,000–4,500" }
        ]
      }
    ]
  },
  final: {
    category: "THANKSGIVING CLASSICS",
    clue: "This 1987 comedy follows two men trying to get home for Thanksgiving and features a famous frozen-turkey scene.",
    answer: "Planes, Trains and Automobiles"
  }
};
