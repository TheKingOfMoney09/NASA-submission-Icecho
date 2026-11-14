// The Last Note — every audience-facing word.
// Owner: 03-NARRATIVE. Strings only: no DOM, no fetch, no timers, no logic.
// Assigned onto the existing window.EJ namespace. Never redefines it.

window.EJ.content = {
  acts: [
    {
      id: 0,
      title: "Act 0 — Cold open",
      lines: [
        "In 1979, the Arctic was loud.",
        "Six notes, held together.",
        "Begin with sound on."
      ],
      audioHint: "Six voices, one held chord, no rhythm."
    },
    {
      id: 1,
      title: "Act I — Why",
      lines: [
        "This is the Arctic, one September at a time: 1979 to 2026.",
        "Each year is a chord. The ice decides how many notes are in it.",
        "1979 is full: six voices. 2026 is four. 2012 was three.",
        "Every map carries one line that never moves, the 1981–2010 median edge. In 1979 almost all of the ice sits outside it. By 2026 most of it is pulled inside.",
        "The chord does not fade. It steps down, partly returns, then steps down again. That stagger is what the ice did."
      ],
      audioHint: "A six-voice chord thins to four over the record."
    },
    {
      id: 2,
      title: "Act II — How",
      lines: [
        "Every September from 1979 to 2026 has a map. Each one is cut to the same rectangle, so the only thing that can change is the ice.",
        "Six numbers shape the chord: how much of the sea is white ice, where it sits, and how widely it is spread. Then how broken its edge is, how bright the frame is, and how much ice was lost since the year before.",
        "Six numbers, six audible dimensions. Ice decides how many notes survive; position moves the pitch slowly; spread sets the chord's width. A broken edge adds a brittle noise; brightness opens or closes the sound; yearly loss pulls the top voice out of tune.",
        "Nothing about a year is entered by hand. The same year gives the same chord, every time you play it."
      ],
      audioHint: "The chord rebuilt from six measurements."
    },
    {
      id: 3,
      title: "Act III — The listener",
      lines: [
        "You have never seen a satellite image. You have never seen the ice.",
        "You have heard a chord, though. Six notes, held together. That was 1979.",
        "The top note goes first, then the next. Nothing dramatic happens. That is the point.",
        "Two of the six are gone now. One year, 2013, two came back. The chord has not been six since 2007.",
        "What is left is four notes, a line on a map that never moves, and an edge that has crossed it.",
        "The ice is about two-thirds of what it was in 1979. You just heard something most people only ever saw."
      ],
      audioHint: "The chord thins; the top voices are missing."
    },
    {
      id: 4,
      title: "Act IV — Handover",
      lines: [
        "Now play it yourself. Use the slider, or the arrow keys.",
        "Try 1995, then 2012, then 2026.",
        "2012 is the three-note year."
      ],
      audioHint: "Three years, three chords: 1995, 2012, 2026."
    },
    {
      id: 5,
      title: "Act V — The last note",
      lines: [
        "Four notes are playing. That is the ice in 2026.",
        "What follows is a coda: one voice, left alone, fading. It is not data.",
        "CODA · COMPOSITION, NOT DATA. Maps: NSIDC Sea Ice Index v4 (G02135). Still: NASA SVS 5677."
      ],
      audioHint: "Four notes, then one voice decaying alone."
    }
  ],

  transcript: {
    "0": "The 1979 chord: six sustained voices, close together, with no rhythm and no melody. Nothing else sounds. This is the fullest the instrument gets.",
    "1": "Six voices hold at 1979. As the years run, the highest voice leaves, then another; by 2007 four remain. Two come back in 2013, and from 2015 the chord stays at four. The pitch drifts slowly, and the top voice sags out of tune in the years that lost the most ice.",
    "2": "The chord is built from six measurements. Voice count follows the amount of ice. Pitch follows where the ice sits. The chord widens and narrows with the spread of the ice. A noise layer rises as the edge breaks up. Brightness opens or closes the tone. Yearly loss detunes the top voice.",
    "3": "The chord thins as the years run. The top voices go first. At 2012 there are three; by 2026 there are four. The sound stays calm, with no percussion, no melody, and no rise at the end.",
    "4": "Three chords sound in turn: 1995, 2012, 2026. The 2012 chord has three voices. The 2026 chord has four.",
    "5": "Four voices hold, then stop. One voice continues alone and decays to silence. That last voice is a composed coda, not a measurement: the data ends at four. The screen labels it CODA, COMPOSITION, NOT DATA, and credits NSIDC Sea Ice Index v4 (G02135) and NASA SVS 5677."
  },

  altText: {
    "1979": "A polar map of the Arctic Ocean with white ice spreading beyond the fixed magenta 1981–2010 median edge almost everywhere, over navy water and surrounded by grey land; six of six voices; September minimum 6.90 million square kilometres (NSIDC G02135 v4).",
    "1988": "A polar map of the Arctic Ocean with white ice across most of the basin, the fixed magenta 1981–2010 median edge drawn over the water, and grey land around the coast; six of six voices.",
    "1995": "A polar map of the Arctic Ocean with white ice covering most of the basin, the fixed magenta 1981–2010 median edge drawn over the water, and grey land around the coast; the chord is at or near its full six voices.",
    "2007": "A polar map of the Arctic Ocean with white ice pulled inside the fixed magenta median edge, and open water along the Eurasian coast; four of six voices; September minimum 4.15 million square kilometres (NSIDC G02135 v4).",
    "2012": "A polar map of the Arctic Ocean with white ice far inside the fixed magenta median edge around most of the basin, the smallest white area in the record; three of six voices; September minimum 3.34 million square kilometres (NSIDC G02135 v4).",
    "2016": "A polar map of the Arctic Ocean with white ice inside the fixed magenta median edge across most of the basin, and grey land around the coast; four of six voices.",
    "2020": "A polar map of the Arctic Ocean with white ice well inside the fixed magenta median edge, and open water along the Eurasian coast; four of six voices.",
    "2026": "A polar map of the Arctic Ocean with white ice mostly inside the fixed magenta median edge, about two-thirds of the 1979 area; four of six voices; September minimum 4.57 million square kilometres (NSIDC G02135 v4)."
  },

  narration: [
    { t: 0.00, text: "In 1979, the Arctic was loud. Six notes, held together." },
    { t: 0.10, text: "One September, one chord. From 1979 to 2026, the ice decides how many notes survive." },
    { t: 0.17, text: "The top note goes first. Then another." },
    { t: 0.24, text: "Nothing dramatic happens. That is the point." },
    { t: 0.29, text: "Two of the six are gone. In 2012 there were three." },
    { t: 0.34, text: "Rewind. One map becomes six numbers, and six audible dimensions." },
    { t: 0.39, text: "The amount of white ice decides how many voices you hear." },
    { t: 0.44, text: "Where the ice sits drifts the pitch. How widely it spreads sets the chord's width." },
    { t: 0.49, text: "A ragged edge adds noise. Brightness opens or closes the sound." },
    { t: 0.53, text: "Ice lost since the year before pulls the top voice out of tune." },
    { t: 0.57, text: "You have never seen a satellite image. You have never seen the ice." },
    { t: 0.62, text: "You have heard a chord, though. Six notes, held together." },
    { t: 0.67, text: "Two of the six are gone now. One year, 2013, two came back." },
    { t: 0.72, text: "The chord has not been six since 2007." },
    { t: 0.77, text: "The ice is about two-thirds of what it was." },
    { t: 0.81, text: "You just heard something most people only ever saw." },
    { t: 0.84, text: "Now play it yourself." },
    { t: 0.87, text: "Try 1995, then 2012, then 2026." },
    { t: 0.90, text: "2012 is the three-note year." },
    { t: 0.93, text: "Four notes are playing. That is the ice in 2026." },
    { t: 0.96, text: "What follows is a coda: composition, not data." },
    { t: 0.99, text: "One voice, left alone, fading." }
  ]
};
