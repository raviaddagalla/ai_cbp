"""
SignBridge ISL Sign Vocabulary
==============================
35 ISL signs supported by the recognition model.
Order matters: index 0 = class 0, index 1 = class 1, etc.
"""

SIGN_LABELS = [
    # Greetings (0-4)
    "Namaste",
    "Hello",
    "Goodbye",
    "Thank You",
    "Sorry",

    # Daily Needs (5-12)
    "Water",
    "Food",
    "Help",
    "Yes",
    "No",
    "Please",
    "More",
    "Stop",

    # Emergency (13-17)
    "Doctor",
    "Police",
    "Hospital",
    "Emergency",
    "Pain",

    # People & Family (18-24)
    "I / Me",
    "You",
    "Mother",
    "Father",
    "Friend",
    "Teacher",
    "Student",

    # Numbers (25-30)
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Ten",

    # Common Phrases (31-34)
    "Come",
    "Go",
    "Good",
    "Bad",
]

# Maps sign label → category for dictionary display
SIGN_CATEGORIES = {
    "Namaste":    "greetings",
    "Hello":      "greetings",
    "Goodbye":    "greetings",
    "Thank You":  "greetings",
    "Sorry":      "greetings",
    "Water":      "daily",
    "Food":       "daily",
    "Help":       "emergency",
    "Yes":        "daily",
    "No":         "daily",
    "Please":     "daily",
    "More":       "daily",
    "Stop":       "daily",
    "Doctor":     "emergency",
    "Police":     "emergency",
    "Hospital":   "emergency",
    "Emergency":  "emergency",
    "Pain":       "emergency",
    "I / Me":     "family",
    "You":        "family",
    "Mother":     "family",
    "Father":     "family",
    "Friend":     "family",
    "Teacher":    "family",
    "Student":    "family",
    "One":        "numbers",
    "Two":        "numbers",
    "Three":      "numbers",
    "Four":       "numbers",
    "Five":       "numbers",
    "Ten":        "numbers",
    "Come":       "daily",
    "Go":         "daily",
    "Good":       "daily",
    "Bad":        "daily",
}

SIGN_DESCRIPTIONS = {
    "Namaste":    "Press palms flat together in front of the chest with fingers pointing upward; slight respectful head nod.",
    "Hello":      "Open palm raised to the side of the head in a relaxed wave motion.",
    "Goodbye":    "Open palm facing forward, fingers together, then wave side to side slowly.",
    "Thank You":  "Flat open hand touches the chin or lips gently and moves outwards toward the conversation partner.",
    "Sorry":      "Closed fist rubbed in circular motion over the chest (heart region).",
    "Water":      "Make a loose cup shape with the dominant hand and tap fingertips twice gently near the side of the lips.",
    "Food":       "All fingertips gathered into a pinched shape and brought repeatedly towards the open mouth.",
    "Help":       "Closed dominant fist with thumb upright rests on the flat palm of the non-dominant hand; both move upward together.",
    "Yes":        "Hand forms a fist and nods downward repeatedly, mimicking a head nod.",
    "No":         "Index and middle fingers extended, side by side, and swept horizontally from side to side.",
    "Please":     "Flat hand placed on chest and moved in a small circular motion.",
    "More":       "Fingertips of both hands touch and pull apart repeatedly.",
    "Stop":       "One flat hand strikes down onto the upward-facing palm of the other hand.",
    "Doctor":     "Index and middle fingers of dominant hand tap the inner wrist pulse point twice.",
    "Police":     "Badge shape traced with index finger on upper chest/shoulder area.",
    "Hospital":   "Fingertips trace a cross (+) shape on the upper arm, like a medical symbol.",
    "Emergency":  "Both hands raised palms outward, shaking rapidly to indicate distress.",
    "Pain":       "Both index fingers point toward each other and move toward each other repeatedly near the painful area.",
    "I / Me":     "Index finger points to self (chest).",
    "You":        "Index finger extended and pointed directly toward the conversation partner.",
    "Mother":     "Thumb of open hand touches the chin, fingers spread.",
    "Father":     "Thumb of open hand touches the forehead, fingers spread.",
    "Friend":     "Index fingers linked and unlinked alternately at chest level.",
    "Teacher":    "Flat hands face each other near the temples, fingers together, then move outward.",
    "Student":    "One hand holds an imaginary book while the other skims across it.",
    "One":        "Index finger raised, all others closed.",
    "Two":        "Index and middle fingers raised in a V-shape.",
    "Three":      "Thumb, index, and middle fingers raised.",
    "Four":       "Four fingers raised, thumb folded.",
    "Five":       "All five fingers spread open, palm facing forward.",
    "Ten":        "Thumb raised and hand shaken slightly (or both fists displayed).",
    "Come":       "Index finger curls inward in a beckoning motion.",
    "Go":         "Index finger points outward and arm extends in a direction.",
    "Good":       "Flat hand touches the lips and moves forward and downward.",
    "Bad":        "Flat hand touches the lips then flicks downward and forward sharply.",
}

