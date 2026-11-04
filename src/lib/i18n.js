/* ---------------------------------------------------------------------------
   i18n.js — lightweight, dependency-free translation system.

   Supported interface languages: English ("en", default) and Arabic ("ar").
   All user-facing strings live here so components never hardcode English text.

   Usage:
     import { t, setLang, getLang, isRTL, initLang } from "./lib/i18n";
     t("welcome.title");              // "Welcome back"
     setLang("ar");                   // switches language, persists to localStorage
     isRTL();                         // true when Arabic is active

   Missing keys fall back to English. Unknown keys return the key itself.
   --------------------------------------------------------------------------- */

const LANG_KEY = "studyai-lang";
const SUPPORTED = ["en", "ar"];

const translations = {
  en: {
    /* --- Navigation --- */
    "nav.dashboard": "Dashboard",
    "nav.subjects": "Subjects",
    "nav.progress": "Progress",
    "nav.profile": "Profile",
    /* --- Auth / Onboarding --- */
    "auth.log_in": "Log in",
    "auth.welcome_back": "Welcome back — pick up where you left off.",
    "auth.create_account": "Create your account",
    "auth.start_turning": "Start turning your materials into study tools.",
    "auth.full_name": "Full Name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirm_password": "Confirm Password",
    "auth.dont_have_account": "Don't have an account?",
    "auth.create_one": "Create one",
    "auth.already_have_account": "Already have an account?",
    "auth.log_in_short": "Log in",
    "auth.please_fill_every_field": "Please fill in every field.",
    "auth.please_enter_valid_email": "Please enter a valid email address.",
    "auth.password_must_be_at_least_8": "Password must be at least 8 characters.",
    "auth.password_and_confirm_dont_match": "Password and Confirm Password don't match.",
    "auth.logging_in": "Logging in…",
    "auth.log_in_btn": "Log In",
    "auth.creating_account": "Creating account…",
    "auth.create_account_btn": "Create Account",
    "auth.could_not_log_in": "Could not log you in. Please try again.",
    "auth.could_not_create_account": "Could not create your account. Please try again.",
    "auth.session_expired": "Your session has expired. Please log in again.",
    /* --- Onboarding --- */
    "onboarding.title": "Let's personalize your StudyAI experience",
    "onboarding.subtitle": "Just a couple of quick questions to get started.",
    "onboarding.what_are_you_studying": "What are you studying?",
    "onboarding.subject_placeholder": "e.g. Biology, Web Development, French",
    "onboarding.what_is_your_study_level": "What is your study level?",
    "onboarding.saving": "Saving…",
    "onboarding.continue": "Continue to StudyAI",
    "onboarding.could_not_save": "Could not save your preferences. Please try again.",
    /* --- Landing --- */
    "landing.title": "Turn Your Study Materials Into Smarter Learning",
    "landing.subtitle": "StudyAI turns the PDFs you already have into summaries, quizzes, and flashcards — so you spend less time organizing and more time actually studying.",
    "landing.get_started": "Get Started",
    "landing.log_in": "Log In",
    "landing.feature_summaries_title": "AI Summaries",
    "landing.feature_summaries_desc": "Turn long readings into clear, focused summaries you can review in minutes.",
    "landing.feature_quizzes_title": "Interactive Quizzes",
    "landing.feature_quizzes_desc": "Test what you know with multiple-choice questions built from your materials.",
    "landing.feature_flashcards_title": "Smart Flashcards",
    "landing.feature_flashcards_desc": "Flip through question-and-answer cards to lock in the key facts.",
    "landing.feature_progress_title": "Progress Tracking",
    "landing.feature_progress_desc": "See how far along each subject is, at a glance, across every material.",
    "landing.copyright": "© {year} StudyAI. Made for students who'd rather be studying.",
    /* --- Dashboard --- */
    "dashboard.welcome_back": "Welcome back{name} 👋",
    "dashboard.your_study_space": "Your study space, powered by AI.",
    "dashboard.create_subject": "Create Subject",
    "dashboard.total_subjects": "Total Subjects",
    "dashboard.total_materials": "Total Materials",
    "dashboard.completed_materials": "Completed Materials",
    "dashboard.overall_progress": "Overall Progress",
    "dashboard.recent_subjects": "Recent Subjects",
    "dashboard.create_first_subject": "Create your first subject",
    "dashboard.empty_desc": "Subjects are where your materials, summaries, quizzes, and flashcards will live. Create one to get started.",
    "dashboard.could_not_create_subject": "Could not create the subject. Please try again.",
    /* --- Subjects --- */
    "subjects.title": "Subjects",
    "subjects.subtitle": "Everything you're studying, in one place.",
    "subjects.create_subject": "Create Subject",
    "subjects.no_subjects_yet": "No subjects yet",
    "subjects.empty_desc": "Create a subject to start uploading materials and generating summaries, quizzes, and flashcards.",
    "subjects.delete_confirm": 'Delete "{name}"? This can\'t be undone.',
    "subjects.could_not_delete_subject": "Could not delete the subject. Please try again.",
    /* --- Subject Details --- */
    "details.back_to_subjects": "← Back to Subjects",
    "details.no_description_yet": "No description yet.",
    "details.upload_material": "Upload Material",
    "details.uploading": "Uploading…",
    "details.uploaded_on": "Uploaded",
    "details.only_pdf_files": "Only PDF files are supported.",
    "details.file_is_too_large": "File is too large. Maximum is {max} MB.",
    "details.upload_failed": "Upload failed. Please check the file and try again.",
    "details.this_subject_could_not_be_found": "This subject could not be found.",
    "details.this_pdf_could_not_be_processed": "This PDF could not be processed.",
    "details.try_re_uploading": "Try re-uploading a text-based PDF.",
    "details.processing": "Processing…",
    "details.ai_resources_unlock": "AI resources unlock once the PDF is ready.",
    "details.loading_materials": "Loading materials…",
    "details.could_not_load_subject": "Could not load this subject. Please try again.",
    "details.try_again": "Try again",
    "details.materials": "Materials",
    "details.no_study_materials_yet": "No study materials yet",
    "details.upload_a_pdf": "Upload a PDF to start learning.",
    "details.select_a_material": "Select a material",
    "details.select_a_material_desc": "Choose a material from the list above to see its preview and open its Summary, Quiz, or Flashcards.",
    "details.material_preview": "Material Preview",
    "details.pdf": "PDF",
    "details.processed_and_ready": "Processed and ready — generate a summary, quiz, or flashcards below.",
    "details.generate_summary": "Generate Summary",
    "details.generate_quiz": "Generate Quiz",
    "details.flashcards": "Flashcards",
    "details.study_videos": "Study Videos",
    "details.this_material_couldnt_be_processed": "This material couldn't be processed, so AI resources aren't available.",
    "details.delete_material_confirm": 'Delete "{filename}"? This can\'t be undone.',
    "details.could_not_delete_material": "Could not delete the material. Please try again.",
    /* --- Stats --- */
    "stats.materials": "Materials",
    "stats.in_progress": "In progress",
    "stats.materials_completed": "Materials completed",
    /* --- Study Videos --- */
    "study_videos.heading": "Study Videos",
    "study_videos.no_results": "No verified video results yet",
    "study_videos.no_results_desc": "Search YouTube for lessons related to this material. StudyAI doesn't invent video results or IDs.",
    "study_videos.search_suggestion_label": "Search suggestion",
    "study_videos.add_title": "Add a material title to create a useful YouTube search.",
    "study_videos.watch_on_youtube": "Watch on YouTube",
    /* --- Subject Card --- */
    "subject_card.tap_to_open": "Tap to open this subject",
    /* --- Create Subject Modal --- */
    "create_subject.title": "Create Subject",
    "create_subject.name": "Subject name",
    "create_subject.description": "Short description",
    "create_subject.name_placeholder": "e.g. Cell Biology",
    "create_subject.description_placeholder": "What is this subject about?",
    /* --- Summary --- */
    "summary.summary": "Summary",
    "summary.checking_for_saved_summary": "Checking for a saved summary…",
    "summary.click_generate_summary": "Click Generate Summary to create a summary of this material.",
    "summary.generating": "Generating…",
    "summary.regenerate_summary": "Regenerate Summary",
    "summary.generate_summary": "Generate Summary",
    "summary.summary_generation_failed": "Summary generation failed. Please try again.",
    /* --- Quiz --- */
    "quiz.quiz": "Quiz",
    "quiz.checking_for_saved_quiz": "Checking for a saved quiz…",
    "quiz.latest_score": "Latest Score: {score}/{total}",
    "quiz.click_generate_quiz": "Click Generate Quiz to create a quiz from this material.",
    "quiz.generating_your_quiz": "Generating your quiz… this can take a moment.",
    "quiz.generate_quiz": "Generate Quiz",
    "quiz.question_{n}_of_{total}": "Question {n} of {total}",
    "quiz.finish": "Finish",
    "quiz.next": "Next",
    "quiz.try_again": "Try Again",
    "quiz.could_not_submit": "Could not submit your answers. Please try again.",
    "quiz.nice_work": "Nice work — review the explanations below and try again anytime.",
    "quiz.you_chose": "You chose",
    "quiz.correct_answer": "correct answer",
    "quiz.scoring": "Scoring…",
    /* --- Flashcards --- */
    "flashcards.flashcards": "Flashcards",
    "flashcards.checking_for_saved_flashcards": "Checking for saved flashcards…",
    "flashcards.creating_your_flashcards": "Creating your flashcards…",
    "flashcards.click_generate_flashcards": "Click Generate Flashcards to create a set from this material.",
    "flashcards.generate_flashcards": "Generate Flashcards",
    "flashcards.card_{n}_of_{total}": "Card {n} of {total}",
    "flashcards.question": "Question",
    "flashcards.answer": "Answer",
    "flashcards.click_to_flip": "Click to flip",
    "flashcards.previous": "Previous",
    "flashcards.next": "Next",
    "flashcards.regenerate_flashcards": "Regenerate flashcards",
    "flashcards.flashcard_generation_failed": "Flashcard generation failed. Please try again.",
    /* --- Progress --- */
    "progress.progress": "Progress",
    "progress.loading_your_progress": "Loading your progress…",
    "progress.how_your_studying_is_going": "How your studying is going, across every subject.",
    "progress.subjects": "Subjects",
    "progress.materials": "Materials",
    "progress.completed": "Completed",
    "progress.quiz_attempts": "Quiz Attempts",
    "progress.avg_quiz_score": "Avg. Quiz Score",
    "progress.by_subject": "By Subject",
    "progress.nothing_to_track_yet": "Nothing to track yet",
    "progress.empty_desc": "Create a subject and upload a material to start building progress.",
    "progress.complete": "complete",
    "progress.attempt": "attempt",
    "progress.attempts": "attempts",
    /* --- Profile & Settings --- */
    "profile.profile_settings": "Profile & Settings",
    "profile.manage_your_account": "Manage your account and how StudyAI looks.",
    "profile.profile": "Profile",
    "profile.full_name": "Full Name",
    "profile.email": "Email",
    "profile.study_level": "Study Level",
    "profile.what_are_you_studying": "What are you studying?",
    "profile.saving": "Saving…",
    "profile.save_changes": "Save Changes",
    "profile.changes_saved": "Changes saved.",
    "profile.could_not_save_changes": "Could not save your changes. Please try again.",
    "profile.full_name_cant_be_empty": "Full Name can't be empty.",
    "profile.settings": "Settings",
    "profile.appearance": "Appearance",
    "profile.light_mode": "Light Mode",
    "profile.dark_mode": "Dark Mode",
    "profile.account": "Account",
    "profile.logout": "Logout",
    "profile.language": "Interface Language",
    "profile.language_desc": "Change the language of the app interface.",
    "profile.english": "English",
    "profile.arabic": "العربية",
    "profile.ai_content_language": "AI Content Language",
    "profile.ai_content_language_desc": "Choose the language for AI-generated summaries, quizzes, and flashcards.",
    /* --- Common --- */
    "common.log_out": "Log Out",
    "common.cancel": "Cancel",
    "common.create": "Create",
    "common.try_again": "Try again",
    "common.loading": "Loading…",
    "common.back": "Back",
    "common.delete": "Delete",
    "common.search_youtube": "Search YouTube",
    /* --- Voice --- */
    "voice.listen": "Listen",
    "voice.pause": "Pause",
    "voice.resume": "Resume",
    "voice.stop": "Stop",
    "voice.speaking": "Speaking",
    "voice.paused": "Paused",
  },
  ar: {
    /* --- Navigation --- */
    "nav.dashboard": "لوحة التحكم",
    "nav.subjects": "المواد",
    "nav.progress": "التقدم",
    "nav.profile": "الملف الشخصي",
    /* --- Auth / Onboarding --- */
    "auth.log_in": "تسجيل الدخول",
    "auth.welcome_back": "مرحباً بعودتك — استأنف من حيث توقفت.",
    "auth.create_account": "إنشاء حسابك",
    "auth.start_turning": "ابدأ في تحويل موادك الدراسية إلى أدوات دراسة.",
    "auth.full_name": "الاسم الكامل",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.confirm_password": "تأكيد كلمة المرور",
    "auth.dont_have_account": "ليس لديك حساب؟",
    "auth.create_one": "إنشاء واحد",
    "auth.already_have_account": "لديك حساب بالفعل؟",
    "auth.log_in_short": "تسجيل الدخول",
    "auth.please_fill_every_field": "يرجى تعبئة كل الحقول.",
    "auth.please_enter_valid_email": "يرجى إدخال بريد إلكتروني صالح.",
    "auth.password_must_be_at_least_8": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    "auth.password_and_confirm_dont_match": "كلمة المرور وتأكيد كلمة المرور غير متطابقتين.",
    "auth.logging_in": "جاري تسجيل الدخول…",
    "auth.log_in_btn": "تسجيل الدخول",
    "auth.creating_account": "جاري إنشاء الحساب…",
    "auth.create_account_btn": "إنشاء حساب",
    "auth.could_not_log_in": "تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.",
    "auth.could_not_create_account": "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
    "auth.session_expired": "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.",
    /* --- Onboarding --- */
    "onboarding.title": "دعونا نخصص تجربتك في StudyAI",
    "onboarding.subtitle": "أسئلة سريعة قليلة للبدء.",
    "onboarding.what_are_you_studying": "ماذا تدرس؟",
    "onboarding.subject_placeholder": "مثال: الأحياء، تطوير الويب، الفرنسية",
    "onboarding.what_is_your_study_level": "ما هو مستوى دراستك؟",
    "onboarding.saving": "جاري الحفظ…",
    "onboarding.continue": "المتابعة إلى StudyAI",
    "onboarding.could_not_save": "تعذر حفظ تفضيلاتك. يرجى المحاولة مرة أخرى.",
    /* --- Landing --- */
    "landing.title": "حول موادك الدراسية إلى تعلم أكثر ذكاءً",
    "landing.subtitle": "يحول StudyAI ملفات PDF التي لديك بالفعل إلى ملخصات واختبارات وبطاقات تعليمية — لتقضي وقتًا أقل في التنظيم ووقتًا أطول في الدراسة الفعلية.",
    "landing.get_started": "ابدأ",
    "landing.log_in": "تسجيل الدخول",
    "landing.feature_summaries_title": "الملخصات بالذكاء الاصطناعي",
    "landing.feature_summaries_desc": "حوّل القراءات الطويلة إلى ملخصات واضحة وموجهة يمكنك مراجعتها في دقائق.",
    "landing.feature_quizzes_title": "اختبارات تفاعلية",
    "landing.feature_quizzes_desc": "اختبر ما تعرفه بأسئلة متعددة الخيارات مبنية على موادك.",
    "landing.feature_flashcards_title": "بطاقات تعليمية ذكية",
    "landing.feature_flashcards_desc": "اقلب البطاقات 질문 وجواب لتثبيت الحقائق الأساسية.",
    "landing.feature_progress_title": "تتبع التقدم",
    "landing.feature_progress_desc": "انظر إلى مدى تقدم كل مادة، من النظرة الأولى، عبر كل المواد.",
    "landing.copyright": "© {year} StudyAI. مصنوعة للطلاب الذين يفضلون الدراسة.",
    /* --- Dashboard --- */
    "dashboard.welcome_back": "أهلاً بعودتك{name} 👋",
    "dashboard.your_study_space": "مساحة دراستك، مدعومة بالذكاء الاصطناعي.",
    "dashboard.create_subject": "إنشاء مادة",
    "dashboard.total_subjects": "إجمالي المواد",
    "dashboard.total_materials": "إجمالي المصادر",
    "dashboard.completed_materials": "المصادر المكتملة",
    "dashboard.overall_progress": "التقدم الإجمالي",
    "dashboard.recent_subjects": "المواد الحديثة",
    "dashboard.create_first_subject": "إنشاء المادة الأولى",
    "dashboard.empty_desc": "المواد هي حيث ستعيش مصادرك وملخصاتك واختباراتك وبطاقاتك التعليمية. أنشئ واحدة للبدء.",
    "dashboard.could_not_create_subject": "تعذر إنشاء المادة. يرجى المحاولة مرة أخرى.",
    /* --- Subjects --- */
    "subjects.title": "المواد",
    "subjects.subtitle": "كل ما تدرسه في مكان واحد.",
    "subjects.create_subject": "إنشاء مادة",
    "subjects.no_subjects_yet": "لا توجد مواد بعد",
    "subjects.empty_desc": "أنشئ مادة لبدء تحميل المصادر وإنشاء الملخصات والاختبارات والبطاقات التعليمية.",
    "subjects.delete_confirm": 'حذف "{name}"؟ لا يمكن التراجع عن هذا.',
    "subjects.could_not_delete_subject": "تعذر حذف المادة. يرجى المحاولة مرة أخرى.",
    /* --- Subject Details --- */
    "details.back_to_subjects": "← العودة إلى المواد",
    "details.no_description_yet": "لا يوجد وصف بعد.",
    "details.upload_material": "تحميل مصدر",
    "details.uploading": "جاري التحميل…",
    "details.uploaded_on": "تم التحميل",
    "details.only_pdf_files": "ملفات PDF فقط مدعومة.",
    "details.file_is_too_large": "الملف كبير جدًا. الحد الأقصى هو {max} ميغابايت.",
    "details.upload_failed": "فشل التحميل. يرجى التحقق من الملف والمحاولة مرة أخرى.",
    "details.this_subject_could_not_be_found": "تعذر العثور على هذه المادة.",
    "details.this_pdf_could_not_be_processed": "تعذر معالجة ملف PDF هذا.",
    "details.try_re_uploading": "حاول إعادة تحميل ملف PDF نصي.",
    "details.processing": "جاري المعالجة…",
    "details.ai_resources_unlock": "تفتح مصادر الذكاء الاصطناعي بمجرد أن يصبح ملف PDF جاهزًا.",
    "details.loading_materials": "جاري تحميل المصادر…",
    "details.could_not_load_subject": "تعذر تحميل هذه المادة. يرجى المحاولة مرة أخرى.",
    "details.try_again": "حاول مرة أخرى",
    "details.materials": "المصادر",
    "details.no_study_materials_yet": "لا توجد مصادر دراسية بعد",
    "details.upload_a_pdf": "حمل ملف PDF لبدء التعلم.",
    "details.select_a_material": "اختر مصدرًا",
    "details.select_a_material_desc": "اختر مصدرًا من القائمة أعلاه لعرض معاينته وفتح الملخص أو الاختبار أو البطاقات التعليمية.",
    "details.material_preview": "معاينة المصدر",
    "details.pdf": "PDF",
    "details.processed_and_ready": "تمت المعالجة وهو جاهز — أنشئ ملخصًا أو اختبارًا أو بطاقات تعليمية أدناه.",
    "details.generate_summary": "إنشاء ملخص",
    "details.generate_quiz": "إنشاء اختبار",
    "details.flashcards": "بطاقات تعليمية",
    "details.study_videos": "فيديوهات دراسية",
    "details.this_material_couldnt_be_processed": "لم تتم معالجة هذا المصدر، لذا مصادر الذكاء الاصطناعي غير متاحة.",
    "details.delete_material_confirm": 'حذف "{filename}"؟ لا يمكن التراجع عن هذا.',
    "details.could_not_delete_material": "تعذر حذف المصدر. يرجى المحاولة مرة أخرى.",
    /* --- Stats --- */
    "stats.materials": "المصادر",
    "stats.in_progress": "قيد التنفيذ",
    "stats.materials_completed": "المصادر المكتملة",
    /* --- Study Videos --- */
    "study_videos.heading": "فيديوهات دراسية",
    "study_videos.no_results": "لا توجد نتائج فيديو مؤكدة بعد",
    "study_videos.no_results_desc": "ابحث على يوتيوب عن دروس متعلقة بهذا المصدر. لا يخترع StudyAI نتائج فيديو أو معرفات.",
    "study_videos.search_suggestion_label": "اقتراح بحث",
    "study_videos.add_title": "أضف عنوان المصدر لإنشاء بحث مفيد على يوتيوب.",
    "study_videos.watch_on_youtube": "مشاهدة على يوتيوب",
    /* --- Subject Card --- */
    "subject_card.tap_to_open": "انقر لفتح هذه المادة",
    /* --- Create Subject Modal --- */
    "create_subject.title": "إنشاء مادة",
    "create_subject.name": "اسم المادة",
    "create_subject.description": "وصف قصير",
    "create_subject.name_placeholder": "مثال: الأحياء الخلوية",
    "create_subject.description_placeholder": "ما الذي تدور حوله هذه المادة؟",
    /* --- Summary --- */
    "summary.summary": "الملخص",
    "summary.checking_for_saved_summary": "جاري التحقق من وجود ملخص محفوظ…",
    "summary.click_generate_summary": "انقر على إنشاء ملخص لإنشاء ملخص لهذا المصدر.",
    "summary.generating": "جاري الإنشاء…",
    "summary.regenerate_summary": "إعادة إنشاء الملخص",
    "summary.generate_summary": "إنشاء ملخص",
    "summary.summary_generation_failed": "فشل إنشاء الملخص. يرجى المحاولة مرة أخرى.",
    /* --- Quiz --- */
    "quiz.quiz": "الاختبار",
    "quiz.checking_for_saved_quiz": "جاري التحقق من وجود اختبار محفوظ…",
    "quiz.latest_score": "آخر نتيجة: {score}/{total}",
    "quiz.click_generate_quiz": "انقر على إنشاء اختبار لإنشاء اختبار من هذا المصدر.",
    "quiz.generating_your_quiz": "جاري إنشاء اختبارك… قد يستغرق ذلك لحظة.",
    "quiz.generate_quiz": "إنشاء اختبار",
    "quiz.question_{n}_of_{total}": "السؤال {n} من {total}",
    "quiz.finish": "إنهاء",
    "quiz.next": "التالي",
    "quiz.try_again": "حاول مرة أخرى",
    "quiz.could_not_submit": "تعذر إرسال إجاباتك. يرجى المحاولة مرة أخرى.",
    "quiz.nice_work": "عمل جيد — راجع الشرح أدناه وحاول مرة أخرى في أي وقت.",
    "quiz.you_chose": "اخترت",
    "quiz.correct_answer": "الإجابة الصحيحة",
    "quiz.scoring": "جاري التصحيح…",
    /* --- Flashcards --- */
    "flashcards.flashcards": "البطاقات التعليمية",
    "flashcards.checking_for_saved_flashcards": "جاري التحقق من وجود بطاقات تعليمية محفوظة…",
    "flashcards.creating_your_flashcards": "جاري إنشاء بطاقاتك التعليمية…",
    "flashcards.click_generate_flashcards": "انقر على إنشاء بطاقات تعليمية لإنشاء مجموعة من هذا المصدر.",
    "flashcards.generate_flashcards": "إنشاء بطاقات تعليمية",
    "flashcards.card_{n}_of_{total}": "البطاقة {n} من {total}",
    "flashcards.question": "السؤال",
    "flashcards.answer": "الإجابة",
    "flashcards.click_to_flip": "انقر للقلب",
    "flashcards.previous": "السابق",
    "flashcards.next": "التالي",
    "flashcards.regenerate_flashcards": "إعادة إنشاء البطاقات التعليمية",
    "flashcards.flashcard_generation_failed": "فشل إنشاء البطاقات التعليمية. يرجى المحاولة مرة أخرى.",
    /* --- Progress --- */
    "progress.progress": "التقدم",
    "progress.loading_your_progress": "جاري تحميل تقدمك…",
    "progress.how_your_studying_is_going": "كيف يسير دراستك، عبر كل المواد.",
    "progress.subjects": "المواد",
    "progress.materials": "المصادر",
    "progress.completed": "مكتملة",
    "progress.quiz_attempts": "محاولات الاختبار",
    "progress.avg_quiz_score": "متوسط نتيجة الاختبار",
    "progress.by_subject": "حسب المادة",
    "progress.nothing_to_track_yet": "لا شيء لتتبعه بعد",
    "progress.empty_desc": "أنشئ مادة وقم بتحميل مصدر لبدء تتبع التقدم.",
    "progress.complete": "مكتمل",
    "progress.attempt": "محاولة",
    "progress.attempts": "محاولات",
    /* --- Profile & Settings --- */
    "profile.profile_settings": "الملف الشخصي والإعدادات",
    "profile.manage_your_account": "إدارة حسابك ومظهر StudyAI.",
    "profile.profile": "الملف الشخصي",
    "profile.full_name": "الاسم الكامل",
    "profile.email": "البريد الإلكتروني",
    "profile.study_level": "مستوى الدراسة",
    "profile.what_are_you_studying": "ماذا تدرس؟",
    "profile.saving": "جاري الحفظ…",
    "profile.save_changes": "حفظ التغييرات",
    "profile.changes_saved": "تم حفظ التغييرات.",
    "profile.could_not_save_changes": "تعذر حفظ تغييراتك. يرجى المحاولة مرة أخرى.",
    "profile.full_name_cant_be_empty": "لا يمكن أن يكون الاسم الكامل فارغًا.",
    "profile.settings": "الإعدادات",
    "profile.appearance": "المظهر",
    "profile.light_mode": "الوضع الفاتح",
    "profile.dark_mode": "الوضع الداكن",
    "profile.account": "الحساب",
    "profile.logout": "تسجيل الخروج",
    "profile.language": "لغة واجهة المستخدم",
    "profile.language_desc": "غير لغة واجهة التطبيق.",
    "profile.english": "الإنجليزية",
    "profile.arabic": "العربية",
    "profile.ai_content_language": "لغة محتوى الذكاء الاصطناعي",
    "profile.ai_content_language_desc": "اختر لغة الملخصات والاختبارات والبطاقات التعليمية التي ينشئها الذكاء الاصطناعي.",
    /* --- Common --- */
    "common.log_out": "تسجيل الخروج",
    "common.cancel": "إلغاء",
    "common.create": "إنشاء",
    "common.try_again": "حاول مرة أخرى",
    "common.loading": "جاري التحميل…",
    "common.back": "العودة",
    "common.delete": "حذف",
    "common.search_youtube": "ابحث على يوتيوب",
    /* --- Voice --- */
    "voice.listen": "استمع",
    "voice.pause": "إيقاف مؤقت",
    "voice.resume": "استئناف",
    "voice.stop": "إيقاف",
    "voice.speaking": "جاري التحدث",
    "voice.paused": "مؤقت",
  },
};

let currentLang = "en";

export function getLang() {
  return currentLang;
}

export function isRTL() {
  return currentLang === "ar";
}

export function initLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED.includes(saved)) {
      currentLang = saved;
    } else {
      currentLang = "en";
    }
  } catch {
    currentLang = "en";
  }
  return currentLang;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // best effort
  }
  // Apply RTL direction to the document root
  const root = document.documentElement;
  if (lang === "ar") {
    root.setAttribute("dir", "rtl");
    root.setAttribute("lang", "ar");
  } else {
    root.setAttribute("dir", "ltr");
    root.setAttribute("lang", "en");
  }
}

export function t(key, params = {}) {
  const langMap = translations[currentLang];
  const fallbackMap = translations.en;

  let text =
    (langMap && langMap[key]) ||
    (fallbackMap && fallbackMap[key]) ||
    key;

  // Replace {name}, {year}, etc. with params
  text = text.replace(/\{(\w+)\}/g, (_match, paramName) => {
    return params[paramName] !== undefined ? params[paramName] : `{${paramName}}`;
  });

  return text;
}
