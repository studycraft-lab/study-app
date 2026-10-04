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
      intro: "I hope you and Grandfather are keeping well. I am fine here, and I have some exciting news to share. I won a prize at our school Sports Day last Friday!",
      body1: "I took part in the 100-metre race. At the starting line, I could hear my classmates cheering, but I was too nervous to look at them. When the whistle blew, I ran as fast as I could. Another runner was close beside me until the final few steps, so I pushed myself and crossed the finish line first. The next morning, the principal called my name at assembly and handed me a trophy while everyone applauded.",
      body2: "This prize means a great deal to me because I had practised in the park every morning for several weeks. Some days I wanted to stay in bed, and on other days I felt I was not getting faster. I kept trying, and the race showed me what regular practice can do. I felt proud on the stage, but I wished you could have been there. You have always encouraged me to try my best, so you were one of the first people I wanted to tell.",
      conclusion: "I have kept the trophy on my desk. When we meet next week, I will show it to you and tell you about the other Sports Day events too. Please give Grandfather my love.",
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
      intro: "I hope you and your family are doing well. I am fine here. Your parcel arrived on my birthday, and opening it made the day even happier. Thank you for the beautiful sketchbook!",
      body1: "I plan to take it to art class every Monday, where we have just started learning to paint with watercolours. The thick pages will let me try different colours without worrying about the paint soaking through. For my first drawing, I want to sketch the mango tree outside our balcony, with the little birds that visit it each morning. During the holidays, I will carry the sketchbook when we go out and draw the places we see instead of trying to remember them later.",
      body2: "What makes your gift so special is that you remembered how much I enjoy drawing. You even chose a book that will help me practise and keep all my pictures together. I felt touched when I saw it inside the parcel, especially because we had talked about my drawings only once during your last visit. Each time I open it, I will think of your kindness and of the fun we had sketching together that afternoon.",
      conclusion: "I will send you a photograph of the first page as soon as I finish it this weekend. When we meet again, perhaps we can fill a page together. Thank you once more for such a thoughtful gift.",
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
      intro: "I hope you and your family are doing well. I am fine here, though I have missed our long chats since the examinations began. Would you come and spend the weekend of 10th and 11th October with me?",
      body1: "Our examinations finish on Friday, so we will finally have time to relax. On Saturday morning, we could cycle through the park before it gets too warm. I have kept the puzzle we left half-done during your last visit, and I think we can finish it this time. Mum has offered to help us bake a chocolate cake on Sunday. We could decorate it ourselves and spend the afternoon talking about everything that happened during the school term.",
      body2: "It would be lovely if you could arrive on Saturday morning and stay until Sunday evening. My parents would be delighted to have you, and we have made room for you to sleep in my bedroom. If getting here is difficult, Dad can pick you up after breakfast. I know your parents may have plans, so please check with them first. I have been looking forward to a proper weekend together after so many weeks of studying.",
      conclusion: "I still remember how much we laughed the last time you stayed over. Please let me know by Wednesday whether you can come, so we can plan our weekend. I hope your parents say yes!",
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
      intro: "I hope you and your family are well. I am fine here. I heard your wonderful news this morning and could hardly wait to write. Congratulations on winning the inter-school chess championship!",
      body1: "I know how much work went into this victory. For months, you solved chess puzzles after school and went over your games to see where you could improve. I still remember you practising even when a difficult puzzle took you several tries. Our teacher told us that the final game was close and that you stayed calm when everyone expected a draw. You studied the board carefully, found a clever move, and went on to win. What a wonderful reward for all that steady practice!",
      body2: "When our teacher announced your name at assembly, I clapped so loudly that the children beside me laughed. I felt proud because I know the effort behind that trophy, and I was happy that everyone else could see it too. Your patience has encouraged me to keep working when I find something difficult instead of giving up after my first attempt. I hope you take some time to enjoy your success with your family before you begin preparing for another competition.",
      conclusion: "Please give my regards to your parents and tell them how pleased I am for you. Let us meet soon; I want to hear about the final game from you and congratulate you in person.",
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
      intro: "I hope you are taking care of yourself. I know how disappointed you felt after the cricket final, especially because the last over went for many runs. I wanted to write because I know how much the match meant to you.",
      body1: "Bowling the last over, with everyone watching, was a difficult job. I know you wish you could bowl it again, and it is all right to feel upset. Please also remember the rest of your match. You took two important wickets earlier, including one when the other team was gaining confidence. I saw you practise every evening before the final, working on your aim even after a tiring day at school. One hard over cannot erase that effort or the good balls you bowled.",
      body2: "The batters played well at the end, and a cricket match depends on the whole team. I was proud that you accepted the responsibility of bowling when everyone was nervous. Once you feel ready, we can talk about what happened and practise together in the park. I can stand at the crease while you try different deliveries, and we can ask Coach for advice too. A difficult match can help you learn, but it does not decide what kind of bowler you are.",
      conclusion: "Please be kind to yourself and rest after the tournament. I will be home on Sunday. We can go to the park then, or simply spend some time together if you prefer.",
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
      intro: "I hope you and your family are doing well. I am fine here, though I miss our chats after school. I wanted to tell you how life has been since we moved and I joined my new school.",
      body1: "The streets near our new home are busy, and I am still learning my way around. At school, my bright classroom looks out over a small garden. Our teacher welcomed me on the first day and helped me find my place. There is also a large library with a quiet reading corner where I like to spend part of my lunch break. We have started a science project about growing plants in different kinds of soil, which I think you would enjoy.",
      body2: "At first, I felt lonely because everyone else seemed to know one another. Then a classmate named Aditi showed me around, introduced me to her friends, and invited me to the art club. I was nervous about going, but I enjoyed drawing with the group and now look forward to meeting them each Thursday. I still miss you and our old friends. Each day here feels a little more familiar, though, and I am beginning to feel at home.",
      conclusion: "Please tell me how everyone at our old school is doing. I hope you will write back soon. Perhaps you can visit during the holidays, and I can show you my new school and our favourite places nearby.",
    },
  },
];
