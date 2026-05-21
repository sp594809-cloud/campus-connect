
-- Tracks catalog
CREATE TABLE public.learning_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT '📘',
  description text NOT NULL DEFAULT '',
  source_base_url text NOT NULL DEFAULT '',
  branches text[] NOT NULL DEFAULT '{}',
  is_common boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY lt_select_auth ON public.learning_tracks FOR SELECT TO authenticated USING (true);

-- Topics / curated link bank per track
CREATE TABLE public.track_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  level text NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  order_index int NOT NULL DEFAULT 0,
  source_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(track_id, slug)
);
ALTER TABLE public.track_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY tt_select_auth ON public.track_topics FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_track_topics_track ON public.track_topics(track_id, level, order_index);

-- User plans
CREATE TABLE public.user_learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  pace_days int NOT NULL CHECK (pace_days BETWEEN 1 AND 60),
  current_day int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_learning_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY ulp_select_own ON public.user_learning_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ulp_insert_own ON public.user_learning_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ulp_update_own ON public.user_learning_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ulp_delete_own ON public.user_learning_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_ulp_user ON public.user_learning_plans(user_id, status);

-- Daily tasks
CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.user_learning_plans(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  topic_title text NOT NULL,
  question text NOT NULL,
  exercise_prompt text NOT NULL,
  expected_answer_summary text NOT NULL DEFAULT '',
  source_url text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, day_number)
);
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY dt_select_own ON public.daily_tasks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_learning_plans p WHERE p.id = daily_tasks.plan_id AND p.user_id = auth.uid())
);
CREATE POLICY dt_insert_own ON public.daily_tasks FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_learning_plans p WHERE p.id = daily_tasks.plan_id AND p.user_id = auth.uid())
);

-- Submissions
CREATE TABLE public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  submission_text text NOT NULL,
  ai_score int NOT NULL DEFAULT 0,
  ai_feedback text NOT NULL DEFAULT '',
  ai_mistakes text NOT NULL DEFAULT '',
  ai_hint text NOT NULL DEFAULT '',
  passed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ts_select_own ON public.task_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ts_insert_own ON public.task_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ts_user ON public.task_submissions(user_id, submitted_at DESC);

-- Seed tracks
INSERT INTO public.learning_tracks (slug, name, category, icon, description, source_base_url, branches, is_common) VALUES
  ('ai-basics', 'AI & ML Basics', 'ai', '🤖', 'Foundations of AI, ML and prompt engineering.', 'https://www.geeksforgeeks.org/machine-learning/', '{}', true),
  ('java', 'Java', 'programming', '☕', 'Object-oriented programming with Java.', 'https://www.w3schools.com/java/', '{CSE,IT}', false),
  ('python', 'Python', 'programming', '🐍', 'Python for general programming and scripting.', 'https://www.w3schools.com/python/', '{CSE,IT,ECE,EE}', false),
  ('javascript', 'JavaScript', 'programming', '🟨', 'Modern JavaScript essentials.', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', '{CSE,IT}', false),
  ('cpp', 'C++', 'programming', '➕', 'C++ for systems and competitive programming.', 'https://www.geeksforgeeks.org/c-plus-plus/', '{CSE,IT,ECE,EE,ME}', false),
  ('web', 'Web Development', 'web', '🌐', 'HTML, CSS, and React fundamentals.', 'https://developer.mozilla.org/en-US/docs/Learn', '{CSE,IT}', false),
  ('dsa', 'DSA', 'cs-core', '🧠', 'Data Structures & Algorithms.', 'https://www.geeksforgeeks.org/data-structures/', '{CSE,IT,ECE}', false),
  ('dbms', 'DBMS', 'cs-core', '🗄️', 'Databases and SQL.', 'https://www.geeksforgeeks.org/dbms/', '{CSE,IT}', false),
  ('os', 'Operating Systems', 'cs-core', '🖥️', 'OS concepts and concurrency.', 'https://www.geeksforgeeks.org/operating-systems/', '{CSE,IT}', false),
  ('cn', 'Computer Networks', 'cs-core', '📡', 'Networking essentials.', 'https://www.geeksforgeeks.org/computer-network-tutorials/', '{CSE,IT,ECE}', false),
  ('aptitude', 'Aptitude', 'general', '🧩', 'Quant, logical and verbal aptitude.', 'https://www.indiabix.com/aptitude/questions-and-answers/', '{}', true),
  ('mech-thermo', 'Thermodynamics', 'mechanical', '🔥', 'Core mechanical engineering thermodynamics.', 'https://www.geeksforgeeks.org/thermodynamics/', '{ME}', false),
  ('ece-signals', 'Signals & Systems', 'electronics', '📶', 'Signals, systems and DSP basics.', 'https://www.geeksforgeeks.org/digital-signal-processing-dsp/', '{ECE}', false),
  ('ee-circuits', 'Electrical Circuits', 'electrical', '⚡', 'Circuit theory and analysis.', 'https://www.allaboutcircuits.com/textbook/', '{EE}', false),
  ('civil-structures', 'Structural Engineering', 'civil', '🏗️', 'Structural analysis fundamentals.', 'https://www.geeksforgeeks.org/civil-engineering/', '{CE}', false);

-- Seed a starter set of topics for the most common tracks (5 per level for top tracks)
INSERT INTO public.track_topics (track_id, slug, title, level, order_index, source_url)
SELECT t.id, x.slug, x.title, x.level, x.idx, x.url FROM public.learning_tracks t
JOIN (VALUES
  ('java','variables','Variables and Data Types','beginner',1,'https://www.w3schools.com/java/java_variables.asp'),
  ('java','operators','Operators','beginner',2,'https://www.w3schools.com/java/java_operators.asp'),
  ('java','if-else','Conditionals','beginner',3,'https://www.w3schools.com/java/java_conditions.asp'),
  ('java','loops','Loops','beginner',4,'https://www.w3schools.com/java/java_for_loop.asp'),
  ('java','arrays','Arrays','beginner',5,'https://www.w3schools.com/java/java_arrays.asp'),
  ('java','oop','Classes and Objects','intermediate',1,'https://www.w3schools.com/java/java_classes.asp'),
  ('java','inheritance','Inheritance','intermediate',2,'https://www.w3schools.com/java/java_inheritance.asp'),
  ('java','polymorphism','Polymorphism','intermediate',3,'https://www.w3schools.com/java/java_polymorphism.asp'),
  ('java','collections','Collections (ArrayList/HashMap)','intermediate',4,'https://www.w3schools.com/java/java_arraylist.asp'),
  ('java','exceptions','Exceptions','intermediate',5,'https://www.w3schools.com/java/java_try_catch.asp'),
  ('java','generics','Generics','advanced',1,'https://www.geeksforgeeks.org/generics-in-java/'),
  ('java','threads','Threads & Concurrency','advanced',2,'https://www.geeksforgeeks.org/multithreading-in-java/'),
  ('java','streams','Streams API','advanced',3,'https://www.geeksforgeeks.org/stream-in-java/'),
  ('java','lambdas','Lambdas & Functional','advanced',4,'https://www.geeksforgeeks.org/lambda-expressions-java-8/'),
  ('java','jvm','JVM Internals','advanced',5,'https://www.geeksforgeeks.org/jvm-works-jvm-architecture/'),

  ('python','syntax','Syntax & Variables','beginner',1,'https://www.w3schools.com/python/python_variables.asp'),
  ('python','data-types','Data Types','beginner',2,'https://www.w3schools.com/python/python_datatypes.asp'),
  ('python','if','Conditionals','beginner',3,'https://www.w3schools.com/python/python_conditions.asp'),
  ('python','loops','Loops','beginner',4,'https://www.w3schools.com/python/python_for_loops.asp'),
  ('python','functions','Functions','beginner',5,'https://www.w3schools.com/python/python_functions.asp'),
  ('python','lists','Lists','intermediate',1,'https://www.w3schools.com/python/python_lists.asp'),
  ('python','dicts','Dictionaries','intermediate',2,'https://www.w3schools.com/python/python_dictionaries.asp'),
  ('python','oop','Classes','intermediate',3,'https://www.w3schools.com/python/python_classes.asp'),
  ('python','modules','Modules & Packages','intermediate',4,'https://www.w3schools.com/python/python_modules.asp'),
  ('python','file-io','File I/O','intermediate',5,'https://www.w3schools.com/python/python_file_handling.asp'),
  ('python','decorators','Decorators','advanced',1,'https://www.geeksforgeeks.org/decorators-in-python/'),
  ('python','generators','Generators','advanced',2,'https://www.geeksforgeeks.org/generators-in-python/'),
  ('python','async','Async / Await','advanced',3,'https://www.geeksforgeeks.org/asyncio-in-python/'),
  ('python','numpy','NumPy basics','advanced',4,'https://www.geeksforgeeks.org/python-numpy/'),
  ('python','pandas','Pandas basics','advanced',5,'https://www.geeksforgeeks.org/pandas-tutorial/'),

  ('javascript','vars','Variables (let/const)','beginner',1,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types'),
  ('javascript','types','Types & Coercion','beginner',2,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures'),
  ('javascript','functions','Functions','beginner',3,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions'),
  ('javascript','arrays','Arrays','beginner',4,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array'),
  ('javascript','objects','Objects','beginner',5,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects'),
  ('javascript','closures','Closures','intermediate',1,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures'),
  ('javascript','promises','Promises','intermediate',2,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises'),
  ('javascript','async','Async/Await','intermediate',3,'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises'),
  ('javascript','this','this & binding','intermediate',4,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this'),
  ('javascript','prototype','Prototypes','intermediate',5,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain'),
  ('javascript','eventloop','Event Loop','advanced',1,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop'),
  ('javascript','modules','ES Modules','advanced',2,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules'),
  ('javascript','generators','Generators','advanced',3,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators'),
  ('javascript','proxy','Proxy & Reflect','advanced',4,'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy'),
  ('javascript','perf','Performance','advanced',5,'https://developer.mozilla.org/en-US/docs/Web/Performance'),

  ('dsa','arrays','Arrays','beginner',1,'https://www.geeksforgeeks.org/array-data-structure/'),
  ('dsa','strings','Strings','beginner',2,'https://www.geeksforgeeks.org/string-data-structure/'),
  ('dsa','linked-list','Linked List','beginner',3,'https://www.geeksforgeeks.org/data-structures/linked-list/'),
  ('dsa','stack-queue','Stack & Queue','beginner',4,'https://www.geeksforgeeks.org/stack-data-structure/'),
  ('dsa','hashing','Hashing','beginner',5,'https://www.geeksforgeeks.org/hashing-data-structure/'),
  ('dsa','two-pointers','Two Pointers','intermediate',1,'https://www.geeksforgeeks.org/two-pointers-technique/'),
  ('dsa','sliding-window','Sliding Window','intermediate',2,'https://www.geeksforgeeks.org/window-sliding-technique/'),
  ('dsa','recursion','Recursion','intermediate',3,'https://www.geeksforgeeks.org/recursion/'),
  ('dsa','trees','Trees','intermediate',4,'https://www.geeksforgeeks.org/binary-tree-data-structure/'),
  ('dsa','graphs','Graphs','intermediate',5,'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/'),
  ('dsa','dp','Dynamic Programming','advanced',1,'https://www.geeksforgeeks.org/dynamic-programming/'),
  ('dsa','greedy','Greedy','advanced',2,'https://www.geeksforgeeks.org/greedy-algorithms/'),
  ('dsa','tries','Tries','advanced',3,'https://www.geeksforgeeks.org/trie-insert-and-search/'),
  ('dsa','segment-tree','Segment Tree','advanced',4,'https://www.geeksforgeeks.org/segment-tree-data-structure/'),
  ('dsa','backtracking','Backtracking','advanced',5,'https://www.geeksforgeeks.org/backtracking-algorithms/'),

  ('dbms','er-model','ER Model','beginner',1,'https://www.geeksforgeeks.org/introduction-of-er-model/'),
  ('dbms','sql-basics','SQL Basics','beginner',2,'https://www.w3schools.com/sql/'),
  ('dbms','joins','SQL Joins','beginner',3,'https://www.w3schools.com/sql/sql_join.asp'),
  ('dbms','normalization','Normalization','intermediate',1,'https://www.geeksforgeeks.org/normal-forms-in-dbms/'),
  ('dbms','indexing','Indexing','intermediate',2,'https://www.geeksforgeeks.org/indexing-in-databases-set-1/'),
  ('dbms','transactions','Transactions & ACID','intermediate',3,'https://www.geeksforgeeks.org/acid-properties-in-dbms/'),
  ('dbms','concurrency','Concurrency Control','advanced',1,'https://www.geeksforgeeks.org/concurrency-control-in-dbms/'),
  ('dbms','recovery','Recovery','advanced',2,'https://www.geeksforgeeks.org/recovery-from-database-failures/'),

  ('os','process','Processes & Threads','beginner',1,'https://www.geeksforgeeks.org/introduction-of-process-management/'),
  ('os','scheduling','CPU Scheduling','beginner',2,'https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/'),
  ('os','sync','Synchronization','intermediate',1,'https://www.geeksforgeeks.org/process-synchronization-introduction/'),
  ('os','deadlock','Deadlocks','intermediate',2,'https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/'),
  ('os','memory','Memory Management','intermediate',3,'https://www.geeksforgeeks.org/memory-management-in-operating-system/'),
  ('os','paging','Paging & Virtual Memory','advanced',1,'https://www.geeksforgeeks.org/paging-in-operating-system/'),
  ('os','filesystem','File Systems','advanced',2,'https://www.geeksforgeeks.org/file-systems-in-operating-system/'),

  ('cn','osi','OSI Model','beginner',1,'https://www.geeksforgeeks.org/open-systems-interconnection-model-osi/'),
  ('cn','tcp-ip','TCP/IP','beginner',2,'https://www.geeksforgeeks.org/tcp-ip-model/'),
  ('cn','http','HTTP','beginner',3,'https://www.geeksforgeeks.org/http-full-form/'),
  ('cn','routing','Routing','intermediate',1,'https://www.geeksforgeeks.org/types-of-routing/'),
  ('cn','dns','DNS','intermediate',2,'https://www.geeksforgeeks.org/details-on-dns/'),
  ('cn','tls','TLS / HTTPS','advanced',1,'https://www.geeksforgeeks.org/transport-layer-security-tls/'),

  ('web','html','HTML Essentials','beginner',1,'https://developer.mozilla.org/en-US/docs/Web/HTML'),
  ('web','css','CSS Basics','beginner',2,'https://developer.mozilla.org/en-US/docs/Web/CSS'),
  ('web','flexbox','Flexbox','beginner',3,'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout'),
  ('web','dom','DOM Manipulation','intermediate',1,'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model'),
  ('web','fetch','Fetch & APIs','intermediate',2,'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch'),
  ('web','react-basics','React Basics','intermediate',3,'https://react.dev/learn'),
  ('web','react-hooks','React Hooks','advanced',1,'https://react.dev/reference/react'),
  ('web','perf','Web Performance','advanced',2,'https://developer.mozilla.org/en-US/docs/Web/Performance'),

  ('aptitude','arithmetic','Arithmetic','beginner',1,'https://www.indiabix.com/aptitude/arithmetic-aptitude/'),
  ('aptitude','percentages','Percentages','beginner',2,'https://www.indiabix.com/aptitude/percentage/'),
  ('aptitude','ratios','Ratios & Proportions','beginner',3,'https://www.indiabix.com/aptitude/ratio-and-proportion/'),
  ('aptitude','time-work','Time & Work','intermediate',1,'https://www.indiabix.com/aptitude/time-and-work/'),
  ('aptitude','probability','Probability','intermediate',2,'https://www.indiabix.com/aptitude/probability/'),
  ('aptitude','logical','Logical Reasoning','advanced',1,'https://www.indiabix.com/logical-reasoning/questions-and-answers/'),

  ('ai-basics','what-is-ai','What is AI','beginner',1,'https://www.geeksforgeeks.org/what-is-artificial-intelligence-ai/'),
  ('ai-basics','ml-types','Types of ML','beginner',2,'https://www.geeksforgeeks.org/types-of-machine-learning/'),
  ('ai-basics','supervised','Supervised Learning','beginner',3,'https://www.geeksforgeeks.org/supervised-unsupervised-learning/'),
  ('ai-basics','neural-nets','Neural Networks','intermediate',1,'https://www.geeksforgeeks.org/introduction-to-artificial-neutral-networks/'),
  ('ai-basics','llm','LLMs','intermediate',2,'https://www.geeksforgeeks.org/large-language-model-llm/'),
  ('ai-basics','prompting','Prompt Engineering','intermediate',3,'https://www.geeksforgeeks.org/what-is-prompt-engineering/'),
  ('ai-basics','transformers','Transformers','advanced',1,'https://www.geeksforgeeks.org/getting-started-with-transformers/'),
  ('ai-basics','rag','RAG','advanced',2,'https://www.geeksforgeeks.org/what-is-retrieval-augmented-generation-rag/')
) AS x(track_slug, slug, title, level, idx, url) ON t.slug = x.track_slug;
