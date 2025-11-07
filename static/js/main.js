// Весь код обернут в этот обработчик, чтобы скрипт начал работать
// только после полной загрузки HTML-страницы.
document.addEventListener('DOMContentLoaded', function() {

    // --- ЛОГИКА МОДАЛЬНОГО ОКНА ДЛЯ ПАРОЛЯ ---

    // 1. Получаем ссылки на HTML-элементы, с которыми будем работать
    const modal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const submitButton = document.getElementById('password-submit-btn');
    const closeButton = document.querySelector('.modal .close-button');
    const modalError = document.getElementById('modal-error');
    let currentWebinarId = null; // Переменная для хранения ID вебинара, который открывают

    // 2. Функция для открытия окна
    function openPasswordModal(webinarId) {
        currentWebinarId = webinarId; // Запоминаем ID
        passwordInput.value = ''; // Очищаем поле ввода
        modalError.textContent = ''; // Очищаем сообщение об ошибке
        modal.style.display = 'block'; // Показываем окно
    }

    // 3. Функция для закрытия окна
    function closePasswordModal() {
        modal.style.display = 'none'; // Скрываем окно
    }

    // 4. Функция для проверки пароля
    function checkPassword() {
        const password = passwordInput.value;
        if (!password) {
            modalError.textContent = 'Пожалуйста, введите пароль.';
            return;
        }

        // Отправляем запрос на сервер (бэкенд)
        fetch('/api/check_password', {
            method: 'POST', // Метод POST для отправки данных
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentWebinarId, password: password }), // Упаковываем данные в JSON
        })
        .then(response => response.json()) // Получаем ответ и парсим его как JSON
        .then(data => {
            if (data.success) { // Если бэкенд сказал, что пароль верный
                window.open(data.video_url, '_blank'); // Открываем ссылку на видео в новой вкладке
                closePasswordModal();
            } else { // Если пароль неверный
                modalError.textContent = data.message || 'Произошла ошибка.';
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            modalError.textContent = 'Не удалось проверить пароль.';
        });
    }

    // 5. Назначаем события на клики
    closeButton.onclick = closePasswordModal;
    submitButton.onclick = checkPassword;
    window.onclick = function(event) { // Закрыть окно при клике на темный фон
        if (event.target == modal) {
            closePasswordModal();
        }
    };

    // --- ПОВЕДЕНИЕ ШАПКИ (тоньше, полупрозрачная на скролле, смена темы) ---
    const headerEl = document.querySelector('.header');
    const sections = Array.from(document.querySelectorAll('section.section'));
    // переключаем тему строго по границе секций: как только верх секции проходит под шапку

    // полупрозрачность при движении
    function setHeaderTheme(theme) {
        headerEl.classList.remove('theme-white', 'theme-yellow');
        headerEl.classList.add(theme === 'yellow' ? 'theme-yellow' : 'theme-white');
    }

    function getThemeByBoundary() {
        const headerHeight = headerEl.getBoundingClientRect().height;
        // берём последнюю секцию, чей верх уже прошёл верх шапки
        let current = sections[0];
        for (const sec of sections) {
            const rect = sec.getBoundingClientRect();
            if (rect.top <= headerHeight + 0.5) { // +0.5 для устранения дребезга на границе
                current = sec;
            } else {
                break;
            }
        }
        return current.getAttribute('data-theme') || 'white';
    }

    const onScroll = () => {
        // прозрачность при движении
        if (window.scrollY > 0) {
            headerEl.classList.add('scrolled');
        } else {
            headerEl.classList.remove('scrolled');
        }
        // инверсия темы относительно секции, чей верх прошёл под шапку
        const sectionTheme = getThemeByBoundary();
        const headerTheme = sectionTheme === 'yellow' ? 'white' : 'yellow';
        setHeaderTheme(headerTheme);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    // смена темы в зависимости от активной секции
    // больше не используем IntersectionObserver — переключение строго по границе

    // --- ЗАГРУЗКА ДИНАМИЧЕСКОГО КОНТЕНТА С СЕРВЕРА ---

    // --- Модальное окно для вопросов (секция КОГДА) ---
    (function initQuestionModals() {
        const infoModal = document.getElementById('info-modal');
        const infoTitle = document.getElementById('info-modal-title');
        const infoText = document.getElementById('info-modal-text');
        const infoFeatures = document.getElementById('info-modal-features');
        const infoClose = infoModal ? infoModal.querySelector('.close-button') : null;
        const infoOk = document.getElementById('info-modal-ok');
        const infoContact = document.getElementById('info-modal-contact');
        const infoCall = document.getElementById('info-modal-call');
        const contactSection = document.getElementById('contact-form');

        const serviceDetails = {
            addiction: {
                title: 'Помощь при зависимостях',
                text: 'Индивидуальная оценка ситуации и безопасный план выхода из зависимости.',
                features: [
                    'Первичная консультация и мотивационное интервью',
                    'Подбор программы реабилитации и сопровождения',
                    'Поддержка семьи и работа с созависимостью'
                ]
            },
            stress: {
                title: 'Работа со стрессом и тревогой',
                text: 'Поможем стабилизировать состояние и вернуть контроль.',
                features: [
                    'Техники саморегуляции и дыхательные практики',
                    'Когнитивно-поведенческие инструменты',
                    'Индивидуальный план восстановления'
                ]
            },
            detention: {
                title: 'Поддержка при принудительном содержании',
                text: 'Психологические и юридические ориентиры для вас и близких.',
                features: [
                    'Анализ ситуации и алгоритмы действий',
                    'Психоэмоциональная поддержка пострадавших',
                    'Контакты профильной помощи (по запросу)'
                ]
            },
            family: {
                title: 'Семейная поддержка',
                text: 'Улучшим коммуникацию и снизим напряжение в семье.',
                features: [
                    'Семейная консультация и разбор конфликтных сценариев',
                    'Навыки ненасильственного общения',
                    'План шагов для устойчивых изменений'
                ]
            }
        };

        const openInfo = (title, text, features) => {
            if (!infoModal) return;
            if (infoTitle) infoTitle.textContent = title || 'Важно';
            if (infoText) infoText.textContent = text || '';
            if (infoFeatures) {
                infoFeatures.innerHTML = '';
                (features || []).forEach(f => {
                    const li = document.createElement('li');
                    li.textContent = f;
                    infoFeatures.appendChild(li);
                });
            }
            infoModal.style.display = 'block';
        };
        const closeInfo = () => { if (infoModal) infoModal.style.display = 'none'; };

        if (infoClose) infoClose.onclick = closeInfo;
        if (infoOk) infoOk.onclick = closeInfo;
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeInfo(); });
        window.addEventListener('click', (e) => { if (e.target === infoModal) closeInfo(); });

        if (infoContact) {
            infoContact.addEventListener('click', () => {
                closeInfo();
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        // на кнопках в вопросах читаем атрибуты
        document.querySelectorAll('.questions-section .question-box button').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = btn.getAttribute('data-service');
                const overrideTitle = btn.getAttribute('data-modal-title');
                const overrideMessage = btn.getAttribute('data-modal-message');
                const detail = service && serviceDetails[service] ? serviceDetails[service] : null;
                const title = overrideTitle || (detail ? detail.title : 'Важно');
                const message = overrideMessage || (detail ? detail.text : 'Мы свяжемся с вами и подберём решение.');
                const features = detail ? detail.features : [];
                openInfo(title, message, features);
            });
        });
    })();

    // --- Загрузка Вебинаров ---
    fetch('/api/webinars') // Отправляем GET-запрос на наш API-эндпоинт
        .then(response => response.json())
        .then(data => {
            const webinarsContainer = document.getElementById('webinars-grid');
            webinarsContainer.innerHTML = ''; // Очищаем надпись "Загрузка..."
            if (data.length === 0) {
                webinarsContainer.innerHTML = '<p>Вебинаров пока нет.</p>';
                return;
            }
            // Для каждого вебинара из полученного списка...
            data.forEach(webinar => {
                const videoId = webinar.video_url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})/)?.[1];
                const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://via.placeholder.com/300x170.png?text=No+Preview';
                
                const isLocked = webinar.is_locked;
                const cardClass = 'webinar-card' + (isLocked ? ' locked' : '');
                
                // Создаем HTML-код для карточки
                const cardElement = document.createElement('div');
                cardElement.className = 'webinar-card-link';
                cardElement.innerHTML = `
                    <div class="${cardClass}" title="${webinar.title}">
                        <img src="${thumbnailUrl}" alt="${webinar.title}">
                        <div class="play-button"></div>
                    </div>
                `;

                // Назначаем разное действие по клику в зависимости от статуса
                if (isLocked) {
                    cardElement.onclick = () => openPasswordModal(webinar.id); // Если закрыт - открыть окно с паролем
                } else {
                    cardElement.onclick = () => window.open(webinar.video_url, '_blank'); // Если открыт - перейти по ссылке
                }
                
                webinarsContainer.appendChild(cardElement); // Добавляем созданную карточку на страницу
            });
        });
    
    // --- Загрузка Новостей (аналогично вебинарам) ---
    fetch('/api/news')
        .then(response => response.json())
        .then(data => {
            const newsContainer = document.getElementById('news-container');
            newsContainer.innerHTML = '';
            if (data.length === 0) {
                newsContainer.innerHTML = '<p>Новостей пока нет.</p>';
                return;
            }
            data.forEach(item => {
                const date = new Date(item.date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
                const newsElement = document.createElement('div');
                newsElement.className = 'news-item';
                newsElement.innerHTML = `
                    <div class="news-date">${date}</div>
                    <h3>${item.title}</h3>
                    <p>${item.content}</p>
                `;
                newsContainer.appendChild(newsElement);
            });
        });

    // --- Подстраховка для кнопки звонка: не должна перекрывать футер ---
    (function keepCallAboveFooter() {
        const callBtn = document.querySelector('.call-float');
        const footer = document.querySelector('.footer');
        if (!callBtn || !footer) return;

        function adjust() {
            // высота кнопки + отступ
            const btnHeight = callBtn.getBoundingClientRect().height || 64;
            const margin = 16; // px
            const footerRect = footer.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            // если верх футера меньше, чем (высота вьюпорта - btnHeight - margin), кнопка перекрывает футер
            const overlap = Math.max(0, (btnHeight + margin) - (viewportHeight - footerRect.top));
            if (overlap > 0) {
                // поднимаем кнопку выше на величину перекрытия
                callBtn.style.bottom = `calc(${margin + overlap}px + env(safe-area-inset-bottom, 0px))`;
            } else {
                // стандартный отступ
                callBtn.style.bottom = `calc(${margin}px + env(safe-area-inset-bottom, 0px))`;
            }
        }

        // корректируем при прокрутке/изменении размера и при загрузке
        window.addEventListener('scroll', () => requestAnimationFrame(adjust), { passive: true });
        window.addEventListener('resize', () => requestAnimationFrame(adjust));
        // начальная корректировка
        requestAnimationFrame(adjust);
    })();
});