document.addEventListener('DOMContentLoaded', () => {
    initBeforeAfterSlider();
    initUploadWidget();
    initScrollAnimations();
    initFAQ();
    initContactForm();
    initSmoothScroll();
    initCountdownTimer();
    initEmailModal();
});

// State
const state = {
    files: [],
    childName: '',
    bookTitle: '',
    template: 'classic', // hardcoded default
    customerEmail: '',
    customerPhone: ''
};

// Before/After Slider
function initBeforeAfterSlider() {
    const slider = document.querySelector('.slider-container');
    const beforeImage = document.querySelector('.before-image');
    const handle = document.querySelector('.slider-handle');
    let isResizing = false;

    if (!slider) return;

    slider.addEventListener('mousedown', () => isResizing = true);
    window.addEventListener('mouseup', () => isResizing = false);
    
    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        let rect = slider.getBoundingClientRect();
        let x = e.clientX - rect.left;
        
        // Boundaries
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        
        let percentage = (x / rect.width) * 100;
        
        beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        handle.style.left = `${percentage}%`;
    });
    
    // Touch support
    slider.addEventListener('touchstart', () => isResizing = true);
    window.addEventListener('touchend', () => isResizing = false);
    window.addEventListener('touchmove', (e) => {
        if (!isResizing) return;
        
        let rect = slider.getBoundingClientRect();
        let x = e.touches[0].clientX - rect.left;
        
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        
        let percentage = (x / rect.width) * 100;
        
        beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        handle.style.left = `${percentage}%`;
    });
}

// Upload Widget
function initUploadWidget() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const formActions = document.getElementById('form-actions');
    const thumbnailsHint = document.getElementById('thumbnails-hint');
    const form = document.getElementById('book-form');
    
    // Drag and Drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        dropZone.classList.add('dragover');
    }
    
    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }
    
    function handleFiles(e) {
        const newFiles = [...e.target.files].filter(file => file.type.match('image.*'));
        
        // Limit to 20 files total
        if (state.files.length + newFiles.length > 20) {
            alert('Максимальное количество файлов - 20');
            const allowedCount = 20 - state.files.length;
            newFiles.splice(allowedCount);
        }
        
        const promises = newFiles.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Create an in-memory Blob to prevent iOS Safari from losing the file reference
                    const blob = new Blob([e.target.result], { type: file.type });
                    blob.name = file.name;
                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        file: blob,
                        rotation: 0,
                        caption: ''
                    });
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(file);
            });
        });
        
        Promise.all(promises).then(fileObjs => {
            state.files.push(...fileObjs);
            renderThumbnails();
            updateFormActions();
        }).catch(err => {
            console.error(err);
            alert("Ошибка при чтении фото с устройства. Выберите их ещё раз.");
        });
    }
    
    function renderThumbnails() {
        if (state.files.length === 0) {
            thumbnailsContainer.classList.add('hidden');
            thumbnailsHint.classList.add('hidden');
            return;
        }
        
        thumbnailsContainer.classList.remove('hidden');
        thumbnailsHint.classList.remove('hidden');
        thumbnailsContainer.innerHTML = '';
        
        state.files.forEach((fileObj, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = `thumbnail-item ${index === 0 ? 'is-cover' : ''}`;
                div.draggable = true;
                div.dataset.id = fileObj.id;
                
                div.innerHTML = `
                    <img src="${e.target.result}" style="transform: rotate(${fileObj.rotation}deg)" alt="Thumbnail">
                    <div class="thumbnail-actions">
                        <button type="button" class="thumb-btn rotate" onclick="rotateFile('${fileObj.id}')">↻</button>
                        <button type="button" class="thumb-btn delete" onclick="deleteFile('${fileObj.id}')">×</button>
                    </div>
                    ${index !== 0 ? `<input type="text" class="caption-input" placeholder="Подпись..." value="${fileObj.caption}" onchange="updateCaption('${fileObj.id}', this.value)">` : ''}
                `;
                
                // Drag & drop logic for ordering
                div.addEventListener('dragstart', handleDragStart);
                div.addEventListener('dragover', handleDragOver);
                div.addEventListener('drop', handleDropThumbnail);
                div.addEventListener('dragend', handleDragEnd);
                
                thumbnailsContainer.appendChild(div);
            };
            
            reader.readAsDataURL(fileObj.file);
        });
    }
    
    // Make these globally available for onclick handlers
    window.deleteFile = function(id) {
        state.files = state.files.filter(f => f.id !== id);
        renderThumbnails();
        updateFormActions();
    };
    
    window.rotateFile = function(id) {
        const file = state.files.find(f => f.id === id);
        if (file) {
            file.rotation = (file.rotation + 90) % 360;
            renderThumbnails();
        }
    };
    
    window.updateCaption = function(id, text) {
        const file = state.files.find(f => f.id === id);
        if (file) {
            file.caption = text;
        }
    };
    
    // Drag & Drop for reordering
    let draggedItem = null;
    
    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.style.opacity = '0.4';
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDropThumbnail(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // stops the browser from redirecting.
        }
        
        if (draggedItem !== this) {
            // Reorder state array
            const draggedId = draggedItem.dataset.id;
            const targetId = this.dataset.id;
            
            const draggedIndex = state.files.findIndex(f => f.id === draggedId);
            const targetIndex = state.files.findIndex(f => f.id === targetId);
            
            const [item] = state.files.splice(draggedIndex, 1);
            state.files.splice(targetIndex, 0, item);
            
            renderThumbnails();
        }
        return false;
    }
    
    function handleDragEnd(e) {
        this.style.opacity = '1';
    }
    
    function updateFormActions() {
        if (state.files.length > 0) {
            formActions.classList.remove('hidden');
        } else {
            formActions.classList.add('hidden');
        }
    }
    
    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        state.childName = document.getElementById('child-name').value;
        state.bookTitle = document.getElementById('book-title').value;
        
        if (state.files.length === 0) {
            alert('Пожалуйста, добавьте хотя бы одну фотографию.');
            return;
        }
        
        // Show modal instead of directly submitting
        showEmailModal();
    });
}

// API Submission Logic (Called after modal)
async function submitOrderToApi() {
    // Switch UI to processing
    document.getElementById('step-1-input').classList.add('hidden');
    document.getElementById('step-2-processing').classList.remove('hidden');
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const statusText = document.getElementById('processing-status');
    const step1 = document.getElementById('proc-step-1');
    const step2 = document.getElementById('proc-step-2');
    const step3 = document.getElementById('proc-step-3');
    
    statusText.textContent = 'Подготовка фотографий...';
    
    const totalFiles = state.files.length;
    
    // Скрываем лишние шаги в UI (оставляем только первый как общий прогресс)
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    step1.innerHTML = '<span class="proc-icon">⏳</span> Сжатие и безопасная отправка';
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Опции сжатия (ужимаем до 1-2мб для обхода лимитов, но сохраняем качество)
    const options = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: !isMobile, // На мобильных (Safari/Chrome iOS) WebWorker часто падает из-за лимита памяти
      exifOrientation: true // Важно для правильной ориентации фото с телефона
    };
    
    for (let i = 0; i < totalFiles; i++) {
        const fileObj = state.files[i];
        
        try {
            statusText.textContent = `Сжатие фото ${i + 1} из ${totalFiles}...`;
            const compressedFile = await imageCompression(fileObj.file, options);
            
            const formData = new FormData();
            formData.append('file', compressedFile, fileObj.file.name);
            formData.append('child_name', state.childName || 'Не указано');
            formData.append('book_title', state.bookTitle || 'Не указано');
            formData.append('email', state.customerEmail || '');
            formData.append('phone', state.customerPhone || '');
            formData.append('caption', fileObj.caption || '');
            formData.append('is_first', i === 0 ? "true" : "false");
            
            statusText.textContent = `Отправка фото ${i + 1} из ${totalFiles}...`;
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if(!response.ok) {
                console.error('Ошибка сервера при отправке файла', response.status);
            }
            
            const progress = ((i + 1) / totalFiles) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.floor(progress)}%`;
            
        } catch (error) {
            console.error('Ошибка при обработке файла:', error);
            alert(`Ошибка при отправке фото ${i+1}: ${error.message || error}`);
        }
    }
    
    step1.classList.remove('active');
    step1.classList.add('done');
    step1.querySelector('.proc-icon').textContent = '✅';
    
    statusText.textContent = 'Готово!';
    setTimeout(showCompleteState, 800);
}

function showCompleteState() {
    document.getElementById('step-2-processing').classList.add('hidden');
    document.getElementById('step-3-complete').classList.remove('hidden');
}

// Email Modal Logic
function initEmailModal() {
    const modal = document.getElementById('email-modal');
    const closeBtn = document.getElementById('modal-close');
    const form = document.getElementById('email-form');

    window.showEmailModal = function() {
        modal.classList.add('active');
    };

    window.hideEmailModal = function() {
        modal.classList.remove('active');
    };

    closeBtn.addEventListener('click', hideEmailModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideEmailModal();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('order-email').value;
        const phone = document.getElementById('order-phone').value;
        
        if(email && phone) {
            state.customerEmail = email;
            state.customerPhone = phone;
            hideEmailModal();
            submitOrderToApi();
        } else {
            alert('Пожалуйста, введите Email и Телефон (WhatsApp).');
        }
    });
}

// Countdown Timer
function initCountdownTimer() {
    // Target: August 31, 2026 23:59:59
    const targetDate = new Date(2026, 7, 31, 23, 59, 59).getTime();

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');
    const countdownContainer = document.getElementById('countdown');

    if(!countdownContainer) return;

    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            countdownContainer.innerHTML = '<div style="font-size: 1.2rem; font-weight: bold; color: var(--secondary-color);">Акция завершена</div>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.textContent = days.toString().padStart(2, '0');
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minsEl.textContent = minutes.toString().padStart(2, '0');
        secsEl.textContent = seconds.toString().padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}


// Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.benefit-card, .step-card, .pain-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// FAQ Accordion
function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    
    items.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            items.forEach(i => i.classList.remove('active'));
            
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Contact Form
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const originalText = btn.textContent;
        
        btn.textContent = 'Отправка...';
        btn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            form.innerHTML = '<div class="success-message"><h3>Спасибо за сообщение!</h3><p>Мы ответим вам в ближайшее время.</p></div>';
        }, 1500);
    });
}

// Smooth Scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
}
