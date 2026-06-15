/* ============================================================================
 * WORKSHOP SECTION — edit everything about the "Workshop" section here.
 * ----------------------------------------------------------------------------
 * - Change the heading/intro text below (English under `en`, Hebrew under `he`).
 * - Add/remove/reorder capability cards in the `features` arrays.
 * - Swap the photos by replacing the files in this folder (keep the same names)
 *   or by editing the `photos` list. Photos open in the gallery.
 * Hebrew is a first-draft AI translation — refine any time.
 * ========================================================================== */

const WORKSHOP = {
  // Photos shown in the strip (and opened in the lightbox). Any order/count.
  photos: [
    "assets/workshop/01.jpg",
    "assets/workshop/02.jpg",
    "assets/workshop/03.jpg",
    "assets/workshop/04.jpg",
  ],

  en: {
    eyebrow: "The workshop",
    title: "A fully-equipped Haifa workshop.",
    intro:
      "Everything is made in my own workshop in Haifa — from one-off pieces to larger runs for business clients. Machine milling for accuracy, hand tools for the details, and the space and finishing setup to take a project from rough timber to a delivered, installed result.",
    // Capability cards. Add or remove freely.
    features: [
      {
        title: "Machine room",
        description:
          "Panel saw, thicknesser, planer, bandsaw and router table for accurate, repeatable milling of solid timber and sheet goods.",
      },
      {
        title: "Joinery bench",
        description:
          "Traditional hand-cut joinery — mortise and tenon, dovetails and fitted detail work that machines can't match.",
      },
      {
        title: "Finishing area",
        description:
          "A dedicated, dust-controlled space for oiling, lacquering and spray finishing, so every surface is clean and durable.",
      },
      {
        title: "Timber & materials",
        description:
          "Carefully sourced hardwoods and sheet materials, stored and conditioned ready for work.",
      },
      {
        title: "Capacity for business",
        description:
          "Set up to handle commercial runs and fit-outs — multiple matching pieces, delivered to schedule.",
      },
      {
        title: "Delivery & installation",
        description:
          "Pieces are finished, wrapped and installed on site across Haifa and the north.",
      },
    ],
  },

  he: {
    eyebrow: "הנגרייה",
    title: "נגרייה מאובזרת במלואה בחיפה.",
    intro:
      "הכול מיוצר בנגרייה שלי בחיפה — מפריטים חד-פעמיים ועד סדרות גדולות יותר ללקוחות עסקיים. עיבוד במכונות לדיוק, כלי יד לפרטים, וחלל וגימור שמאפשרים לקחת פרויקט מעץ גולמי ועד לתוצאה מותקנת ומוגמרת.",
    features: [
      {
        title: "חדר מכונות",
        description:
          "מסור פאנל, מקצועת עובי, מקצועה, מסור סרט ושולחן פרזה לעיבוד מדויק וחוזר של עץ מלא ולוחות.",
      },
      {
        title: "שולחן נגרות",
        description:
          "חיבורי יד מסורתיים — שן ותותב, זנב יונה ועבודת פרטים מותאמת שמכונה לא יכולה להשיג.",
      },
      {
        title: "אזור גימור",
        description:
          "חלל ייעודי ומבוקר אבק לשימון, לכה וצביעה בהתזה, כך שכל משטח נקי ועמיד.",
      },
      {
        title: "עץ וחומרים",
        description:
          "עצי בוק ועצים קשים שנבחרו בקפידה ולוחות, מאוחסנים ומותאמים ומוכנים לעבודה.",
      },
      {
        title: "יכולת לעסקים",
        description:
          "ערוך לטיפול בסדרות מסחריות ועיצוב פנים — פריטים תואמים מרובים, מסופקים בזמן.",
      },
      {
        title: "משלוח והתקנה",
        description:
          "הפריטים מוגמרים, ארוזים ומותקנים באתר בחיפה ובצפון.",
      },
    ],
  },
};
