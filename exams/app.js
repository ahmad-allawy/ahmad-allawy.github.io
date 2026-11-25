
const DATA_URL = "./questions.json";

const $ = (id) => document.getElementById(id);

const screens = [
  "welcomeScreen",
  "dashboardScreen",
  "quizScreen",
  "resultScreen",
  "reviewScreen"
];

let bank = null;
let studentName = "";
let activeQuestions = [];
let answers = [];
let currentIndex = 0;
let quizTitle = "";
let quizMode = "lesson";

const PASS_PERCENTAGE = 70;

// ==============================
// Load Questions
// ==============================

async function loadBank() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error("تعذر تحميل بنك الأسئلة");
    }

    bank = await response.json();

    if (!bank.lessons || !bank.questions) {
      throw new Error("تنسيق بنك الأسئلة غير صحيح");
    }

    renderLessons();

  } catch (error) {
    document.querySelector(".app-shell").insertAdjacentHTML(
      "beforeend",
      `<p class="load-error">
        حدث خطأ أثناء تحميل الأسئلة: ${error.message}
        تأكد من وجود questions.json بجانب index.html.
      </p>`
    );
  }
}

// ==============================
// Helpers
// ==============================

function showScreen(id) {
  screens.forEach(screen => {
    $(screen).classList.toggle("hidden", screen !== id);
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function toArabicNumber(number) {
  return String(number).replace(
    /\d/g,
    digit => "٠١٢٣٤٥٦٧٨٩"[digit]
  );
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// ==============================
// Lessons Dashboard
// ==============================

function renderLessons() {
  $("lessonCount").textContent =
    `${toArabicNumber(bank.lessons.length)} دروس`;

  $("randomCount").max = bank.questions.length;

  $("randomHint").textContent =
    `متاح من ١ إلى ${toArabicNumber(bank.questions.length)} سؤالاً`;

  $("lessonGrid").innerHTML = bank.lessons.map((lesson, index) => {
    const questionCount = bank.questions.filter(
      question => question.lessonId === lesson.id
    ).length;

    return `
      <button
        class="lesson-card"
        type="button"
        data-lesson="${escapeHTML(lesson.id)}"
      >
        <span class="lesson-number">
          LESSON ${toArabicNumber(index + 1).padStart(2, "0")}
        </span>

        <span class="lesson-symbol">
          ${["◈", "✧", "◉", "❖", "✦"][index % 5]}
        </span>

        <h4>${escapeHTML(lesson.title)}</h4>

        <p>
          ${toArabicNumber(questionCount)} أسئلة • بدون وقت
        </p>

        <span class="lesson-arrow">←</span>
      </button>
    `;
  }).join("");

  document.querySelectorAll("[data-lesson]").forEach(button => {
    button.addEventListener("click", () => {
      startLesson(button.dataset.lesson);
    });
  });
}

// ==============================
// Student Name
// ==============================

$("nameForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("studentName").value.trim();

  if (!name) return;

  studentName = name;

  $("displayName").textContent = name;
  $("avatarInitial").textContent = [...name][0];

  showScreen("dashboardScreen");
});

$("changeName").addEventListener("click", () => {
  $("studentName").value = studentName;
  showScreen("welcomeScreen");
});

// ==============================
// Random Quiz
// ==============================

$("randomForm").addEventListener("submit", event => {
  event.preventDefault();

  const count = Number($("randomCount").value);

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > bank.questions.length
  ) {
    $("randomHint").textContent =
      `أدخل رقماً من ١ إلى ${toArabicNumber(bank.questions.length)}`;

    return;
  }

  const questions = shuffleArray(bank.questions).slice(0, count);

  startQuiz(
    questions,
    `اختبار عشوائي • ${toArabicNumber(count)} سؤال`,
    "random"
  );
});

// ==============================
// Lesson Quiz
// ==============================

function startLesson(lessonId) {
  const lesson = bank.lessons.find(
    item => item.id === lessonId
  );

  if (!lesson) return;

  const questions = bank.questions.filter(
    question => question.lessonId === lessonId
  );

  if (!questions.length) {
    alert("لا توجد أسئلة في هذا الدرس حالياً.");
    return;
  }

  startQuiz(questions, lesson.title, "lesson");
}

// ==============================
// Start Quiz
// ==============================

function startQuiz(questions, title, mode) {
  if (!questions.length) return;

  activeQuestions = [...questions];

  answers = Array(activeQuestions.length).fill(null);

  currentIndex = 0;

  quizTitle = title;
  quizMode = mode;

  $("quizTitle").textContent = title;

  $("quizMode").textContent =
    mode === "random" ? "اختبار عشوائي" : "اختبار الدرس";

  // Reset previous result states
  $("resultCard").classList.remove("failed-result");

  $("retryBtn").classList.add("hidden");

  $("confetti").innerHTML = "";

  renderQuestion();

  showScreen("quizScreen");
}

// ==============================
// Render Question
// ==============================

function renderQuestion() {
  const question = activeQuestions[currentIndex];

  const answered = answers[currentIndex] !== null;

  $("progressText").textContent =
    `${toArabicNumber(currentIndex + 1)} / ${toArabicNumber(activeQuestions.length)}`;

  $("progressBar").style.width =
    `${(currentIndex / activeQuestions.length) * 100}%`;

  $("questionIndex").textContent =
    `السؤال ${toArabicNumber(currentIndex + 1)}`;

  $("questionType").textContent =
    question.type === "tf"
      ? "صح أم خطأ"
      : "اختيار من متعدد";

  $("questionPrompt").textContent = question.prompt;

  $("optionsList").innerHTML = question.options.map((option, index) => `
    <button
      class="option"
      type="button"
      data-option="${escapeHTML(option.id)}"
      ${answered ? "disabled" : ""}
    >
      <span class="option-letter">
        ${question.type === "tf"
      ? (index === 0 ? "✓" : "✕")
      : ["أ", "ب", "ج", "د", "هـ"][index]
    }
      </span>

      <span>${escapeHTML(option.text)}</span>
    </button>
  `).join("");

  document.querySelectorAll("[data-option]").forEach(button => {
    button.addEventListener("click", () => {
      selectAnswer(button.dataset.option);
    });
  });

  $("feedback").className = "feedback hidden";
  $("feedback").textContent = "";

  $("answerStatus").textContent =
    answered ? "تم تسجيل إجابتك" : "اختر إجابتك للمتابعة";

  $("nextQuestion").disabled = !answered;

  $("nextQuestion").textContent =
    currentIndex === activeQuestions.length - 1
      ? "عرض النتيجة ←"
      : "السؤال التالي ←";

  if (answered) {
    showAnswerState();
  }
}

// ==============================
// Answer Selection
// ==============================

function selectAnswer(optionId) {
  if (answers[currentIndex] !== null) return;

  answers[currentIndex] = optionId;

  showAnswerState();

  $("nextQuestion").disabled = false;

  $("answerStatus").textContent = "تم تسجيل إجابتك";
}

function showAnswerState() {
  const question = activeQuestions[currentIndex];

  const selected = answers[currentIndex];

  const correct = selected === question.correctOptionId;

  document.querySelectorAll("[data-option]").forEach(button => {
    button.disabled = true;

    if (button.dataset.option === question.correctOptionId) {
      button.classList.add("correct");
    } else if (button.dataset.option === selected) {
      button.classList.add("wrong");
    }
  });

  const feedback = $("feedback");

  feedback.className = `feedback ${correct ? "good" : "bad"}`;

  feedback.textContent = correct
    ? "إجابة صحيحة! أحسنت."
    : `إجابة غير صحيحة. الإجابة الصحيحة: ${question.options.find(
      option => option.id === question.correctOptionId
    ).text
    }`;

  if (question.explanation) {
    feedback.textContent += ` — ${question.explanation}`;
  }
}

// ==============================
// Next Question
// ==============================

$("nextQuestion").addEventListener("click", () => {
  if (answers[currentIndex] === null) return;

  if (currentIndex < activeQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
});

// ==============================
// Finish Quiz
// ==============================

function finishQuiz() {
  const correct = activeQuestions.filter(
    (question, index) =>
      answers[index] === question.correctOptionId
  ).length;

  const wrong = activeQuestions.length - correct;

  const percent = Math.round(
    (correct / activeQuestions.length) * 100
  );

  // Pass / Fail decision
  const passed = percent >= PASS_PERCENTAGE;

  // Update result card appearance
  $("resultCard").classList.toggle(
    "failed-result",
    !passed
  );

  // Icon
  $("resultIcon").textContent = passed ? "🏆" : "📚";

  // Result heading
  $("resultEyebrow").textContent = passed
    ? "أحسنت! اجتزت الاختبار بنجاح"
    : "لم تحقق درجة النجاح هذه المرة";

  // Greeting
  $("resultGreeting").textContent = passed
    ? `مبروك يا ${studentName}!`
    : `حاول مرة أخرى يا ${studentName}`;

  // Result message
  if (passed) {
    $("resultMessage").textContent =
      percent >= 90
        ? "إنجاز رائع! استمر في طلب العلم والعمل به."
        : "أحسنت! حققت درجة النجاح المطلوبة. واصل التعلم والتقدم.";
  } else {
    $("resultMessage").textContent =
      "درجة النجاح المطلوبة هي ٧٠٪. راجع إجاباتك وحاول الاختبار مرة أخرى، فأنت تستطيع!";
  }

  // Show retry button only if failed
  $("retryBtn").classList.toggle(
    "hidden",
    passed
  );

  // Score
  $("scorePercent").textContent =
    `${toArabicNumber(percent)}٪`;

  $("correctCount").textContent =
    toArabicNumber(correct);

  $("wrongCount").textContent =
    toArabicNumber(wrong);

  $("totalCount").textContent =
    toArabicNumber(activeQuestions.length);

  // Score circle
  const scoreColor = passed
    ? "var(--green)"
    : "#c47a50";

  $("scoreRing").style.background =
    `conic-gradient(${scoreColor} ${percent * 3.6}deg, #e9eee9 0deg)`;

  // Complete progress bar
  $("progressBar").style.width = "100%";

  // Display result
  $("confetti").innerHTML = "";

  showScreen("resultScreen");

  // Celebrate successful students only
  if (passed) {
    launchConfetti();
  }
}

// ==============================
// Retry Quiz
// ==============================

$("retryBtn").addEventListener("click", () => {
  if (!activeQuestions.length) return;

  // Same questions, randomized order, fresh answers
  const retryQuestions = shuffleArray(activeQuestions);

  startQuiz(
    retryQuestions,
    quizTitle,
    quizMode
  );
});

// ==============================
// Confetti Animation
// ==============================

function launchConfetti() {
  const host = $("confetti");

  host.innerHTML = "";

  const colors = [
    "#176b54",
    "#d6a94f",
    "#8ebd9c",
    "#e5a1a1",
    "#8aa7c2"
  ];

  for (let i = 0; i < 75; i++) {
    const piece = document.createElement("i");

    piece.className = "confetti-piece";

    piece.style.left = `${Math.random() * 100}%`;

    piece.style.background =
      colors[i % colors.length];

    piece.style.animationDuration =
      `${2 + Math.random() * 2.5}s`;

    piece.style.animationDelay =
      `${Math.random() * 0.8}s`;

    piece.style.transform =
      `rotate(${Math.random() * 180}deg)`;

    host.appendChild(piece);
  }
}

// ==============================
// Navigation
// ==============================

$("homeBtn").addEventListener("click", () => {
  $("confetti").innerHTML = "";
  showScreen("dashboardScreen");
});

$("exitQuiz").addEventListener("click", () => {
  if (
    confirm("هل تريد الخروج؟ ستفقد تقدمك في الاختبار الحالي.")
  ) {
    showScreen("dashboardScreen");
  }
});

// ==============================
// Review Answers
// ==============================

$("reviewBtn").addEventListener("click", () => {
  $("reviewList").innerHTML = activeQuestions.map(
    (question, index) => {

      const right = question.options.find(
        option => option.id === question.correctOptionId
      ).text;

      const chosen = question.options.find(
        option => option.id === answers[index]
      )?.text;

      const good =
        answers[index] === question.correctOptionId;

      return `
        <article class="review-item">

          <h4>
            ${toArabicNumber(index + 1)}.
            ${escapeHTML(question.prompt)}
          </h4>

          <p class="${good ? "right-answer" : "your-wrong"}">
            إجابتك:
            ${escapeHTML(chosen || "لم تتم الإجابة")}
          </p>

          ${good
          ? ""
          : `
                <p class="right-answer">
                  الإجابة الصحيحة: ${escapeHTML(right)}
                </p>
              `
        }

          ${question.explanation
          ? `<p>توضيح: ${escapeHTML(question.explanation)}</p>`
          : ""
        }

        </article>
      `;
    }
  ).join("");

  showScreen("reviewScreen");
});

$("backToResult").addEventListener("click", () => {
  showScreen("resultScreen");
});

// ==============================
// Initialize
// ==============================

loadBank();
