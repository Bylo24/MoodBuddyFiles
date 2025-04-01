import { MoodEntry, Activity } from '../types';

export const recentMoodEntries: MoodEntry[] = [
  {
    id: '1',
    date: '2023-11-15',
    rating: 4,
    note: 'Had a productive day at work and enjoyed dinner with friends.',
  },
  {
    id: '2',
    date: '2023-11-14',
    rating: 3,
    note: 'Feeling okay, but a bit tired from yesterday.',
  },
  {
    id: '3',
    date: '2023-11-13',
    rating: 5,
    note: 'Amazing day! Got a promotion at work.',
  },
  {
    id: '4',
    date: '2023-11-12',
    rating: 2,
    note: 'Feeling down today. Rainy weather and canceled plans.',
  },
  {
    id: '5',
    date: '2023-11-11',
    rating: 3,
    note: 'Average day, nothing special happened.',
  },
];

// Free version activities (25 total) - Rebalanced for better variety
export const allActivities: Activity[] = [
  // MINDFULNESS (8 activities)
  {
    id: '1',
    title: 'Take deep breaths for 5 minutes',
    description: 'Focus on slow, deep breathing to calm your nervous system and reduce stress.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['calm', 'stress-relief', 'focus', 'anxiety', 'beginner']
  },
  {
    id: '2',
    title: 'Write down how you\'re feeling',
    description: 'Express your current emotions through writing to process and understand them better.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['expression', 'processing', 'clarity', 'emotions', 'beginner']
  },
  {
    id: '3',
    title: 'Practice gratitude—list three good things',
    description: 'Write down three things you are grateful for to shift your perspective.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db',
    tags: ['gratitude', 'perspective', 'reflection', 'positivity', 'beginner']
  },
  {
    id: '4',
    title: 'Do a simple meditation',
    description: 'Take a short break to clear your mind and focus on your breathing.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e',
    tags: ['calm', 'focus', 'present', 'stress-relief', 'beginner']
  },
  {
    id: '5',
    title: 'Try a short breathing exercise',
    description: 'Practice a structured breathing technique like box breathing or 4-7-8 breathing.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['calm', 'focus', 'anxiety-relief', 'stress-reduction', 'beginner']
  },
  {
    id: '6',
    title: 'Focus on one thing at a time',
    description: 'Choose a single task and give it your full attention without multitasking.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['focus', 'present', 'attention', 'calm', 'beginner']
  },
  {
    id: '7',
    title: 'Set a small, achievable goal for today',
    description: 'Choose one simple task you can complete to create a sense of accomplishment.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['accomplishment', 'focus', 'purpose', 'motivation', 'beginner']
  },
  {
    id: '8',
    title: 'Take a break from screens for 10 minutes',
    description: 'Step away from digital devices to reduce eye strain and mental stimulation.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    tags: ['digital-detox', 'rest', 'present', 'calm', 'beginner']
  },
  
  // EXERCISE (5 activities)
  {
    id: '9',
    title: 'Go for a walk outside',
    description: 'Take a refreshing walk outdoors to clear your mind and get some fresh air.',
    duration: 20,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    tags: ['fresh air', 'movement', 'nature', 'energy', 'beginner']
  },
  {
    id: '10',
    title: 'Stretch your body for a few minutes',
    description: 'Do some gentle stretches to release tension and increase flexibility.',
    duration: 5,
    category: 'exercise',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1',
    tags: ['flexibility', 'tension-release', 'body', 'movement', 'beginner']
  },
  {
    id: '11',
    title: 'Do a light workout (walking, yoga, etc.)',
    description: 'Engage in gentle physical activity to boost your energy and mood.',
    duration: 20,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    tags: ['movement', 'energy', 'strength', 'endorphins', 'beginner']
  },
  {
    id: '12',
    title: 'Dance to your favorite upbeat song',
    description: 'Move your body freely to music you enjoy to release tension and boost mood.',
    duration: 5,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    tags: ['joy', 'expression', 'movement', 'energy', 'beginner']
  },
  {
    id: '13',
    title: 'Try a quick 5-minute energy-boosting workout',
    description: 'Do a few jumping jacks, push-ups, or other simple exercises to increase energy.',
    duration: 5,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    tags: ['energy', 'strength', 'focus', 'vitality', 'beginner']
  },
  
  // RELAXATION (6 activities)
  {
    id: '14',
    title: 'Listen to your favorite music',
    description: 'Play songs that uplift your mood and make you feel good.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['joy', 'expression', 'sensory', 'relaxation', 'beginner']
  },
  {
    id: '15',
    title: 'Watch a funny video',
    description: 'Find something that makes you laugh to boost your mood instantly.',
    duration: 10,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1485178575877-1a9983c9addc',
    tags: ['laughter', 'joy', 'distraction', 'relaxation', 'beginner']
  },
  {
    id: '16',
    title: 'Take a short power nap',
    description: 'Rest for 15-20 minutes to recharge your energy and mental clarity.',
    duration: 20,
    category: 'relaxation',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c',
    tags: ['rest', 'energy', 'recovery', 'rejuvenation', 'beginner']
  },
  {
    id: '17',
    title: 'Read a book or article',
    description: 'Spend some time reading something interesting or enjoyable.',
    duration: 20,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
    tags: ['learning', 'escape', 'focus', 'calm', 'beginner']
  },
  {
    id: '18',
    title: 'Listen to calming nature sounds',
    description: 'Immerse yourself in peaceful sounds like rain, waves, or forest ambience.',
    duration: 10,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    tags: ['calm', 'sensory', 'stress-relief', 'focus', 'beginner']
  },
  {
    id: '19',
    title: 'Spend time with a pet (or watch animal videos)',
    description: 'Connect with animals to boost your mood and reduce stress.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
    tags: ['connection', 'joy', 'comfort', 'distraction', 'beginner']
  },
  
  // CREATIVE (3 activities)
  {
    id: '20',
    title: 'Try a new hobby or activity',
    description: 'Spend time learning something new that interests you.',
    duration: 30,
    category: 'creative',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    tags: ['growth', 'focus', 'accomplishment', 'creativity', 'beginner']
  },
  {
    id: '21',
    title: 'Doodle or color for a few minutes',
    description: 'Engage in simple, no-pressure creative expression through drawing or coloring.',
    duration: 10,
    category: 'creative',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    tags: ['creativity', 'expression', 'focus', 'relaxation', 'beginner']
  },
  {
    id: '22',
    title: 'Create a simple playlist for your current mood',
    description: 'Curate songs that match or improve how you\'re feeling right now.',
    duration: 15,
    category: 'creative',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['music', 'expression', 'curation', 'emotional-awareness', 'beginner']
  },
  
  // SOCIAL (2 activities)
  {
    id: '23',
    title: 'Call or message a friend',
    description: 'Connect with someone you care about for a mood-boosting conversation.',
    duration: 15,
    category: 'social',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8',
    tags: ['connection', 'support', 'love', 'communication', 'beginner']
  },
  {
    id: '24',
    title: 'Share something positive with someone else',
    description: 'Send an encouraging message, compliment, or helpful resource to brighten someone\'s day.',
    duration: 5,
    category: 'social',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8',
    tags: ['kindness', 'connection', 'giving', 'positivity', 'beginner']
  },
  
  // SELF-CARE (1 activity)
  {
    id: '25',
    title: 'Drink a glass of water',
    description: 'Hydrate yourself properly, which can immediately impact your energy and mood.',
    duration: 5,
    category: 'self-care',
    moodImpact: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
    tags: ['hydration', 'health', 'energy', 'self-care', 'beginner']
  }
];

// Premium version activities (all 100 activities)
export const premiumActivities: Activity[] = [
  // All free activities
  ...allActivities,
  
  // Additional premium activities
  {
    id: '26',
    title: 'Take a short power nap',
    description: 'Rest for 15-20 minutes to recharge your energy and mental clarity.',
    duration: 20,
    category: 'relaxation',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c',
    tags: ['rest', 'energy', 'recovery', 'rejuvenation', 'beginner'],
    isPremium: true
  },
  {
    id: '27',
    title: 'Watch a documentary',
    description: 'Learn something new by watching an interesting documentary.',
    duration: 60,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1485178575877-1a9983c9addc',
    tags: ['learning', 'curiosity', 'perspective', 'knowledge', 'beginner'],
    isPremium: true
  },
  {
    id: '28',
    title: 'Try a new podcast episode',
    description: 'Listen to a podcast on a topic that interests you or makes you laugh.',
    duration: 30,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['learning', 'entertainment', 'perspective', 'distraction', 'beginner'],
    isPremium: true
  },
  {
    id: '29',
    title: 'Research a random interesting topic',
    description: 'Pick a subject you know little about and spend time learning about it.',
    duration: 20,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1488868935619-4483ed49a3a7',
    tags: ['curiosity', 'learning', 'focus', 'distraction', 'beginner'],
    isPremium: true
  },
  {
    id: '30',
    title: 'Experiment with a creative hobby',
    description: 'Try drawing, music, or another creative outlet that interests you.',
    duration: 30,
    category: 'creative',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    tags: ['creativity', 'expression', 'flow', 'accomplishment', 'beginner'],
    isPremium: true
  },
  {
    id: '31',
    title: 'Take a different route on a walk',
    description: 'Change your usual walking path to discover new sights and perspectives.',
    duration: 20,
    category: 'exercise',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    tags: ['novelty', 'exploration', 'perspective', 'movement', 'beginner'],
    isPremium: true
  },
  {
    id: '32',
    title: 'Make a bucket list',
    description: 'Write down experiences and goals you want to achieve in your lifetime.',
    duration: 20,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db',
    tags: ['goals', 'inspiration', 'purpose', 'planning', 'beginner'],
    isPremium: true
  },
  {
    id: '33',
    title: 'Drink a big glass of water first',
    description: 'Hydrate yourself properly, which can immediately impact your energy and mood.',
    duration: 5,
    category: 'self-care',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
    tags: ['hydration', 'health', 'energy', 'self-care', 'beginner'],
    isPremium: true
  },
  {
    id: '34',
    title: 'Eat a balanced snack with protein and fiber',
    description: 'Choose a nutritious snack to stabilize your blood sugar and energy levels.',
    duration: 10,
    category: 'self-care',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71',
    tags: ['nutrition', 'energy', 'health', 'self-care', 'beginner'],
    isPremium: true
  },
  {
    id: '35',
    title: 'Try mindful eating',
    description: 'Focus on textures, flavors, and sensations while eating without distractions.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352',
    tags: ['present', 'awareness', 'nutrition', 'sensory', 'beginner'],
    isPremium: true
  },
  {
    id: '36',
    title: 'Plan your next meal to look forward to',
    description: 'Create anticipation by planning a delicious, nourishing meal.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d',
    tags: ['anticipation', 'nutrition', 'creativity', 'planning', 'beginner'],
    isPremium: true
  },
  {
    id: '37',
    title: 'Cook something fun from scratch',
    description: 'Prepare a meal completely from basic ingredients for a sense of accomplishment.',
    duration: 45,
    category: 'creative',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba',
    tags: ['creativity', 'accomplishment', 'nutrition', 'focus', 'intermediate'],
    isPremium: true
  },
  {
    id: '38',
    title: 'Experiment with a new recipe',
    description: 'Try cooking something you\'ve never made before to engage your creativity.',
    duration: 40,
    category: 'creative',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba',
    tags: ['creativity', 'novelty', 'learning', 'accomplishment', 'intermediate'],
    isPremium: true
  },
  {
    id: '39',
    title: 'Look up easy, healthy snack ideas',
    description: 'Research simple nutritious snacks you can prepare for future energy boosts.',
    duration: 15,
    category: 'self-care',
    moodImpact: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71',
    tags: ['nutrition', 'planning', 'health', 'self-care', 'beginner'],
    isPremium: true
  },
  {
    id: '40',
    title: 'Savor a small treat intentionally',
    description: 'Enjoy a small portion of something delicious with full attention to the experience.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d',
    tags: ['pleasure', 'mindfulness', 'sensory', 'present', 'beginner'],
    isPremium: true
  },
  {
    id: '41',
    title: 'Make a smoothie or fresh juice',
    description: 'Blend fruits and vegetables for a refreshing, nutritious boost.',
    duration: 15,
    category: 'self-care',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71',
    tags: ['nutrition', 'energy', 'health', 'creativity', 'beginner'],
    isPremium: true
  },
  {
    id: '42',
    title: 'Avoid eating out of boredom',
    description: 'Check in with yourself to distinguish between true hunger and emotional eating.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352',
    tags: ['awareness', 'habits', 'health', 'self-regulation', 'beginner'],
    isPremium: true
  },
  {
    id: '43',
    title: 'Write about how you\'re feeling',
    description: 'Express your current emotions through writing to process and understand them better.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['expression', 'processing', 'clarity', 'emotions', 'beginner'],
    isPremium: true
  },
  {
    id: '44',
    title: 'Listen to soothing, comforting music',
    description: 'Play music that calms and soothes your emotions.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['calm', 'comfort', 'emotional-regulation', 'sensory', 'beginner'],
    isPremium: true
  },
  {
    id: '45',
    title: 'Hug a pet or stuffed animal',
    description: 'Physical touch can release oxytocin and provide comfort when feeling down.',
    duration: 5,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
    tags: ['comfort', 'touch', 'connection', 'soothing', 'beginner'],
    isPremium: true
  },
  {
    id: '46',
    title: 'Look through happy memories',
    description: 'Browse photos, letters, or mementos that remind you of positive experiences.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db',
    tags: ['nostalgia', 'gratitude', 'perspective', 'joy', 'beginner'],
    isPremium: true
  },
  {
    id: '47',
    title: 'Take a slow walk in a peaceful place',
    description: 'Find a quiet location for a gentle, mindful walk to calm your thoughts.',
    duration: 20,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1552308995-2baac1ad5490',
    tags: ['calm', 'nature', 'movement', 'mindfulness', 'beginner'],
    isPremium: true
  },
  {
    id: '48',
    title: 'Do a simple creative activity',
    description: 'Try painting, coloring, or writing poetry as a form of emotional expression.',
    duration: 30,
    category: 'creative',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    tags: ['expression', 'creativity', 'flow', 'processing', 'beginner'],
    isPremium: true
  },
  {
    id: '49',
    title: 'Watch a nostalgic childhood show',
    description: 'Revisit a favorite show from your childhood for comfort and positive memories.',
    duration: 30,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1485178575877-1a9983c9addc',
    tags: ['nostalgia', 'comfort', 'joy', 'relaxation', 'beginner'],
    isPremium: true
  },
  {
    id: '50',
    title: 'Call a supportive friend or family member',
    description: 'Reach out to someone who listens well and makes you feel understood.',
    duration: 20,
    category: 'social',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8',
    tags: ['support', 'connection', 'expression', 'understanding', 'beginner'],
    isPremium: true
  },
  {
    id: '51',
    title: 'Cook or order your favorite comfort food',
    description: 'Prepare or order a meal that brings you feelings of comfort and satisfaction.',
    duration: 30,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1493770348161-369560ae357d',
    tags: ['comfort', 'pleasure', 'nourishment', 'self-care', 'beginner'],
    isPremium: true
  },
  {
    id: '52',
    title: 'Try a relaxation exercise to calm your thoughts',
    description: 'Use progressive muscle relaxation or guided imagery to reduce anxiety.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    tags: ['relaxation', 'calm', 'anxiety-relief', 'stress-reduction', 'beginner'],
    isPremium: true
  },
  {
    id: '53',
    title: 'Write down your worries and possible solutions',
    description: 'List your concerns and brainstorm potential ways to address them.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['problem-solving', 'clarity', 'anxiety-relief', 'planning', 'beginner'],
    isPremium: true
  },
  {
    id: '54',
    title: 'Practice the 5-4-3-2-1 grounding technique',
    description: 'Use your senses to ground yourself: notice 5 things you see, 4 you touch, 3 you hear, 2 you smell, and 1 you taste.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['grounding', 'anxiety-relief', 'present', 'sensory', 'beginner'],
    isPremium: true
  },
  {
    id: '55',
    title: 'Do a 10-minute guided meditation',
    description: 'Follow a guided meditation focused on anxiety reduction or emotional balance.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e',
    tags: ['meditation', 'calm', 'focus', 'anxiety-relief', 'beginner'],
    isPremium: true
  },
  {
    id: '56',
    title: 'Go for a run to release built-up tension',
    description: 'Use running or jogging to release stress hormones and boost endorphins.',
    duration: 20,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    tags: ['energy', 'release', 'endorphins', 'stress-relief', 'intermediate'],
    isPremium: true
  },
  {
    id: '57',
    title: 'Listen to binaural beats or white noise',
    description: 'Use specific sound frequencies to help calm your nervous system.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['calm', 'focus', 'relaxation', 'anxiety-relief', 'beginner'],
    isPremium: true
  },
  {
    id: '58',
    title: 'Take a slow walk focusing on your breathing',
    description: 'Walk at a gentle pace while synchronizing your breath with your steps.',
    duration: 15,
    category: 'exercise',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1552308995-2baac1ad5490',
    tags: ['mindfulness', 'breathing', 'movement', 'calm', 'beginner'],
    isPremium: true
  },
  {
    id: '59',
    title: 'Squeeze a stress ball or use a fidget toy',
    description: 'Use physical objects designed to help channel nervous energy.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
    tags: ['stress-relief', 'sensory', 'focus', 'anxiety-management', 'beginner'],
    isPremium: true
  },
  {
    id: '60',
    title: 'Stretch out your body, focusing on tense muscles',
    description: 'Identify areas of physical tension and gently stretch them to release.',
    duration: 10,
    category: 'exercise',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1',
    tags: ['tension-release', 'body-awareness', 'flexibility', 'relaxation', 'beginner'],
    isPremium: true
  },
  {
    id: '61',
    title: 'Drink a warm herbal tea',
    description: 'Prepare and mindfully enjoy a cup of calming herbal tea like chamomile or lavender.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
    tags: ['calm', 'warmth', 'ritual', 'sensory', 'beginner'],
    isPremium: true
  },
  {
    id: '62',
    title: 'Plan something to look forward to',
    description: 'Create anticipation by planning a future activity or event that excites you.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['anticipation', 'joy', 'planning', 'motivation', 'beginner'],
    isPremium: true
  },
  {
    id: '63',
    title: 'Do an intense workout',
    description: 'Try boxing, HIIT, or another high-intensity exercise to channel frustration.',
    duration: 30,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    tags: ['energy-release', 'endorphins', 'strength', 'focus', 'intermediate'],
    isPremium: true
  },
  {
    id: '64',
    title: 'Write an unsent letter expressing your feelings',
    description: 'Write out your thoughts and emotions without the intention of sending it.',
    duration: 15,
    category: 'creative',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['expression', 'processing', 'clarity', 'release', 'beginner'],
    isPremium: true
  },
  {
    id: '65',
    title: 'Take deep, controlled breaths for 5 minutes',
    description: 'Practice slow, deliberate breathing to activate your parasympathetic nervous system.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['calm', 'anxiety-relief', 'focus', 'stress-reduction', 'beginner'],
    isPremium: true
  },
  {
    id: '66',
    title: 'Listen to energetic or aggressive music',
    description: 'Use music that matches your current energy to help process emotions.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['expression', 'release', 'energy', 'emotional-processing', 'beginner'],
    isPremium: true
  },
  {
    id: '67',
    title: 'Rip up a piece of paper with your frustrations written on it',
    description: 'Write down what\'s bothering you, then physically destroy the paper as a symbolic release.',
    duration: 10,
    category: 'creative',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['release', 'symbolism', 'expression', 'catharsis', 'beginner'],
    isPremium: true
  },
  {
    id: '68',
    title: 'Scream into a pillow',
    description: 'Release vocal tension in a safe, private way by screaming into a pillow.',
    duration: 5,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
    tags: ['release', 'expression', 'catharsis', 'tension', 'beginner'],
    isPremium: true
  },
  {
    id: '69',
    title: 'Go for a fast-paced walk or run',
    description: 'Channel frustration into physical movement with a brisk walk or run.',
    duration: 20,
    category: 'exercise',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    tags: ['energy', 'release', 'endorphins', 'movement', 'beginner'],
    isPremium: true
  },
  {
    id: '70',
    title: 'Do progressive muscle relaxation',
    description: 'Systematically tense and release muscle groups to reduce physical tension.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    tags: ['relaxation', 'tension-release', 'body-awareness', 'calm', 'beginner'],
    isPremium: true
  },
  {
    id: '71',
    title: 'Distract yourself with a problem-solving task',
    description: 'Engage in a puzzle, coding challenge, or other problem that requires focus.',
    duration: 20,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['distraction', 'focus', 'accomplishment', 'cognitive', 'intermediate'],
    isPremium: true
  },
  {
    id: '72',
    title: 'Talk to someone you trust about your frustration',
    description: 'Share your feelings with someone who will listen without judgment.',
    duration: 20,
    category: 'social',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8',
    tags: ['support', 'connection', 'expression', 'processing', 'beginner'],
    isPremium: true
  },
  {
    id: '73',
    title: 'Step away from screens for 30+ minutes',
    description: 'Take a break from digital devices to reduce stimulation and eye strain.',
    duration: 30,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    tags: ['digital-detox', 'calm', 'present', 'rest', 'beginner'],
    isPremium: true
  },
  {
    id: '74',
    title: 'Go outside and walk barefoot on the grass',
    description: 'Connect with nature through direct physical contact with the earth.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    tags: ['grounding', 'nature', 'sensory', 'present', 'beginner'],
    isPremium: true
  },
  {
    id: '75',
    title: 'Focus on a single sensory activity',
    description: 'Concentrate fully on one sense, like listening to rain sounds or feeling textures.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1495001258031-d1b407bc1776',
    tags: ['sensory', 'present', 'focus', 'calm', 'beginner'],
    isPremium: true
  },
  {
    id: '76',
    title: 'Dim the lights or use blue light filters',
    description: 'Reduce visual stimulation by lowering light levels or filtering blue light.',
    duration: 5,
    category: 'relaxation',
    moodImpact: 'low',
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15',
    tags: ['sensory', 'calm', 'environment', 'rest', 'beginner'],
    isPremium: true
  },
  {
    id: '77',
    title: 'Do a slow, controlled breathing exercise',
    description: 'Practice techniques like 4-7-8 breathing or box breathing to calm your system.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['calm', 'focus', 'anxiety-relief', 'stress-reduction', 'beginner'],
    isPremium: true
  },
  {
    id: '78',
    title: 'Hold something cool or textured to ground yourself',
    description: 'Use physical objects with distinct temperatures or textures as sensory anchors.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1495001258031-d1b407bc1776',
    tags: ['grounding', 'sensory', 'present', 'anxiety-relief', 'beginner'],
    isPremium: true
  },
  {
    id: '79',
    title: 'Reduce noise by using earplugs or a white noise machine',
    description: 'Create a quieter environment to reduce auditory stimulation.',
    duration: 5,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15',
    tags: ['sensory', 'calm', 'environment', 'focus', 'beginner'],
    isPremium: true
  },
  {
    id: '80',
    title: 'Engage in a slow-paced activity',
    description: 'Try reading, journaling, or handcrafts that encourage a slower pace.',
    duration: 20,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1488868935619-4483ed49a3a7',
    tags: ['calm', 'focus', 'flow', 'present', 'beginner'],
    isPremium: true
  },
  {
    id: '81',
    title: 'Declutter your surroundings for a calmer space',
    description: 'Clear visible clutter from your immediate environment to reduce visual stimulation.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1499955085172-a104c9463ece',
    tags: ['order', 'environment', 'focus', 'calm', 'beginner'],
    isPremium: true
  },
  {
    id: '82',
    title: 'Organize a small area of your space',
    description: 'Clear clutter from a small area to create a sense of order and accomplishment.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1499955085172-a104c9463ece',
    tags: ['order', 'focus', 'accomplishment', 'control', 'beginner'],
    isPremium: true
  },
  {
    id: '83',
    title: 'Set a 5-minute timer to pause and reset',
    description: 'Take a short, intentional break to interrupt overwhelming thoughts or tasks.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['pause', 'reset', 'overwhelm', 'boundaries', 'beginner'],
    isPremium: true
  },
  {
    id: '84',
    title: 'Write down your biggest stressors',
    description: 'List what\'s overwhelming you to get it out of your head and onto paper.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['clarity', 'processing', 'organization', 'stress-management', 'beginner'],
    isPremium: true
  },
  {
    id: '85',
    title: 'Avoid multitasking—prioritize one thing at a time',
    description: 'Choose the most important task and focus solely on it until completion.',
    duration: 20,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['focus', 'productivity', 'attention', 'accomplishment', 'beginner'],
    isPremium: true
  },
  {
    id: '86',
    title: 'Use a to-do list with the three most important tasks only',
    description: 'Identify and focus on just the three highest-priority items.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['organization', 'focus', 'productivity', 'clarity', 'beginner'],
    isPremium: true
  },
  {
    id: '87',
    title: 'Give yourself permission to take a short break',
    description: 'Consciously decide to pause and rest without guilt.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
    tags: ['self-care', 'boundaries', 'rest', 'permission', 'beginner'],
    isPremium: true
  },
  {
    id: '88',
    title: 'Listen to a podcast or music with no lyrics',
    description: 'Choose instrumental music or a calming podcast to reduce cognitive load.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['calm', 'focus', 'background', 'sensory', 'beginner'],
    isPremium: true
  },
  {
    id: '89',
    title: 'Reduce screen time to avoid information overload',
    description: 'Take a break from digital devices to decrease mental stimulation.',
    duration: 30,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    tags: ['digital-detox', 'calm', 'focus', 'overwhelm', 'beginner'],
    isPremium: true
  },
  {
    id: '90',
    title: 'Take 10 slow, deep breaths to regain clarity',
    description: 'Pause and focus on your breathing to reset your mental state.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    tags: ['focus', 'calm', 'reset', 'clarity', 'beginner'],
    isPremium: true
  },
  {
    id: '91',
    title: 'Use the two-minute rule',
    description: 'If a task takes less than 2 minutes, do it immediately rather than postponing it.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['productivity', 'accomplishment', 'organization', 'efficiency', 'beginner'],
    isPremium: true
  },
  {
    id: '92',
    title: 'Delegate small tasks if possible',
    description: 'Identify tasks that others could help with and ask for assistance.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b',
    tags: ['boundaries', 'support', 'organization', 'overwhelm', 'intermediate'],
    isPremium: true
  },
  {
    id: '93',
    title: 'Take a short 20-minute nap',
    description: 'Rest briefly to recharge your energy without entering deep sleep.',
    duration: 20,
    category: 'relaxation',
    moodImpact: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c',
    tags: ['rest', 'energy', 'recovery', 'fatigue', 'beginner'],
    isPremium: true
  },
  {
    id: '94',
    title: 'Drink a glass of water and rehydrate',
    description: 'Address potential dehydration, which can contribute to fatigue.',
    duration: 5,
    category: 'self-care',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
    tags: ['hydration', 'energy', 'health', 'self-care', 'beginner'],
    isPremium: true
  },
  {
    id: '95',
    title: 'Step outside for fresh air',
    description: 'Take a brief break outdoors to increase oxygen and change your environment.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    tags: ['fresh-air', 'nature', 'energy', 'reset', 'beginner'],
    isPremium: true
  },
  {
    id: '96',
    title: 'Do a low-energy stretching routine',
    description: 'Perform gentle stretches that don\'t require much exertion.',
    duration: 10,
    category: 'exercise',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1',
    tags: ['gentle', 'movement', 'flexibility', 'energy', 'beginner'],
    isPremium: true
  },
  {
    id: '97',
    title: 'Listen to calming instrumental music',
    description: 'Play soothing music without lyrics to relax without mental engagement.',
    duration: 15,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    tags: ['calm', 'rest', 'sensory', 'relaxation', 'beginner'],
    isPremium: true
  },
  {
    id: '98',
    title: 'Reduce screen time for an hour',
    description: 'Take a break from digital devices to rest your eyes and mind.',
    duration: 60,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
    tags: ['digital-detox', 'rest', 'eye-strain', 'calm', 'beginner'],
    isPremium: true
  },
  {
    id: '99',
    title: 'Use aromatherapy',
    description: 'Try lavender, chamomile, or other calming scents to promote relaxation.',
    duration: 10,
    category: 'relaxation',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88',
    tags: ['sensory', 'calm', 'relaxation', 'self-care', 'beginner'],
    isPremium: true
  },
  {
    id: '100',
    title: 'Write down what\'s making you feel exhausted',
    description: 'Identify the sources of your fatigue to better address them.',
    duration: 10,
    category: 'mindfulness',
    moodImpact: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    tags: ['awareness', 'clarity', 'processing', 'self-understanding', 'beginner'],
    isPremium: true
  }
];

// Default recommended activities (first 3)
export const recommendedActivities: Activity[] = allActivities.slice(0, 3);