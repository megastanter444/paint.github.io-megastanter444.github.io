document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // === Переменные состояния ===
    let isDrawing = false;
    let currentTool = 'pencil'; // Инструмент по умолчанию
    let mainColor = '#000000'; // Основной цвет по умолчанию
    let secondaryColor = '#ffffff'; // Дополнительный цвет по умолчанию
    let lineWidth = 5; // Толщина линии по умолчанию
    let startX, startY, lastX, lastY; // Координаты для рисования
    let history = []; // История действий для Undo/Redo
    let historyIndex = -1; // Текущий индекс в истории
    let isTextMode = false; // Режим ввода текста
    let textInputActive = false; // Активно ли поле ввода текста

    // === Элементы DOM ===
    const newFileBtn = document.getElementById('new-file');
    const openFileBtn = document.getElementById('open-file');
    const saveFileBtn = document.getElementById('save-file');
    const saveAsPngBtn = document.getElementById('save-as-png');
    const saveAsJpgBtn = document.getElementById('save-as-jpg');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const undoBtn = document.getElementById('undo');
    const redoBtn = document.getElementById('redo');
    const resizeCanvasBtn = document.getElementById('resize-canvas');
    const invertColorsBtn = document.getElementById('invert-colors');
    const grayscaleBtn = document.getElementById('grayscale');

    const mainColorPicker = document.getElementById('main-color');
    const secondaryColorPicker = document.getElementById('secondary-color');
    const swapColorsBtn = document.getElementById('swap-colors');
    const lineWidthInput = document.getElementById('line-width');
    const lineWidthValueSpan = document.getElementById('line-width-value');

    const resizeModal = document.getElementById('resize-modal');
    const canvasWidthInput = document.getElementById('canvas-width-input');
    const canvasHeightInput = document.getElementById('canvas-height-input');
    const applyResizeBtn = document.getElementById('apply-resize');
    const closeModalBtns = resizeModal.querySelectorAll('.close-modal');

    // === Инициализация ===
    function initCanvas() {
        // Устанавливаем начальный размер холста (можно изменить)
        canvas.width = 1000;
        canvas.height = 700;
        ctx.lineCap = 'round'; // Закругленные концы линий
        ctx.lineJoin = 'round'; // Закругленные соединения линий
        updateHistory(); // Сохраняем начальное состояние
        updateUIState(); // Обновляем кнопки Undo/Redo
    }

    initCanvas(); // Инициализируем холст при загрузке страницы

    // === Функции для работы с историей ===
    function saveState() {
        // Удаляем все "будущие" состояния, если мы вернулись назад и внесли изменения
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        // Сохраняем текущее состояние холста как Data URL
        history.push(canvas.toDataURL());
        historyIndex++;
        updateUIState();
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const imageData = new Image();
            imageData.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imageData, 0, 0);
            };
            imageData.src = history[historyIndex];
            updateUIState();
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const imageData = new Image();
            imageData.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imageData, 0, 0);
            };
            imageData.src = history[historyIndex];
            updateUIState();
        }
    }

    function updateHistory() {
        // Очищаем историю, если она слишком большая (чтобы не занимать много памяти)
        if (history.length > 100) {
            history = history.slice(history.length - 50);
            historyIndex = history.length - 1;
        }
        saveState();
    }

    function updateUIState() {
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= history.length - 1;
        // Кнопка "Новый" всегда активна
        newFileBtn.disabled = false;
        // Кнопки сохранения активны, если есть что сохранять
        saveFileBtn.disabled = history.length <= 1; // Если есть только начальное пустое состояние
        saveAsPngBtn.disabled = history.length <= 1;
        saveAsJpgBtn.disabled = history.length <= 1;
    }

    // === Функции инструментов ===
    function setTool(tool) {
        currentTool = tool;
        document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.toolbar button[data-tool="${tool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        if (tool === 'text') {
            isTextMode = true;
            canvas.style.cursor = 'text';
        } else {
            isTextMode = false;
            canvas.style.cursor = 'crosshair'; // Или другой курсор по умолчанию
        }
    }

    function drawLine(x1, y1, x2, y2, color, width) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function drawRectangle(x1, y1, x2, y2, color, width, isFilled) {
        const rectWidth = Math.abs(x2 - x1);
        const rectHeight = Math.abs(y2 - y1);
        const startX = Math.min(x1, x2);
        const startY = Math.min(y1, y2);

        ctx.beginPath();
        ctx.rect(startX, startY, rectWidth, rectHeight);
        if (isFilled) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
        }
    }

    function drawOval(x1, y1, x2, y2, color, width, isFilled) {
        const rectWidth = x2 - x1;
        const rectHeight = y2 - y1;
        const startX = x1 + rectWidth / 2;
        const startY = y1 + rectHeight / 2;

        ctx.beginPath();
        ctx.ellipse(startX, startY, Math.abs(rectWidth / 2), Math.abs(rectHeight / 2), 0, 0, 2 * Math.PI);
        if (isFilled) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
        }
    }

    function fillCanvas(x, y) {
        const targetColor = hexToRgb(mainColor);
        const startPixel = ctx.getImageData(x, y, 1, 1);
        const startColor = { r: startPixel.data[0], g: startPixel.data[1], b: startPixel.data[2], a: startPixel.data[3] };

        // Если начальный цвет совпадает с целевым, ничего не делаем
        if (startColor.r === targetColor.r && startColor.g === targetColor.g && startColor.b === targetColor.b) {
            return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const pixels = [];

        // Добавляем начальный пиксель в очередь
        pixels.push([x, y]);

        while (pixels.length > 0) {
            const [cx, cy] = pixels.shift(); // Берем первый пиксель из очереди

            // Проверяем границы холста
            if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) {
                continue;
            }

            const index = (cy * canvas.width + cx) * 4;
            const pixelColor = { r: data[index], g: data[index + 1], b: data[index + 2], a: data[index + 3] };

            // Если пиксель уже закрашен или не соответствует начальному цвету, пропускаем
            if (pixelColor.r === targetColor.r && pixelColor.g === targetColor.g && pixelColor.b === targetColor.b) {
                continue;
            }
            if (pixelColor.r !== startColor.r || pixelColor.g !== startColor.g || pixelColor.b !== startColor.b) {
                continue;
            }

            // Закрашиваем пиксель
            data[index] = targetColor.r;
            data[index + 1] = targetColor.g;
            data[index + 2] = targetColor.b;
            data[index + 3] = targetColor.a; // Сохраняем альфа-канал

            // Добавляем соседние пиксели в очередь
            pixels.push([cx + 1, cy]);
            pixels.push([cx - 1, cy]);
            pixels.push([cx, cy + 1]);
            pixels.push([cx, cy - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function applyEffect(effect) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            switch (effect) {
                case 'invert':
                    data[i] = 255 - r;     // Инвертировать красный
                    data[i + 1] = 255 - g; // Инвертировать зеленый
                    data[i + 2] = 255 - b; // Инвертировать синий
                    break;
                case 'grayscale':
                    const avg = (r + g + b) / 3;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                    break;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        updateHistory(); // Сохраняем состояние после применения эффекта
    }

    // === Обработчики событий ===

    // События мыши для рисования
    canvas.addEventListener('mousedown', (e) => {
        if (isTextMode) {
            // Если мы в режиме текста, клик мышью завершает ввод текста
            if (textInputActive) {
                const textInput = document.getElementById('text-input');
                const text = textInput.value;
                const x = parseInt(textInput.style.left);
                const y = parseInt(textInput.style.top);
                const fontSize = parseInt(textInput.style.fontSize);
                const fontColor = textInput.style.color;
                const fontFamily = textInput.style.fontFamily;

                ctx.fillStyle = fontColor;
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.fillText(text, x, y);

                textInput.remove(); // Удаляем поле ввода
                textInputActive = false;
                isTextMode = false; // Выходим из режима текста
                canvas.style.cursor = 'crosshair';
                updateHistory(); // Сохраняем состояние после добавления текста
            }
            return; // Не начинаем рисование, если в режиме текста
        }

        isDrawing = true;
        [startX, startY] = [e.offsetX, e.offsetY];
        [lastX, lastY] = [startX, startY];

        // Для заливки, линии, прямоугольника, овала - действие происходит при отпускании кнопки мыши
        if (currentTool !== 'pencil' && currentTool !== 'brush' && currentTool !== 'eraser') {
            // Ничего не делаем, ждем mouseup
        } else {
            // Для карандаша, кисти, ластика - начинаем рисовать сразу
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = lineWidth;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || isTextMode) return; // Не рисуем, если не нажата кнопка мыши или в режиме текста

        const currentX = e.offsetX;
        const currentY = e.offsetY;

        switch (currentTool) {
            case 'pencil':
            case 'brush':
            case 'eraser':
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(currentX, currentY);
                ctx.strokeStyle = mainColor;
                ctx.lineWidth = lineWidth;
                if (currentTool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out'; // Режим стирания
                } else {
                    ctx.globalCompositeOperation = 'source-over'; // Обычный режим
                }
                ctx.stroke();
                break;
            // Для геометрических фигур и заливки - рисуем "превью" (это сложнее, требует временного холста или очистки)
            // Пока что, для простоты, мы будем рисовать финальный вариант при mouseup
        }
        [lastX, lastY] = [currentX, currentY];
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing || isTextMode) return; // Не завершаем рисование, если не нажата кнопка мыши или в режиме текста

        const endX = e.offsetX;
        const endY = e.offsetY;
        isDrawing = false;

        // Применяем финальное действие инструмента
        switch (currentTool) {
            case 'line':
                drawLine(startX, startY, endX, endY, mainColor, lineWidth);
                break;
            case 'rectangle':
                // Определяем, хотим ли мы залитый или контурный прямоугольник
                // Пока что, пусть будет контурный
                drawRectangle(startX, startY, endX, endY, mainColor, lineWidth, false);
                break;
            case 'oval':
                drawOval(startX, startY, endX, endY, mainColor, lineWidth, false);
                break;
            case 'fill':
                fillCanvas(startX, startY);
                break;
            case 'pipette':
                const pixel = ctx.getImageData(endX, endY, 1, 1).data;
                const color = rgbToHex(pixel[0], pixel[1], pixel[2]);
                mainColor = color;
                mainColorPicker.value = color; // Обновляем выборщик основного цвета
                break;
        }

        // Если это не инструмент, который рисует в режиме 'mousemove' (т.е. не карандаш, кисть, ластик),
        // то сохраняем состояние после завершения действия.
        // Для карандаша, кисти, ластика сохраняем состояние после каждого движения (в mousemove)
        if (currentTool !== 'pencil' && currentTool !== 'brush' && currentTool !== 'eraser') {
            updateHistory();
        }
    });

    canvas.addEventListener('mouseout', () => {
        // Если курсор ушел с холста, прекращаем рисование
        if (isDrawing) {
            isDrawing = false;
            // Для геометрических фигур - отменяем "незавершенное" действие
            if (currentTool !== 'pencil' && currentTool !== 'brush' && currentTool !== 'eraser') {
                // Если нужно, можно добавить очистку временного рисования
            }
        }
    });

    // === Обработчики событий для инструментов и UI ===

    // Переключение инструментов
    document.querySelectorAll('.toolbar button[data-tool]').forEach(button => {
        button.addEventListener('click', () => {
            setTool(button.dataset.tool);
        });
    });

    // Выбор основного цвета
    mainColorPicker.addEventListener('change', (e) => {
        mainColor = e.target.value;
        ctx.strokeStyle = mainColor; // Обновляем цвет для будущих действий
        if (!isTextMode) canvas.style.cursor = 'crosshair'; // Возвращаем курсор, если он не текстовый
    });

    // Выбор дополнительного цвета
    secondaryColorPicker.addEventListener('change', (e) => {
        secondaryColor = e.target.value;
    });

    // Смена основного и дополнительного цветов
    swapColorsBtn.addEventListener('click', () => {
        [mainColor, secondaryColor] = [secondaryColor, mainColor];
        mainColorPicker.value = mainColor;
        secondaryColorPicker.value = secondaryColor;
        ctx.strokeStyle = mainColor; // Обновляем цвет для будущих действий
    });

    // Изменение толщины линии
    lineWidthInput.addEventListener('input', () => {
        lineWidth = parseInt(lineWidthInput.value);
        lineWidthValueSpan.textContent = lineWidth;
        ctx.lineWidth = lineWidth; // Обновляем глобальную толщину линии
    });

    // Отмена действия
    undoBtn.addEventListener('click', undo);

    // Повтор действия
    redoBtn.addEventListener('click', redo);

    // Очистка холста
    clearCanvasBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = []; // Очищаем всю историю
        historyIndex = -1;
        updateHistory(); // Сохраняем новое пустое состояние
        updateUIState();
    });

    // Инвертировать цвета
    invertColorsBtn.addEventListener('click', () => {
        applyEffect('invert');
    });

    // Оттенки серого
    grayscaleBtn.addEventListener('click', () => {
        applyEffect('grayscale');
    });

    // === Работа с файлами ===

    // Новый файл
    newFileBtn.addEventListener('click', () => {
        if (confirm('Создать новый холст? Все несохраненные изменения будут потеряны.')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            history = [];
            historyIndex = -1;
            updateHistory();
            updateUIState();
        }
    });

    // Открыть файл
    openFileBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Принимаем только изображения
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Устанавливаем размер холста равным размеру изображения
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем холст перед отрисовкой
                        ctx.drawImage(img, 0, 0);
                        updateHistory(); // Сохраняем загруженное изображение как первое состояние
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // Сохранить (как PNG)
    saveFileBtn.addEventListener('click', () => {
        saveImage('png');
    });

    // Сохранить как PNG
    saveAsPngBtn.addEventListener('click', () => {
        saveImage('png');
    });

    // Сохранить как JPG
    saveAsJpgBtn.addEventListener('click', () => {
        saveImage('jpg');
    });

    function saveImage(format) {
        const link = document.createElement('a');
        let filename = `painter_image_${Date.now()}`;
        let mimeType = `image/${format}`;

        if (format === 'jpg') {
            mimeType = 'image/jpeg';
            filename += '.jpg';
            // Для JPG можно указать качество (0.0 - 1.0)
            link.href = canvas.toDataURL(mimeType, 0.9); // 90% качество
        } else { // PNG по умолчанию
            filename += '.png';
            link.href = canvas.toDataURL(mimeType);
        }

        link.download = filename;
        link.click();
    }

    // === Изменение размера холста ===
    resizeCanvasBtn.addEventListener('click', () => {
        canvasWidthInput.value = canvas.width;
        canvasHeightInput.value = canvas.height;
        resizeModal.style.display = 'block';
    });

    applyResizeBtn.addEventListener('click', () => {
        const newWidth = parseInt(canvasWidthInput.value);
        const newHeight = parseInt(canvasHeightInput.value);

        if (newWidth > 0 && newHeight > 0) {
            // Сохраняем текущее содержимое холста
            const tempImage = new Image();
            tempImage.src = canvas.toDataURL();

            // Изменяем размер холста
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Восстанавливаем содержимое на новом размере
            ctx.drawImage(tempImage, 0, 0);
            updateHistory(); // Сохраняем новое состояние
        }
        resizeModal.style.display = 'none'; // Закрываем модальное окно
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            resizeModal.style.display = 'none';
        });
    });

    // Закрытие модального окна при клике вне его содержимого
    window.addEventListener('click', (event) => {
        if (event.target === resizeModal) {
            resizeModal.style.display = 'none';
        }
    });

    // === Вспомогательные функции ===
    function rgbToHex(r, g, b) {
        const componentToHex = (c) => {
            const hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    // === Обработка нажатий клавиш (горячие клавиши) ===
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z (Undo)
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault(); // Предотвращаем стандартное действие браузера
            undo();
        }
        // Ctrl+Y (Redo)
        else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        // Ctrl+N (New File)
        else if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newFileBtn.click(); // Эмулируем клик по кнопке "Новый"
        }
        // Ctrl+S (Save)
        else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveFileBtn.click(); // Эмулируем клик по кнопке "Сохранить"
        }
        // Обработка клавиш инструментов
        else {
            const shortcutTool = {
                'p': 'pencil',
                'b': 'brush',
                'e': 'eraser',
                'g': 'fill',
                'l': 'line',
                'r': 'rectangle',
                'o': 'oval',
                'i': 'pipette',
                't': 'text'
            }[e.key.toLowerCase()]; // Проверяем, является ли нажатая клавиша шорткатом для инструмента

            if (shortcutTool) {
                e.preventDefault();
                setTool(shortcutTool);
            }
        }
    });

    // === Режим ввода текста ===
    canvas.addEventListener('click', (e) => {
        if (currentTool === 'text' && !textInputActive) {
            const textInput = document.createElement('textarea'); // Используем textarea для удобства ввода
            textInput.id = 'text-input';
            textInput.style.position = 'absolute';
            textInput.style.left = `${e.offsetX}px`;
            textInput.style.top = `${e.offsetY}px`;
            textInput.style.backgroundColor = 'transparent';
            textInput.style.border = 'none';
            textInput.style.outline = 'none';
            textInput.style.color = mainColor; // Цвет текста соответствует основному
            textInput.style.fontSize = `${lineWidth}px`; // Размер текста равен толщине линии
            textInput.style.fontFamily = 'Segoe UI, sans-serif'; // Шрифт по умолчанию
            textInput.style.resize = 'none'; // Запрещаем изменение размера textarea
            textInput.style.zIndex = '100'; // Поверх всего

            canvas.parentNode.appendChild(textInput); // Добавляем textarea к родителю холста
            textInput.focus();
            textInputActive = true;
            isTextMode = true; // Устанавливаем флаг режима текста

            // Обработка завершения ввода текста
            const finishTextInput = () => {
                const text = textInput.value;
                const x = parseInt(textInput.style.left);
                const y = parseInt(textInput.style.top);
                const fontSize = parseInt(textInput.style.fontSize);
                const fontColor = textInput.style.color;
                const fontFamily = textInput.style.fontFamily;

                ctx.fillStyle = fontColor;
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.fillText(text, x, y);

                textInput.remove(); // Удаляем поле ввода
                textInputActive = false;
                isTextMode = false; // Выходим из режима текста
                canvas.style.cursor = 'crosshair';
                updateHistory(); // Сохраняем состояние после добавления текста
            };

            textInput.addEventListener('blur', finishTextInput); // Завершение ввода при потере фокуса
            textInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) { // Enter без Shift завершает ввод
                    event.preventDefault(); // Предотвращаем перевод строки
                    finishTextInput();
                }
            });
        }
    });

});
