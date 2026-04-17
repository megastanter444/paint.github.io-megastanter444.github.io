document.addEventListener('DOMContentLoaded', () => {
    const optionsListTextarea = document.getElementById('options-list');
    const optionsDisplayList = document.getElementById('options-display-list');
    const addOptionBtn = document.getElementById('add-option-btn');
    const clearOptionsBtn = document.getElementById('clear-options-btn');
    const spinBtn = document.getElementById('spin-btn');
    const resultDisplay = document.getElementById('result-display');

    let options = []; // Массив для хранения вариантов

    // === Функции для работы с вариантами ===

    // Загрузка вариантов из localStorage при старте
    function loadOptions() {
        const savedOptions = localStorage.getItem('decisionHelperOptions');
        if (savedOptions) {
            options = JSON.parse(savedOptions);
            renderOptions();
        }
    }

    // Сохранение вариантов в localStorage
    function saveOptions() {
        localStorage.setItem('decisionHelperOptions', JSON.stringify(options));
    }

    // Отрисовка списка вариантов
    function renderOptions() {
        optionsDisplayList.innerHTML = ''; // Очищаем текущий список
        if (options.length === 0) {
            optionsDisplayList.innerHTML = '<li>Нет вариантов. Добавьте их выше.</li>';
            spinBtn.disabled = true; // Деактивируем кнопку "Крутить", если вариантов нет
            return;
        }

        options.forEach((option, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${option}</span>
                <button class="remove-option-btn" data-index="${index}">✖</button>
            `;
            optionsDisplayList.appendChild(li);
        });
        spinBtn.disabled = false; // Активируем кнопку "Крутить", если есть варианты
    }

    // Добавление варианта
    function addOption() {
        const newOptionText = optionsListTextarea.value.trim();
        if (newOptionText) {
            // Разделяем текст по переносам строк и добавляем каждый непустой вариант
            const newOptions = newOptionText.split('\n').map(opt => opt.trim()).filter(opt => opt);
            options.push(...newOptions);
            optionsListTextarea.value = ''; // Очищаем поле ввода
            renderOptions();
            saveOptions();
        }
    }

    // Удаление варианта
    function removeOption(index) {
        options.splice(index, 1);
        renderOptions();
        saveOptions();
    }

    // Очистка всех вариантов
    function clearOptions() {
        if (confirm('Вы уверены, что хотите удалить все варианты?')) {
            options = [];
            optionsListTextarea.value = '';
            renderOptions();
            saveOptions();
        }
    }

    // === Функция вращения рулетки ===
    function spinRoulette() {
        if (options.length === 0) return;

        // Сбрасываем результат и анимацию
        resultDisplay.classList.remove('visible');
        resultDisplay.textContent = 'Крутим...';
        spinBtn.disabled = true; // Блокируем кнопку во время вращения

        // Случайный выбор варианта
        const randomIndex = Math.floor(Math.random() * options.length);
        const selectedOption = options[randomIndex];

        // Имитация вращения (можно добавить более сложную анимацию)
        // Здесь просто ждем небольшую паузу перед показом результата
        setTimeout(() => {
            resultDisplay.textContent = selectedOption;
            resultDisplay.classList.add('visible');
            spinBtn.disabled = false; // Разблокируем кнопку
        }, 1500); // Пауза в 1.5 секунды
    }

    // === Обработчики событий ===

    // Добавление варианта по кнопке
    addOptionBtn.addEventListener('click', addOption);

    // Добавление варианта по нажатию Enter в textarea
    optionsListTextarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) { // Enter без Shift
            event.preventDefault(); // Предотвращаем перевод строки
            addOption();
        }
    });

    // Очистка всех вариантов
    clearOptionsBtn.addEventListener('click', clearOptions);

    // Удаление варианта при клике на кнопку "✖"
    optionsDisplayList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-option-btn')) {
            const index = parseInt(event.target.dataset.index);
            removeOption(index);
        }
    });

    // Запуск вращения рулетки
    spinBtn.addEventListener('click', spinRoulette);

    // === Инициализация ===
    loadOptions(); // Загружаем варианты при старте страницы
    renderOptions(); // Первоначальная отрисовка списка
});
