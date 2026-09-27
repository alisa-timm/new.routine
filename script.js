const TOTAL_DAYS = 75;
const DAYS_PER_WEEK = 7;

const TASKS = [
    "calories",
    "reading",
    "programming",
    "strength",
    "yoga"
];

const STORAGE_KEY = "newRoutineProgress";

let progress = loadProgress();
let currentWeek = null;

const weeksContainer = document.getElementById("weeks-container");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalButton = document.getElementById("close-modal");
const completeWeekButton = document.getElementById("complete-week");
const weekTitle = document.getElementById("week-title");
const taskInputs = document.querySelectorAll(".task input");

// ---------- Хранилище ----------

function createEmptyProgress() {
    const weeks = {};

    for (let week = 1; week <= Math.ceil(TOTAL_DAYS / DAYS_PER_WEEK); week++) {
        weeks[week] = {
            calories: false,
            reading: false,
            programming: false,
            strength: false,
            yoga: false
        };
    }

    return {
        days: {},
        weeks
    };
}

function loadProgress() {
    const empty = createEmptyProgress();

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return empty;
        }

        const parsed = JSON.parse(saved);

        // Загружаем состояние карточек дней
        if (parsed.days) {
            for (let day = 1; day <= TOTAL_DAYS; day++) {
                empty.days[day] = parsed.days[day] === true;
            }
        }

        // Загружаем состояние пунктов недель
        if (parsed.weeks) {
            for (const week in empty.weeks) {
                for (const task of TASKS) {
                    empty.weeks[week][task] =
                        parsed.weeks?.[week]?.[task] === true;
                }
            }
        }

        return empty;
    } catch (error) {
        console.warn("Не удалось загрузить сохранённый прогресс:", error);
        return empty;
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// ---------- Недели ----------

function isWeekComplete(weekNumber) {
    return TASKS.every(task => progress.weeks[weekNumber][task] === true);
}

function getWeekDays(weekNumber) {
    const firstDay = (weekNumber - 1) * DAYS_PER_WEEK + 1;
    const lastDay = Math.min(firstDay + DAYS_PER_WEEK - 1, TOTAL_DAYS);

    return { firstDay, lastDay };
}

// ---------- Карточки ----------

function toggleDay(day) {
    progress.days[day] = !progress.days[day];
    saveProgress();
    renderWeeks();
}

function renderWeeks() {
    weeksContainer.innerHTML = "";

    const totalWeeks = Math.ceil(TOTAL_DAYS / DAYS_PER_WEEK);

    for (let week = 1; week <= totalWeeks; week++) {
        const { firstDay, lastDay } = getWeekDays(week);

        const row = document.createElement("div");
        row.className = "week-row";

        if (lastDay - firstDay + 1 < DAYS_PER_WEEK) {
            row.classList.add("partial-week");
        }

        const daysGrid = document.createElement("div");
        daysGrid.className = "days-grid";

        for (let day = firstDay; day <= lastDay; day++) {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "day-card";

            if (progress.days[day]) {
                card.classList.add("day-complete");
            }

            card.setAttribute(
                "aria-label",
                `День ${day}. ${progress.days[day] ? "Выполнен" : "Не выполнен"}`
            );

            const number = document.createElement("span");
            number.className = "day-number";
            number.textContent = day;

            card.appendChild(number);

            card.addEventListener("click", () => toggleDay(day));

            daysGrid.appendChild(card);
        }

        // Заполняем оставшиеся места последней строки,
        // чтобы сетка всегда сохраняла ширину.
        for (let empty = lastDay + 1; empty <= firstDay + 6; empty++) {
            const placeholder = document.createElement("div");
            placeholder.setAttribute("aria-hidden", "true");
            daysGrid.appendChild(placeholder);
        }

        const arrow = document.createElement("button");
        arrow.className = "week-arrow";
        arrow.type = "button";
        arrow.innerHTML = "→";
        arrow.setAttribute("aria-label", `Открыть итоги недели ${week}`);

        arrow.addEventListener("click", () => openWeekModal(week));

        row.appendChild(daysGrid);
        row.appendChild(arrow);
        weeksContainer.appendChild(row);
    }
}

// ---------- Модальное окно ----------

function openWeekModal(weekNumber) {
    currentWeek = weekNumber;
    weekTitle.textContent = `Неделя ${weekNumber}`;

    taskInputs.forEach(input => {
        input.checked = progress.weeks[weekNumber][input.dataset.task];
    });

    modalOverlay.classList.add("is-open");
    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeWeekModal() {
    modalOverlay.classList.remove("is-open");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    currentWeek = null;
}

function updateCurrentWeekFromInputs() {
    if (!currentWeek) return;

    taskInputs.forEach(input => {
        progress.weeks[currentWeek][input.dataset.task] = input.checked;
    });

    saveProgress();
}

// Отдельные пункты недели
taskInputs.forEach(input => {
    input.addEventListener("change", updateCurrentWeekFromInputs);
});

// "Отметить всю неделю"
// Здесь отмечаются и все пункты недели, и все 7 карточек дней.
completeWeekButton.addEventListener("click", () => {
    if (!currentWeek) return;

    TASKS.forEach(task => {
        progress.weeks[currentWeek][task] = true;
    });

    const { firstDay, lastDay } = getWeekDays(currentWeek);

    for (let day = firstDay; day <= lastDay; day++) {
        progress.days[day] = true;
    }

    saveProgress();

    taskInputs.forEach(input => {
        input.checked = true;
    });

    renderWeeks();
});

// Закрытие
closeModalButton.addEventListener("click", closeWeekModal);

modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) {
        closeWeekModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && currentWeek !== null) {
        closeWeekModal();
    }
});

// Первый запуск
renderWeeks();
