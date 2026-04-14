import db, { initDb } from './db.js';

export function seedDb() {
  initDb();

  // Check if already seeded
  const moduleCount = db.prepare('SELECT COUNT(*) as count FROM modules').get() as { count: number };
  if (moduleCount.count > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  // Mock User
  const insertUser = db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)');
  insertUser.run('student-1', 'student@example.com', 'Test Student');

  // Module 1: Role Questions
  const insertModule = db.prepare('INSERT INTO modules (id, title, description, order_index, is_locked_by_default) VALUES (?, ?, ?, ?, ?)');
  insertModule.run('mod-1', 'Mastering Role Questions', 'Learn how to identify and analyze the role of statements in LSAT arguments.', 1, 0);

  const insertSection = db.prepare('INSERT INTO sections (id, module_id, title, content_type, body, order_index) VALUES (?, ?, ?, ?, ?, ?)');
  const insertQuestion = db.prepare('INSERT INTO questions (id, section_id, prompt, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)');

  // Mod 1, Section 1
  insertSection.run('sec-1-1', 'mod-1', 'Introduction to Role Questions', 'lesson', 
    `# Role Questions\n\nThe first thing I do when approaching Role Questions is to isolate the statement/sentence that the question is asking us about. You can do this either by highlighting or underlining it in the stimulus.\n\nI do this to keep myself focused on the task at hand. If we are making careless mistakes and chose the wrong statement to analyze, then whatever skills we have learned regarding this question type will be for nought.\n\nWhen reading the stimulus for Role questions, the reading habits are no different from when we are reading the stimulus of a Find the Conclusion Question. We are reading primarily for structure: we are reading the statements one by one, trying to decipher what the author's argument is. We are essentially doing two things: one, categorizing each statement according to their function; and two, finding the conclusion of the argument.`, 
    1);

  // Mod 1, Section 2
  insertSection.run('sec-1-2', 'mod-1', 'Checkpoint: Identifying Structure', 'quiz', '', 2);
  insertQuestion.run('q-1-2-1', 'sec-1-2', 
    'What are the two primary things we are doing when reading the stimulus for a Role question?', 
    JSON.stringify([
      'Finding the conclusion and categorizing each statement according to its function.',
      'Highlighting the first sentence and reading the answer choices.',
      'Finding the author\'s tone and identifying the background information.',
      'Looking for causal relationships and conditional logic.'
    ]), 
    'Finding the conclusion and categorizing each statement according to its function.', 
    'As stated in the lesson, we read primarily for structure: categorizing each statement according to its function and finding the conclusion of the argument.');

  // Mod 1, Section 3
  insertSection.run('sec-1-3', 'mod-1', 'Abstract Answer Choices', 'lesson',
    `# Role Question Answer Choices\n\nWhile the way in which we read the stimulus of any Role question is similar to how we approach Find the Conclusion questions, the answer choices we are faced with in Role questions are much more difficult. Life would be so simple if all the answer choices were just asking us if the statement in question is a premise or conclusion, but the test makers love to describe a relatively straightforward concept in abstract and vague language.\n\n### Key Terms to Translate:\n- **Presuppose**: On the LSAT, presuppose simply means "require". It's talking about a necessary condition.\n- **Illustrate**: An illustration is simply referring to an example.\n- **General Principle**: A rule on what we should/shouldn't do; it applies to multiple conditions and scenarios.`,
    3);

  // Mod 1, Section 4
  insertSection.run('sec-1-4', 'mod-1', 'LSAT Application: PT34 S3 Q14', 'lsat', '', 4);
  insertQuestion.run('q-1-4-1', 'sec-1-4',
    `People's political behavior frequently does not match their rhetoric. Although many complain about government intervention in their lives, they tend not to re-elect inactive politicians. But a politician's activity consists largely in the passage of laws whose enforcement affects voters' lives; Thus, voters often re-elect politicians whose behavior they resent.\n\nWhich one of the following most accurately describes the role played in the argument by the claim that people tend not to re-elect inactive politicians?`,
    JSON.stringify([
      'It describes a phenomenon for which the argument\'s conclusion is offered as an explanation',
      'It is a premise offered in support of the conclusion that voters often re-elect politicians whose behavior they resent',
      'It is offered as an example of how a politician\'s activity consists largely in the passage of laws whose enforcement interferes with voters\' lives',
      'It is a generalization based on the claim that people complain about government intervention in their lives'
    ]),
    'It is a premise offered in support of the conclusion that voters often re-elect politicians whose behavior they resent',
    `The statement "they tend not to re-elect inactive politicians" is a premise. It supports the intermediate conclusion that voters often re-elect politicians whose behavior they resent. The main conclusion is the first sentence: People's political behavior frequently does not match their rhetoric.`
  );

  // Module 2: Navigating Keywords & Traps
  insertModule.run('mod-2', 'Navigating Keywords & Traps', 'Learn how to identify out of scope, opposite, and half-right/half-wrong answer choices.', 2, 1);
  
  insertSection.run('sec-2-1', 'mod-2', 'Suspicious Answer Choices', 'lesson',
    `# Focus on the Answer Choices\n\nThere are six types of suspicious answers that appear frequently in LR questions:\n\n1. **Opposite Answers**: Give us a result that is the exact opposite of what we want. Always wrong.\n2. **Out of Scope Answers**: Talk about something unrelated to the specific subject. Watch out for unwarranted connections, scope too narrow, or scope too wide.\n3. **Answers that are too strong/too weak**: Not automatic grounds for dismissal, but be careful. "Never" or "always" are often too strong.\n4. **Half right half wrong answers**: The first half may be correct, but the second half contains out of scope information.\n5. **Answers describing something that did not happen**: For Role, Method, and Flaw questions, watch out for answers describing events that didn't occur in the stimulus.\n6. **Answer choices that are too vague/abstract**: Extract keywords and match them to the stimulus.`,
    1);

  insertSection.run('sec-2-2', 'mod-2', 'Checkpoint: Out of Scope', 'quiz', '', 2);
  insertQuestion.run('q-2-2-1', 'sec-2-2',
    'Which of the following is NOT a common technique test makers use to mask out of scope answers?',
    JSON.stringify([
      'Unwarranted connections',
      'Scope too narrow',
      'Scope too wide',
      'Using the exact same wording as the stimulus'
    ]),
    'Using the exact same wording as the stimulus',
    'Using the exact same wording is not a technique to mask out of scope answers. The three techniques mentioned in the lesson are unwarranted connections, scope too narrow, and scope too wide.'
  );

  // Initialize progress for student-1
  const insertProgress = db.prepare('INSERT INTO user_progress (user_id, module_id, status) VALUES (?, ?, ?)');
  insertProgress.run('student-1', 'mod-1', 'in_progress');
  insertProgress.run('student-1', 'mod-2', 'locked');

  console.log('Database seeded successfully.');
}
