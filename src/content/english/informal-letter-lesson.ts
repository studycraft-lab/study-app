export type ChoiceQuestion = {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type LetterCase = {
  id: string;
  title: string;
  family: string;
  prompt: string;
  date: string;
  decode: [ChoiceQuestion, ChoiceQuestion, ChoiceQuestion];
  intro: ChoiceQuestion;
  body1: {
    prompt: string;
    cards: { id: string; text: string; correct: boolean }[];
    explanation: string;
  };
  body2: ChoiceQuestion;
  conclusion: ChoiceQuestion;
  review: ChoiceQuestion & { excerpt: string };
  model: { intro: string; body1: string; body2: string; conclusion: string };
};

export const LETTER_CASES: LetterCase[] = [
  {
    id: "school-award",
    title: "A prize at Sports Day",
    family: "Share news",
    prompt: "Write a letter to your grandmother about a prize you won at your school's Sports Day. Describe the race and explain why the prize was special to you.",
    date: "12th September, 2026.",
    decode: [
      { prompt: "Who will read this letter?", options: ["Grandmother", "Aunt", "A school teacher"], correct: 0, explanation: "The question names your grandmother." },
      { prompt: "Why are you writing?", options: ["To ask for a gift", "To share news of a prize", "To invite someone to Sports Day"], correct: 1, explanation: "The letter is about a prize you won." },
      { prompt: "What must the body cover?", options: ["The final score and the race timetable", "The race and why the prize mattered", "The school address and the assembly time"], correct: 1, explanation: "Both parts of the question matter: describe the race and explain its meaning." },
    ],
    intro: {
      prompt: "Which pair of ideas belongs in Connect? Choose a plan, not a ready-made sentence.",
      options: [
        "Ask after Grandmother; share the Sports Day prize news",
        "Ask after Grandmother; describe the school holidays",
        "Ask after Grandmother; request a new pair of shoes",
      ],
      correct: 0,
      explanation: "Connect starts warmly and quickly tells Grandmother why you are writing.",
    },
    body1: {
      prompt: "Choose the two details that help Grandmother picture what happened at Sports Day.",
      cards: [
        { id: "lunch", text: "We ate sandwiches after the event.", correct: false },
        { id: "race", text: "I ran the 100-metre race and crossed the finish line first.", correct: true },
        { id: "feeling", text: "I felt proud because my practice had paid off.", correct: false },
        { id: "award", text: "The principal announced my name and handed me a trophy at assembly.", correct: true },
      ],
      explanation: "Body 1 tells the event. The feeling belongs in Body 2, where you explain why it mattered.",
    },
    body2: {
      prompt: "Which ideas should Deepen the letter by explaining why the prize was special?",
      options: [
        "Trophy colour; its size; where it is kept at home",
        "Morning practice; a nervous moment; why winning mattered",
        "Sports Day schedule; number of races; assembly time",
      ],
      correct: 1,
      explanation: "These ideas add a particular moment, a feeling, and the reason the award meant something.",
    },
    conclusion: {
      prompt: "Which ending speaks to Grandmother and gives a natural next step?",
      options: [
        "I wish you could have watched the race. I will show you the trophy when we meet next week.",
        "I hope your garden is doing well. Please tell me whether the roses have bloomed when you write back next week.",
        "The school office has recorded every result. I can ask the teacher to send you the full programme next week.",
      ],
      correct: 0,
      explanation: "The ending returns to Grandmother and looks ahead to seeing her.",
    },
    review: {
      excerpt: "I won a trophy at Sports Day. I felt proud because I had practised every morning. I will show it to you when we meet.",
      prompt: "What is missing from this short letter?",
      options: ["A description of the race", "A feeling about the prize", "A future plan with Grandmother"],
      correct: 0,
      explanation: "We know the result and the feeling, but not what happened during the race. The reader needs one clear event detail here.",
    },
    model: {
      intro: "I hope you and Grandfather are well. I am fine here. I have exciting news from our school Sports Day to share with you.",
      body1: "Last Friday, I took part in the 100-metre race. I was nervous when we lined up, but I ran as fast as I could after the whistle blew and crossed the finish line first. At assembly the next morning, the principal called my name and handed me a trophy in front of the school.",
      body2: "The prize was special because I had practised in the park every morning, even when I wanted to stay in bed. For a moment, I could hardly believe that all that work had helped me win. I felt proud standing on the stage and could not wait to tell you.",
      conclusion: "I wish you could have watched the race. I will show you the trophy when we meet next week.",
    },
  },
  {
    id: "birthday-gift",
    title: "A birthday gift",
    family: "Thank someone",
    prompt: "Write a letter to your friend Ananya thanking her for the sketchbook she gave you for your birthday. Say how you will use it and why you appreciate it.",
    date: "3rd October, 2026.",
    decode: [
      { prompt: "Who will read this letter?", options: ["Grandmother", "Ananya", "Your art teacher"], correct: 1, explanation: "The friend named in the question is Ananya." },
      { prompt: "Why are you writing?", options: ["To thank Ananya", "To request another gift", "To describe Sports Day"], correct: 0, explanation: "Your main purpose is to thank her." },
      { prompt: "What must the body cover?", options: ["The gift's price and the shop where it came from", "How you will use it and why you appreciate it", "The birthday party and the other gifts you received"], correct: 1, explanation: "The question gives two points: use and appreciation." },
    ],
    intro: {
      prompt: "Which pair of ideas belongs in Connect? Choose a plan, not a ready-made sentence.",
      options: [
        "Ask after Ananya; describe the birthday cake",
        "Ask after Ananya; thank her for the sketchbook",
        "Ask after Ananya; request another art present",
      ],
      correct: 1,
      explanation: "Begin with a warm enquiry, then thank her without delaying the purpose.",
    },
    body1: {
      prompt: "Choose the two details that show how the gift will be used.",
      cards: [
        { id: "class", text: "I will take the sketchbook to art class every Monday.", correct: true },
        { id: "thoughtful", text: "You remembered that drawing is my favourite hobby.", correct: false },
        { id: "party", text: "The birthday cake had pink icing.", correct: false },
        { id: "first", text: "My first drawing will be the mango tree outside our balcony.", correct: true },
      ],
      explanation: "The two selected details describe a plan for using the gift. Ananya's thoughtfulness belongs in Body 2.",
    },
    body2: {
      prompt: "Which ideas should Deepen the letter by explaining your appreciation?",
      options: [
        "Cover colour; number of pages; place on the desk",
        "Other presents; party games; favourite slice of cake",
        "Thoughtful choice; love of drawing; lasting usefulness",
      ],
      correct: 2,
      explanation: "These ideas tell Ananya why her choice was thoughtful and connect the gift to the writer's interests.",
    },
    conclusion: {
      prompt: "Choose a friendly ending that follows from this letter.",
      options: [
        "The sketchbook is now on my shelf. The blue cover looks lovely beside my other books.",
        "I will send you my first drawing this weekend. Thank you again for thinking of me.",
        "I must ask our art teacher about paints. The art room opens again on Monday morning.",
      ],
      correct: 1,
      explanation: "It continues the friendship and closes with thanks.",
    },
    review: {
      excerpt: "Thank you for the sketchbook. It has a blue cover and thick pages. It will look lovely on my shelf. I hope to see you soon.",
      prompt: "Which part of the question has this letter failed to answer?",
      options: ["Who gave the gift", "How the gift will be used", "What colour the cover is"],
      correct: 1,
      explanation: "Describing the cover is not the same as saying what the writer plans to do with the gift.",
    },
    model: {
      intro: "I hope you are doing well. I am fine here. Your parcel made my birthday even happier. Thank you for the beautiful sketchbook you sent me.",
      body1: "I plan to take it to art class every Monday, where we are learning to paint with watercolours. Its thick pages will be perfect for trying them. My first drawing will be the mango tree outside our balcony, and I hope to sketch places we visit during the holidays too.",
      body2: "I appreciate the gift because you remembered how much I enjoy drawing. You chose something I can use again and again, rather than something I would put away after a day. I felt touched when I opened the parcel and saw it inside.",
      conclusion: "I will send you a photograph of my first drawing this weekend. Thank you once again for thinking of me.",
    },
  },
  {
    id: "weekend-invitation",
    title: "A weekend together",
    family: "Invite or arrange",
    prompt: "Write a letter to your friend Kabir inviting him to spend the weekend with you. Tell him what you could enjoy together and give the arrangements for his visit.",
    date: "3rd October, 2026.",
    decode: [
      { prompt: "Who will read this letter?", options: ["Kabir", "A cousin", "Grandmother"], correct: 0, explanation: "The invitation is for Kabir." },
      { prompt: "Why are you writing?", options: ["To report a match", "To invite Kabir for the weekend", "To thank Kabir for a present"], correct: 1, explanation: "The letter is an invitation." },
      { prompt: "What must the body cover?", options: ["Enjoyable plans and visit arrangements", "Bus times and the route to your home", "Your address and your parents' work hours"], correct: 0, explanation: "Give him a reason to look forward to the visit, then tell him how it can happen." },
    ],
    intro: {
      prompt: "Which pair of ideas belongs in Connect? Choose a plan, not a ready-made sentence.",
      options: [
        "Ask after Kabir; describe recent schoolwork",
        "Ask after Kabir; announce his visit as fixed",
        "Ask after Kabir; invite him for the weekend",
      ],
      correct: 2,
      explanation: "Ask how Kabir is, then invite him. The model letter turns these ideas into sentences.",
    },
    body1: {
      prompt: "Choose the two details that make the invitation appealing before giving logistics.",
      cards: [
        { id: "cycle", text: "We could cycle in the park and finish the puzzle we started together.", correct: true },
        { id: "pickup", text: "Dad can collect you at ten o'clock on Saturday.", correct: false },
        { id: "cake", text: "Mum has offered to help us bake a chocolate cake on Sunday.", correct: true },
        { id: "exam", text: "The school office closes at four each afternoon.", correct: false },
      ],
      explanation: "Lead with the shared experience. Pickup details are useful, but belong after the plan sounds inviting.",
    },
    body2: {
      prompt: "Which ideas should Deepen the invitation with arrangements and a personal reason?",
      options: [
        "A fixed arrival order; no choice for Kabir or his parents",
        "Saturday to Sunday; parental welcome; pickup if needed",
        "Car details; travel route; other people's schedules",
      ],
      correct: 1,
      explanation: "These arrangements come after the appealing plan; the finished paragraph can then explain why the visit matters.",
    },
    conclusion: {
      prompt: "Which ending gives Kabir a natural action to take?",
      options: [
        "I have told the neighbours already, so you should be here by Saturday morning.",
        "I am looking forward to the weekend. We can choose another puzzle at the shop.",
        "Please ask your parents and let me know by Wednesday, so we can plan properly.",
      ],
      correct: 2,
      explanation: "It is friendly and lets Kabir reply after checking with his parents.",
    },
    review: {
      excerpt: "Please come next weekend. Dad can collect you at ten. You can sleep in our guest room. Please reply soon.",
      prompt: "What would make this invitation stronger?",
      options: ["More travel timings and pickup details", "Shared activities and a reason to meet", "A subject line and a formal request"],
      correct: 1,
      explanation: "The reader sees only logistics here. The letter should also make the weekend worth looking forward to.",
    },
    model: {
      intro: "I hope you are doing well. I am fine here. I have missed our long chats since the examinations began. Would you spend the weekend of 10th and 11th October with me?",
      body1: "Our examinations finish on Friday, so we can finally relax. We could cycle in the park and finish the puzzle we left half-done. Mum has also offered to help us bake a chocolate cake on Sunday, and we could spend the afternoon catching up.",
      body2: "Could you come on Saturday morning and stay until Sunday evening? My parents would be delighted to have you, and Dad can pick you up if travelling here is difficult. It would be wonderful to have a whole weekend together after weeks of studying.",
      conclusion: "I still remember how much we laughed the last time you stayed over. Please ask your parents and let me know by Wednesday, so we can plan for your visit.",
    },
  },
  {
    id: "chess-win",
    title: "A friend's victory",
    family: "Congratulate",
    prompt: "Write a letter to your friend Meera congratulating her on winning the inter-school chess championship. Mention her effort and tell her how you felt when you heard the news.",
    date: "3rd October, 2026.",
    decode: [
      { prompt: "Who will read this letter?", options: ["Meera", "Your coach", "Brother"], correct: 0, explanation: "You are writing to your friend Meera." },
      { prompt: "Why are you writing?", options: ["To congratulate Meera", "To invite Meera to school", "To ask Meera for advice"], correct: 0, explanation: "Congratulating Meera is the purpose." },
      { prompt: "What must the body cover?", options: ["Her effort and your reaction", "Your own practice and your next match", "The chess rules and the final score"], correct: 0, explanation: "The question asks for her effort and your response to the news." },
    ],
    intro: {
      prompt: "Which pair of ideas belongs in Connect? Choose a plan, not a ready-made sentence.",
      options: [
        "Ask after Meera; explain the rules of chess to her",
        "Ask after Meera; congratulate her on the championship",
        "Ask after Meera; request help with your own match",
      ],
      correct: 1,
      explanation: "It starts with Meera's achievement and sounds genuinely pleased for her.",
    },
    body1: {
      prompt: "Choose two details about Meera's achievement and effort.",
      cards: [
        { id: "own", text: "I bought new shoes last Saturday.", correct: false },
        { id: "final", text: "You stayed calm through a difficult final game.", correct: true },
        { id: "practice", text: "You practised chess puzzles after school for months.", correct: true },
        { id: "wish", text: "I hope we can celebrate together on Sunday.", correct: false },
      ],
      explanation: "The first body paragraph should focus on Meera's win and the effort behind it.",
    },
    body2: {
      prompt: "Which ideas should Deepen the letter with your personal response?",
      options: [
        "Names of pieces; legal moves; board setup",
        "Your next match; your coach; your chessboard",
        "Pride in Meera; her patience; what you learned",
      ],
      correct: 2,
      explanation: "These ideas answer how the writer felt and why Meera's success matters personally.",
    },
    conclusion: {
      prompt: "Choose a closing that stays focused on Meera.",
      options: [
        "I hope you enjoy celebrating with your family. Let us meet soon so I can congratulate you in person.",
        "I might buy a new chessboard next year. Perhaps you can help me choose one when we meet.",
        "The school office has recorded the result. I will ask the teacher where the trophy is kept.",
      ],
      correct: 0,
      explanation: "It offers a warm wish and a natural way to connect again.",
    },
    review: {
      excerpt: "Congratulations on winning the championship. Chess uses many different pieces. A queen can move across the board. I hope to see you soon.",
      prompt: "What is the biggest weakness?",
      options: ["It does not explain Meera's effort or the writer's reaction", "It fails to list every chess piece", "It should use a formal subject line"],
      correct: 0,
      explanation: "The body gives general chess facts instead of responding to this friend and this achievement.",
    },
    model: {
      intro: "I hope you are doing well. I am fine here. I heard about your victory this morning and could hardly wait to write. Congratulations on winning the inter-school chess championship!",
      body1: "I know how many months you spent solving chess puzzles after school. You even stayed calm during a difficult final game and found a clever move when everyone expected a draw. Winning the championship shows how your steady practice has paid off.",
      body2: "I felt proud when our teacher announced your name at assembly. Your patience has encouraged me to keep working when something feels difficult instead of giving up too quickly. You truly earned this moment, and I hope you take time to enjoy it.",
      conclusion: "Please give my regards to your parents. Let us meet soon so I can congratulate you in person.",
    },
  },
  {
    id: "brother-loss",
    title: "Encourage a brother",
    family: "Support someone",
    prompt: "Your brother feels sad after his cricket team lost the final. He bowled the last over and gave away many runs. Write to encourage him with a specific reason and suggest how you can help.",
    date: "3rd October, 2026.",
    decode: [
      { prompt: "Who will read this letter?", options: ["Your brother", "Your friend", "A school principal"], correct: 0, explanation: "The letter goes to your brother." },
      { prompt: "Why are you writing?", options: ["To report scores", "To encourage him", "To celebrate your own prize"], correct: 1, explanation: "He is sad, so the letter should support him." },
      { prompt: "What must the body cover?", options: ["A reason for encouragement and an offer of help", "The runs in the over and the final score", "A complaint about the batting and the umpire"], correct: 0, explanation: "The question asks for a reason and a way to help." },
    ],
    intro: {
      prompt: "Which pair of ideas belongs in Connect? Choose a plan, not a ready-made sentence.",
      options: [
        "Ask how he is coping; count every run he gave away",
        "Ask how he is coping; order him to forget the match",
        "Ask how he is coping; say you care after the final",
      ],
      correct: 2,
      explanation: "The warm enquiry should recognise his disappointment without dismissing it.",
    },
    body1: {
      prompt: "Choose two details that give a real reason for encouragement after the cricket final.",
      cards: [
        { id: "wickets", text: "You took two important wickets earlier in the match.", correct: true },
        { id: "score", text: "The scoreboard listed every run from the final over.", correct: false },
        { id: "spectator", text: "A spectator wore a blue cap near the boundary.", correct: false },
        { id: "practice", text: "You practised your bowling every evening before the final.", correct: true },
      ],
      explanation: "His wickets and practice give a fair picture of the whole match, not just the difficult last over.",
    },
    body2: {
      prompt: "Which ideas should Deepen the encouragement and offer help?",
      options: [
        "One over does not erase his effort; offer to practise bowling together",
        "Recalculate the final over; compare scores; blame the last batsman",
        "Tell him to forget the loss; insist he bowls again on Sunday",
      ],
      correct: 0,
      explanation: "A hard last over does not erase his effort. Help should be offered when he feels ready.",
    },
    conclusion: {
      prompt: "Choose a kind ending that leaves the decision with him.",
      options: [
        "Take the time you need. When you feel ready, we could practise bowling together.",
        "You must train with me this Sunday. I have already planned every session for us.",
        "The scorecard is still online. You can study every run from the last over.",
      ],
      correct: 0,
      explanation: "It respects how he feels and gives a gentle next step.",
    },
    review: {
      excerpt: "You gave away many runs in the final over. The other team needed twelve runs and reached the target. The scoreboard is online. I hope you are not sad now.",
      prompt: "What should this letter do instead?",
      options: ["Add more scores from the last over", "Recognise his effort and offer meaningful support", "Describe the umpire and other spectators"],
      correct: 1,
      explanation: "A letter to a disappointed brother should focus on him, not turn into a score report.",
    },
    model: {
      intro: "I hope you are taking care of yourself. I know you felt upset after the cricket final, especially because the last over went for many runs. I wanted to write because I care about you and admire how hard you played.",
      body1: "Bowling the last over was a difficult job. Earlier in the match, you took two important wickets that kept your team in the game. I also saw you practise your bowling every evening before the final. One hard over cannot erase those efforts.",
      body2: "The batters played well in the last over, and the result belonged to the whole team. I am proud that you accepted the responsibility of bowling when everyone was nervous. When you feel ready, I would gladly practise with you and help you try a few new deliveries.",
      conclusion: "Please give yourself some time without blaming yourself. I will be home on Sunday, and we can practise together if you would like to.",
    },
  },
  {
    id: "new-school",
    title: "A new city and school",
    family: "New prompt challenge",
    prompt: "You have moved to a new city and joined a new school. Write to your friend Rohan about your experience. Describe the school and explain how you are settling in.",
    date: "3rd October, 2026.",
    decode: [
      { prompt: "Who will read this letter?", options: ["Your friend Rohan", "Your new teacher", "Your uncle"], correct: 0, explanation: "The question asks you to write to Rohan." },
      { prompt: "Why are you writing?", options: ["To share your new-school experience", "To invite him to a match", "To request a certificate"], correct: 0, explanation: "You are telling a friend how the move and new school are going." },
      { prompt: "What must the body cover?", options: ["The city's name and your new bus route", "The school itself and how you are settling in", "The subjects you dislike and the daily timetable"], correct: 1, explanation: "The letter needs both school details and a personal account of settling in." },
    ],
    intro: {
      prompt: "Which pair of ideas belongs in Connect? Choose a plan, not a ready-made sentence.",
      options: [
        "Ask after Rohan; say how life at the new school has been",
        "Ask after Rohan; only request news of the old school",
        "Ask after Rohan; list rooms in the new apartment",
      ],
      correct: 0,
      explanation: "It connects with Rohan and clearly introduces the subject.",
    },
    body1: {
      prompt: "Choose two details that help Rohan imagine the new school.",
      cards: [
        { id: "bag", text: "My old school bag is still blue.", correct: false },
        { id: "feeling", text: "I feel less lonely now that I have made a friend.", correct: false },
        { id: "class", text: "My classroom is bright, and our teacher welcomed me on the first day.", correct: true },
        { id: "library", text: "The library has a reading corner where I go after lunch.", correct: true },
      ],
      explanation: "Body 1 describes the school. The change in how you feel belongs in Body 2.",
    },
    body2: {
      prompt: "Which ideas should Deepen the letter by showing how you are settling in?",
      options: [
        "School facilities; classroom size; daily timetable",
        "Early loneliness; Aditi's help; feeling more at home",
        "City traffic; bus route; new apartment furniture",
      ],
      correct: 1,
      explanation: "These ideas move from a difficulty to a helpful moment and a changed feeling.",
    },
    conclusion: {
      prompt: "Choose a closing that keeps the friendship going.",
      options: [
        "Tell me how everyone at our old school is doing. I hope you will write back soon.",
        "I have described the main buildings. That is all I need to report about the new school.",
        "The library has wooden shelves and is open on Tuesdays. I will visit it again tomorrow.",
      ],
      correct: 0,
      explanation: "It speaks to Rohan and invites a reply.",
    },
    review: {
      excerpt: "I joined a new school. The classrooms are big and the library has many books. My teacher is kind. Write back soon.",
      prompt: "Which requested part still needs an answer?",
      options: ["How the writer is settling in", "What the library contains", "Whether there is a teacher"],
      correct: 0,
      explanation: "The facts describe the school, but the friend does not learn how the move feels or how things are changing.",
    },
    model: {
      intro: "I hope you are doing well. I am fine here. I miss our chats after school and wanted to tell you how life has been since we moved and I joined my new school.",
      body1: "My new classroom is bright, and our teacher welcomed me on the first day. The school has a large library with a quiet reading corner where I like to spend lunch breaks. We have also started a science project that I think you would enjoy.",
      body2: "At first, I felt lonely because I did not know anyone. Then a classmate named Aditi showed me around and invited me to the art club. I still miss you and our old friends, but I am beginning to feel at home here.",
      conclusion: "Please tell me how everyone at our old school is doing. I hope you will write back soon, and perhaps you can visit during the holidays.",
    },
  },
];
