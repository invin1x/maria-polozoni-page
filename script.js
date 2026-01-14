document.addEventListener('DOMContentLoaded', () => {
    let stockData = [];
    let mainData = {};

    // Загрузка данных
    fetch('stock.json')
        .then(response => response.json())
        .then(data => {
            stockData = data.stock;
            mainData = data.main;
            init();
        })
        .catch(err => {
            console.error('Ошибка загрузки stock.json', err);
            // Для демо (если файл не читается локально из-за CORS) можно вставить данные вручную сюда
            alert('Не удалось загрузить страницу. Проверьте соединение с интернетом.');
            window.location.reload();
        });

    // Инициализация
    function init() {
        renderHome();
        renderAssortment(stockData);
        setupTabs();
        setupSearchAndSort();
    }

    // --- Рендеринг ГЛАВНОЙ ---
function renderHome() {
    const homeContainer = document.getElementById('home-categories');
    homeContainer.innerHTML = '';

    if (!mainData.groups) return;

    // создаём словарь товаров по id
    const stockMap = {};
    stockData.forEach(item => {
        stockMap[item.id] = item;
    });

    mainData.groups.forEach(group => {
        // берём товары строго в порядке JSON
        const groupItems = group.items
            .map(id => stockMap[id])
            .filter(Boolean); // на случай если id не найден

        if (groupItems.length === 0) return;

        const section = document.createElement('div');
        section.className = 'category-section';

        const title = group.title || "";

        let cardsHTML = '';
        groupItems.forEach(item => {
            cardsHTML += createCardHTML(item);
        });

        section.innerHTML = `
            <h3 class="category-title">${title}</h3>
            <div class="category-wrapper">
                <button class="scroll-btn left">&lt;</button>
                <div class="horizontal-scroll">
                    ${cardsHTML}
                </div>
                <button class="scroll-btn right">&gt;</button>
            </div>
        `;

        homeContainer.appendChild(section);
    });

    attachCardEvents();
    attachScrollButtons();
}


    // --- Рендеринг АССОРТИМЕНТА ---
    function renderAssortment(items) {
        const grid = document.getElementById('stock-grid');
        grid.innerHTML = '';
        
        items.forEach(item => {
            grid.innerHTML += createCardHTML(item);
        });
        
        attachCardEvents();
    }
function attachScrollButtons() {
    const wrappers = document.querySelectorAll('.category-wrapper');

    wrappers.forEach(wrapper => {
        const scrollContainer = wrapper.querySelector('.horizontal-scroll');
        const btnLeft = wrapper.querySelector('.scroll-btn.left');
        const btnRight = wrapper.querySelector('.scroll-btn.right');

        const updateButtons = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

            btnLeft.style.display = scrollLeft <= 0 ? 'none' : 'block';
            btnRight.style.display = scrollLeft >= maxScrollLeft - 1 ? 'none' : 'block';
        };

        btnLeft.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -160, behavior: 'smooth' });
        });

        btnRight.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 160, behavior: 'smooth' });
        });

        // Обновляем при прокрутке
        scrollContainer.addEventListener('scroll', updateButtons);

        // И при инициализации
        updateButtons();
    });
}

    // Генерация HTML карточки
    function createCardHTML(item) {
        const thumb = item.images && item.images.length > 0 ? item.images[0] : 'placeholder.png';
        return `
            <div class="card" data-id="${item.id}">
                <img src="${thumb}" alt="${item.product_name}" class="card-img" loading="lazy">
                <div class="card-body">
                    <div class="card-price">${item.price.toLocaleString()} ₽</div>
                    <div class="card_name_text">${item.product_name}</div>
                </div>
            </div>
        `;
    }

    // --- Логика Вкладок ---
    function setupTabs() {
        const buttons = document.querySelectorAll('.nav-btn');
        const contents = document.querySelectorAll('.tab-content');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });
    }

    // Сделал функцию глобальной, чтобы вызывать из кнопки "Весь ассортимент"
    window.switchTab = function(tabId) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        document.querySelector(`.nav-btn[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // Скролл вверх при переключении
        window.scrollTo(0,0);
    }

    // --- Поиск и Сортировка ---
    function setupSearchAndSort() {
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');

        function filterAndSort() {
            let filtered = stockData.filter(item => {
                const term = searchInput.value.toLowerCase();
                return item.product_name.toLowerCase().includes(term) || 
                       item.product_description.toLowerCase().includes(term);
            });

            const sortMode = sortSelect.value;
            if (sortMode === 'asc') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (sortMode === 'desc') {
                filtered.sort((a, b) => b.price - a.price);
            }

            renderAssortment(filtered);
        }

        searchInput.addEventListener('input', filterAndSort);
        sortSelect.addEventListener('change', filterAndSort);
    }

    // --- Модальное окно ---
    const modal = document.getElementById('product-modal');
    const modalImg = document.getElementById('modal-img');
    let currentImages = [];
    let currentImgIndex = 0;

    function attachCardEvents() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const item = stockData.find(i => i.id === id);
                openModal(item);
            });
        });
    }

    let isFirstImage = true;

    function openModal(item) {
        currentImages = item.images;
        currentImgIndex = 0;
        isFirstImage = true;
        updateModalImage();

        document.getElementById('modal-title').innerText = item.product_name;
        document.getElementById('modal-price').innerText = `${item.price.toLocaleString()} ₽`;
        document.getElementById('modal-article').innerText = `Арт: ${item.article}`;
        document.getElementById('modal-desc').innerText = item.product_description;
        
        // Скрыть стрелки если 1 картинка
        const controls = document.getElementById('gallery-controls');
        controls.style.display = currentImages.length > 1 ? 'flex' : 'none';

        modal.style.display = 'flex';
    }

function updateModalImage(direction = 'next') {
    if (currentImages.length === 0) return;

    const gallery = document.querySelector('.modal-gallery');
    const oldImg = gallery.querySelector('img.active');

    const newImg = document.createElement('img');
    newImg.src = currentImages[currentImgIndex];
    newImg.classList.add('active');

    newImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    newImg.style.opacity = 1;

    if (isFirstImage) {
        // Первый рендер — сразу показываем без анимации
        newImg.style.transform = 'translateX(0)';
        isFirstImage = false;
    } else {
        // Анимация при смене картинки
        newImg.style.transform = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
        gallery.appendChild(newImg);
        newImg.getBoundingClientRect(); // форсируем рендер
        newImg.style.transform = 'translateX(0)';
        if (oldImg) {
            oldImg.style.transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
            oldImg.classList.remove('active');
            setTimeout(() => {
                if (oldImg.parentElement) oldImg.parentElement.removeChild(oldImg);
            }, 300);
        }
        return;
    }

    gallery.appendChild(newImg);

    if (oldImg) {
        oldImg.classList.remove('active');
        oldImg.parentElement.removeChild(oldImg);
    }
}


// --- Свайпы ---
let touchStartX = 0;
let touchEndX = 0;

const gallery = document.querySelector('.modal-gallery');

gallery.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

gallery.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

document.getElementById('prev-img').onclick = () => {
    currentImgIndex = (currentImgIndex - 1 + currentImages.length) % currentImages.length;
    updateModalImage('prev');
};

document.getElementById('next-img').onclick = () => {
    currentImgIndex = (currentImgIndex + 1) % currentImages.length;
    updateModalImage('next');
};

function handleSwipe() {
    const swipeDistance = touchStartX - touchEndX;
    if (Math.abs(swipeDistance) < 50) return;
    if (currentImages.length === 1) return;

    if (swipeDistance > 0) {
        currentImgIndex = (currentImgIndex + 1) % currentImages.length;
        updateModalImage('next');
    } else {
        currentImgIndex = (currentImgIndex - 1 + currentImages.length) % currentImages.length;
        updateModalImage('prev');
    }
}

    document.querySelector('.close-modal').onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});
