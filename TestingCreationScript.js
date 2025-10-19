testingUrl = "paste testing url"

class Test {
    constructor(question, correctAnswer, incorrectAnswers) {
        this.question = question;
        this.correctAnswer = correctAnswer;
        this.incorrectAnswers = incorrectAnswers;
    }
}

async function loadTestsFromJSON(url) {
    const res = await fetch(url);
    const data = await res.json();
    return data.map(t => new Test(t.question, t.correctAnswer, t.incorrectAnswers));
}

const tests = await loadTestsFromJSON(testingUrl);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForSelector(selector, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector);
        if (el) return el;
        await sleep(200);
    }
    throw new Error("⏰ Не дождались элемента: " + selector);
}

async function waitForClickable(selector, timeout = 10000) {
    const el = await waitForSelector(selector, timeout);
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden') return el;
        await sleep(200);
    }
    throw new Error("🚫 Элемент не кликабелен: " + selector);
}

function safeClick(el) {
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

async function createTests(tests) {
    console.log("🚀 Запуск автоматического создания тестов...");
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`\n📘 [${i + 1}/${tests.length}] Начало создания вопроса: "${test.question}"`);

        const addBtn = await waitForClickable('[data-testid="add-option-button"]');
        console.log("➕ Добавляем пятый вариант ответа...");
        safeClick(addBtn);
        await sleep(700);

        const fields = document.querySelectorAll('[data-testid="tiptap-mini-editor-content"]>div>p');
        if (fields.length < 6) {
            console.error("❌ Ошибка: найдено полей " + fields.length + ", ожидалось 6");
            return;
        }

        console.log("✏️ Заполняем поля...");
        fields[0].innerText = test.question;
        fields[1].innerText = test.correctAnswer;
        for (let j = 0; j < test.incorrectAnswers.length; j++) {
            fields[j + 2].innerText = test.incorrectAnswers[j];
        }

        console.log("⏳ Ожидание обновления интерфейса...");
        await sleep(1500);

        console.log("✅ Отмечаем правильный ответ...");
        const correctBtn = await waitForClickable('[data-testid="mcq-editor-mark-answer-0-button"]');
        safeClick(correctBtn);
        await sleep(1000);

        console.log("💾 Сохраняем вопрос...");
        const saveBtn = await waitForClickable('[data-testid="save-question-button"]');
        safeClick(saveBtn);

        console.log("⏳ Ожидание возврата к списку вопросов...");
        await waitForClickable('[data-testid="create-new-question-button"]', 15000);
        console.log("📄 Возврат подтверждён.");

        if (i < tests.length - 1) {
            console.log("🆕 Переходим к созданию следующего вопроса...");
            safeClick(document.querySelector('[data-testid="create-new-question-button"]'));
            await waitForClickable('[data-testid="create-question-type-MCQ"]');
            safeClick(document.querySelector('[data-testid="create-question-type-MCQ"]'));
            await sleep(1500);
        }

        console.log(`✅ Вопрос [${i + 1}] успешно создан.`);
        await sleep(400);
    }

    console.log("\n🎉 Все тесты успешно добавлены!");
}

createTests(tests);
