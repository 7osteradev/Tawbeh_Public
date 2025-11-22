        document.addEventListener('DOMContentLoaded', function() {
            // عناصر DOM
            const searchInput = document.getElementById('searchInput');
            const searchBtn = document.getElementById('searchBtn');
            const searchResults = document.getElementById('searchResults');
            const hadithContent = document.getElementById('hadithContent');
            const hamburger = document.getElementById('hamburger');
            const scrollTopBtn = document.getElementById('scrollTop');
            const notification = document.getElementById('notification');
            const booksGrid = document.getElementById('booksGrid');
            const navLinks = document.getElementById('navLinks');
            const pagination = document.getElementById('pagination');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const favoritesBtn = document.getElementById('favoritesBtn');
            const favoritesSection = document.getElementById('favoritesSection');
            const favoritesContent = document.getElementById('favoritesContent');
            const currentBookIndicator = document.getElementById('currentBookIndicator');
            const currentBookName = document.getElementById('currentBookName');
            
            // متغيرات التطبيق
            let hadithDatabase = [];
            let books = [];
            let currentPage = 1;
            let currentBook = 'all';
            let currentFilter = 'all';
            const itemsPerPage = 10;
            const API_BASE_URL = 'http://localhost:3000/api';
            
            // بدء تحميل البيانات
            loadBooks();
            
            // دالة مساعدة لتحويل درجة الصحة إلى كلاس CSS
            function getGradeClass(grade) {
                if (!grade) return '';
                return grade
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z-]/g, '');
            }
            
            // دالة لتحديد قوة الحديث بناءً على درجته
            function getHadithStrength(grade) {
                const strengthMap = {
                    'صحيح متفق عليه': 5,
                    'صحيح': 4,
                    'حسن صحيح': 3,
                    'حسن': 2
                };
                
                return strengthMap[grade] || 1;
            }
            
            // دالة لإزالة الحركات من النص العربي
            function normalizeArabicText(text) {
                return text
                    .replace(/[ًٌٍَُِّْ]/g, '') // إزالة الحركات
                    .replace(/أ|آ|إ/g, 'ا') // توحيد أنواع الألف
                    .replace(/ة/g, 'ه') // تحويل التاء المربوطة إلى هاء
                    .replace(/ى/g, 'ي'); // تحويل الألف المقصورة إلى ياء
            }
            
            // تحميل الكتب وعرضها
            async function loadBooks() {
                showLoader();
                
                try {
                    const response = await fetch(`${API_BASE_URL}/books`);
                    const data = await response.json();
                    books = data;
                    
                    booksGrid.innerHTML = '';
                    
                    // إضافة زر "الكل"
                    const allCard = document.createElement('div');
                    allCard.className = 'book-card active';
                    allCard.innerHTML = `
                        <i class="fas fa-book book-icon"></i>
                        <h4>الكل</h4>
                    `;
                    allCard.onclick = () => {
                        document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
                        allCard.classList.add('active');
                        currentBook = 'all';
                        currentBookIndicator.style.display = 'none';
                        currentBookName.textContent = 'جميع الكتب';
                        loadAllHadiths();
                    };
                    booksGrid.appendChild(allCard);
                    
                    data.forEach(book => {
                        const bookCard = document.createElement('div');
                        bookCard.className = 'book-card';
                        bookCard.innerHTML = `
                            <i class="fas fa-book book-icon"></i>
                            <h4>${book.name}</h4>
                        `;
                        bookCard.onclick = () => {
                            document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
                            bookCard.classList.add('active');
                            currentBook = book.id;
                            
                            // إظهار مؤشر الكتاب الحالي
                            currentBookIndicator.style.display = 'flex';
                            currentBookName.textContent = book.name;
                            
                            loadHadithsByBook(book.id);
                        };
                        booksGrid.appendChild(bookCard);
                    });
                    
                    // تحميل جميع الأحاديث افتراضيًا
                    loadAllHadiths();
                } catch (error) {
                    console.error('حدث خطأ في تحميل الكتب:', error);
                    showToast('تم تحميل الكتب من البيانات المحلية', true);
                    loadLocalBooks();
                }
            }
            
            // تحميل بيانات محلية إذا فشل الاتصال بالAPI
            function loadLocalBooks() {
                books = [
                    { id: 'bukhari', name: 'صحيح البخاري' },
                    { id: 'muslim', name: 'صحيح مسلم' },
                    { id: 'tirmidzi', name: 'سنن الترمذي' },
                    { id: 'nasai', name: 'سنن النسائي' },
                    { id: 'abudawud', name: 'سنن أبي داود' },
                    { id: 'ibnmajah', name: 'سنن ابن ماجه' },
                    { id: 'malik', name: 'موطأ مالك' }
                ];
                
                booksGrid.innerHTML = '';
                
                // إضافة زر "الكل"
                const allCard = document.createElement('div');
                allCard.className = 'book-card active';
                allCard.innerHTML = `
                    <i class="fas fa-book book-icon"></i>
                    <h4>الكل</h4>
                `;
                allCard.onclick = () => {
                    document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
                    allCard.classList.add('active');
                    currentBook = 'all';
                    currentBookIndicator.style.display = 'none';
                    currentBookName.textContent = 'جميع الكتب';
                    loadAllHadiths();
                };
                booksGrid.appendChild(allCard);
                
                books.forEach(book => {
                    const bookCard = document.createElement('div');
                    bookCard.className = 'book-card';
                    bookCard.innerHTML = `
                        <i class="fas fa-book book-icon"></i>
                        <h4>${book.name}</h4>
                    `;
                    bookCard.onclick = () => {
                        document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
                        bookCard.classList.add('active');
                        currentBook = book.id;
                        
                        // إظهار مؤشر الكتاب الحالي
                        currentBookIndicator.style.display = 'flex';
                        currentBookName.textContent = book.name;
                        
                        loadHadithsByBook(book.id);
                    };
                    booksGrid.appendChild(bookCard);
                });
                
                // تحميل جميع الأحاديث افتراضيًا
                loadAllHadiths();
            }
            
            // تحميل جميع الأحاديث
            async function loadAllHadiths() {
                showSkeletonLoader();
                currentPage = 1;
                
                try {
                    const response = await fetch(`${API_BASE_URL}/hadiths`);
                    if (!response.ok) {
                        throw new Error('فشل في جلب البيانات');
                    }
                    
                    const data = await response.json();
                    hadithDatabase = data.hadiths || [];
                    
                    // ترتيب الأحاديث حسب الكتاب ورقم الحديث
                    hadithDatabase.sort((a, b) => {
                        const bookOrder = { 
                            bukhari: 1, muslim: 2, tirmidzi: 3, 
                            nasai: 4, abudawud: 5, ibnmajah: 6, malik: 7 
                        };
                        const aBook = a.bookId || 'other';
                        const bBook = b.bookId || 'other';
                        
                        if (bookOrder[aBook] !== bookOrder[bBook]) {
                            return bookOrder[aBook] - bookOrder[bBook];
                        }
                        
                        // استخراج رقم الحديث من المعرف
                        const aNum = parseInt(a.id.split('-').pop()) || 0;
                        const bNum = parseInt(b.id.split('-').pop()) || 0;
                        
                        return aNum - bNum;
                    });
                    
                    displayHadiths();
                    setupPagination();
                    showToast(`تم تحميل ${hadithDatabase.length} حديث`);
                } catch (error) {
                    console.error('حدث خطأ في تحميل الأحاديث:', error);
                    showToast('تم تحميل الأحاديث من البيانات المحلية', true);
                    loadLocalHadiths();
                }
            }
            
            // تحميل الأحاديث حسب الكتاب المحدد
            async function loadHadithsByBook(bookId) {
                showSkeletonLoader();
                currentPage = 1;
                
                try {
                    const response = await fetch(`${API_BASE_URL}/hadiths?bookId=${bookId}`);
                    if (!response.ok) {
                        throw new Error('فشل في جلب البيانات');
                    }
                    
                    const data = await response.json();
                    
                    // التأكد من أن البيانات تحتوي على أحاديث الكتاب المطلوب فقط
                    hadithDatabase = data.hadiths.filter(hadith => hadith.bookId === bookId) || [];
                    
                    // ترتيب الأحاديث حسب رقم الحديث
                    hadithDatabase.sort((a, b) => {
                        const aNum = parseInt(a.id.split('-').pop()) || 0;
                        const bNum = parseInt(b.id.split('-').pop()) || 0;
                        return aNum - bNum;
                    });
                    
                    displayHadiths();
                    setupPagination();
                    showToast(`تم تحميل ${hadithDatabase.length} حديث من ${books.find(b => b.id === bookId)?.name}`);
                } catch (error) {
                    console.error('حدث خطأ في تحميل الأحاديث:', error);
                    showToast('تم تحميل الأحاديث من البيانات المحلية', true);
                    loadLocalHadithsByBook(bookId);
                }
            }
            
            // تحميل بيانات محلية إذا فشل الاتصال بالAPI
            function loadLocalHadiths() {
                hadithDatabase = [
                    // صحيح البخاري
                    {
                        id: 'bukhari-1',
                        text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله، فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها، فهجرته إلى ما هاجر إليه",
                        source: "صحيح البخاري",
                        sourceDetails: "كتاب بدء الوحي، حديث 1",
                        tags: ["نية", "أعمال", "هجرة"],
                        category: "daily",
                        bookId: "bukhari",
                        grade: "صحيح",
                        gradedBy: "الإمام البخاري"
                    },
                    {
                        id: 'bukhari-2',
                        text: "الكلمة الطيبة صدقة",
                        source: "صحيح البخاري",
                        sourceDetails: "كتاب الأدب، حديث 2",
                        tags: ["أخلاق", "كلمة طيبة"],
                        category: "daily",
                        bookId: "bukhari",
                        grade: "صحيح",
                        gradedBy: "الإمام البخاري"
                    },
                    // صحيح مسلم
                    {
                        id: 'muslim-43',
                        text: "بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمداً رسول الله، وإقام الصلاة، وإيتاء الزكاة، وحج البيت، وصوم رمضان",
                        source: "صحيح مسلم",
                        sourceDetails: "كتاب الإيمان، حديث 43",
                        tags: ["إسلام", "أركان"],
                        category: "featured",
                        bookId: "muslim",
                        grade: "صحيح متفق عليه",
                        gradedBy: "الإمام مسلم"
                    },
                    {
                        id: 'muslim-224',
                        text: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن",
                        source: "صحيح مسلم",
                        sourceDetails: "كتاب البر والصلة، حديث 224",
                        tags: ["أخلاق", "تقوى"],
                        category: "featured",
                        bookId: "muslim",
                        grade: "صحيح",
                        gradedBy: "الإمام مسلم"
                    },
                    // سنن الترمذي
                    {
                        id: 'tirmidzi-2317',
                        text: "من حسن إسلام المرء تركه ما لا يعنيه",
                        source: "سنن الترمذي",
                        sourceDetails: "كتاب الزهد، حديث 2317",
                        tags: ["إسلام", "أخلاق"],
                        bookId: "tirmidzi",
                        grade: "حسن",
                        gradedBy: "الإمام الترمذي"
                    },
                    // سنن النسائي
                    {
                        id: 'nasai-1',
                        text: "إن الله لا ينظر إلى صوركم وأموالكم، ولكن ينظر إلى قلوبكم وأعمالكم",
                        source: "سنن النسائي",
                        sourceDetails: "كتاب الإيمان، حديث 1",
                        tags: ["قلوب", "أعمال"],
                        category: "featured",
                        bookId: "nasai",
                        grade: "صحيح",
                        gradedBy: "الإمام النسائي"
                    },
                    // سنن أبي داود
                    {
                        id: 'abudawud-4342',
                        text: "أفضل الجهاد كلمة حق عند سلطان جائر",
                        source: "سنن أبي داود",
                        sourceDetails: "كتاب الملاحم، حديث 4342",
                        tags: ["جهاد", "حق"],
                        category: "daily",
                        bookId: "abudawud",
                        grade: "حسن",
                        gradedBy: "الإمام أبو داود"
                    },
                    // سنن ابن ماجه
                    {
                        id: 'ibnmajah-1',
                        text: "طلب العلم فريضة على كل مسلم",
                        source: "سنن ابن ماجه",
                        sourceDetails: "المقدمة، حديث 1",
                        tags: ["علم", "فريضة"],
                        category: "featured",
                        bookId: "ibnmajah",
                        grade: "حسن",
                        gradedBy: "الإمام ابن ماجه"
                    },
                    // موطأ مالك
                    {
                        id: 'malik-1',
                        text: "بلغوا عني ولو آية، وحدثوا عن بني إسرائيل ولا حرج، ومن كذب علي متعمدا فليتبوأ مقعده من النار",
                        source: "موطأ مالك",
                        sourceDetails: "المقدمة، حديث 1",
                        tags: ["بلاغ", "علم"],
                        category: "featured",
                        bookId: "malik",
                        grade: "صحيح",
                        gradedBy: "الإمام مالك"
                    }
                ];
                
                // ترتيب الأحاديث حسب الكتاب ورقم الحديث
                hadithDatabase.sort((a, b) => {
                    const bookOrder = { 
                        bukhari: 1, muslim: 2, tirmidzi: 3, 
                        nasai: 4, abudawud: 5, ibnmajah: 6, malik: 7 
                    };
                    const aBook = a.bookId || 'other';
                    const bBook = b.bookId || 'other';
                    
                    if (bookOrder[aBook] !== bookOrder[bBook]) {
                        return bookOrder[aBook] - bookOrder[bBook];
                    }
                    
                    const aNum = parseInt(a.id.split('-').pop()) || 0;
                    const bNum = parseInt(b.id.split('-').pop()) || 0;
                    
                    return aNum - bNum;
                });
                
                displayHadiths();
                setupPagination();
            }
            
            function loadLocalHadithsByBook(bookId) {
                const allHadiths = [
                    // صحيح البخاري
                    {
                        id: 'bukhari-1',
                        text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله، فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها، فهجرته إلى ما هاجر إليه",
                        source: "صحيح البخاري",
                        sourceDetails: "كتاب بدء الوحي، حديث 1",
                        tags: ["نية", "أعمال", "هجرة"],
                        category: "daily",
                        bookId: "bukhari",
                        grade: "صحيح",
                        gradedBy: "الإمام البخاري"
                    },
                    {
                        id: 'bukhari-2',
                        text: "الكلمة الطيبة صدقة",
                        source: "صحيح البخاري",
                        sourceDetails: "كتاب الأدب، حديث 2",
                        tags: ["أخلاق", "كلمة طيبة"],
                        category: "daily",
                        bookId: "bukhari",
                        grade: "صحيح",
                        gradedBy: "الإمام البخاري"
                    },
                    // صحيح مسلم
                    {
                        id: 'muslim-43',
                        text: "بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمداً رسول الله، وإقام الصلاة، وإيتاء الزكاة، وحج البيت، وصوم رمضان",
                        source: "صحيح مسلم",
                        sourceDetails: "كتاب الإيمان، حديث 43",
                        tags: ["إسلام", "أركان"],
                        category: "featured",
                        bookId: "muslim",
                        grade: "صحيح متفق عليه",
                        gradedBy: "الإمام مسلم"
                    },
                    {
                        id: 'muslim-224',
                        text: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن",
                        source: "صحيح مسلم",
                        sourceDetails: "كتاب البر والصلة، حديث 224",
                        tags: ["أخلاق", "تقوى"],
                        category: "featured",
                        bookId: "muslim",
                        grade: "صحيح",
                        gradedBy: "الإمام مسلم"
                    },
                    // سنن الترمذي
                    {
                        id: 'tirmidzi-2317',
                        text: "من حسن إسلام المرء تركه ما لا يعنيه",
                        source: "سنن الترمذي",
                        sourceDetails: "كتاب الزهد، حديث 2317",
                        tags: ["إسلام", "أخلاق"],
                        bookId: "tirmidzi",
                        grade: "حسن",
                        gradedBy: "الإمام الترمذي"
                    },
                    // سنن النسائي
                    {
                        id: 'nasai-1',
                        text: "إن الله لا ينظر إلى صوركم وأموالكم، ولكن ينظر إلى قلوبكم وأعمالكم",
                        source: "سنن النسائي",
                        sourceDetails: "كتاب الإيمان، حديث 1",
                        tags: ["قلوب", "أعمال"],
                        category: "featured",
                        bookId: "nasai",
                        grade: "صحيح",
                        gradedBy: "الإمام النسائي"
                    },
                    // سنن أبي داود
                    {
                        id: 'abudawud-4342',
                        text: "أفضل الجهاد كلمة حق عند سلطان جائر",
                        source: "سنن أبي داود",
                        sourceDetails: "كتاب الملاحم، حديث 4342",
                        tags: ["جهاد", "حق"],
                        category: "daily",
                        bookId: "abudawud",
                        grade: "حسن",
                        gradedBy: "الإمام أبو داود"
                    },
                    // سنن ابن ماجه
                    {
                        id: 'ibnmajah-1',
                        text: "طلب العلم فريضة على كل مسلم",
                        source: "سنن ابن ماجه",
                        sourceDetails: "المقدمة، حديث 1",
                        tags: ["علم", "فريضة"],
                        category: "featured",
                        bookId: "ibnmajah",
                        grade: "حسن",
                        gradedBy: "الإمام ابن ماجه"
                    },
                    // موطأ مالك
                    {
                        id: 'malik-1',
                        text: "بلغوا عني ولو آية، وحدثوا عن بني إسرائيل ولا حرج، ومن كذب علي متعمدا فليتبوأ مقعده من النار",
                        source: "موطأ مالك",
                        sourceDetails: "المقدمة، حديث 1",
                        tags: ["بلاغ", "علم"],
                        category: "featured",
                        bookId: "malik",
                        grade: "صحيح",
                        gradedBy: "الإمام مالك"
                    }
                ];
                
                // التصفية الصارمة للأحاديث حسب الكتاب المحدد
                hadithDatabase = allHadiths.filter(hadith => hadith.bookId === bookId);
                
                // ترتيب الأحاديث حسب رقم الحديث
                hadithDatabase.sort((a, b) => {
                    const aNum = parseInt(a.id.split('-').pop()) || 0;
                    const bNum = parseInt(b.id.split('-').pop()) || 0;
                    return aNum - bNum;
                });
                
                displayHadiths();
                setupPagination();
                showToast(`تم تحميل ${hadithDatabase.length} حديث من ${books.find(b => b.id === bookId)?.name}`);
            }
            
            // عرض الأحاديث
            function displayHadiths(page = 1) {
                hadithContent.innerHTML = '';
                currentPage = page;
                
                // تصفية الأحاديث حسب الفئة المحددة
                let filteredHadiths = hadithDatabase;
                
                if (currentFilter === 'featured') {
                    filteredHadiths = getFeaturedHadiths();
                } else if (currentFilter === 'daily') {
                    filteredHadiths = getDailyHadiths();
                }
                
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedHadiths = filteredHadiths.slice(startIndex, endIndex);
                
                const hadithList = document.createElement('div');
                hadithList.className = 'hadith-list';
                
                if (paginatedHadiths.length === 0) {
                    hadithList.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-info-circle"></i>
                            <p>لا توجد أحاديث متاحة</p>
                        </div>
                    `;
                    hadithContent.appendChild(hadithList);
                    return;
                }
                
                paginatedHadiths.forEach(hadith => {
                    hadithList.appendChild(createHadithElement(hadith));
                });
                
                hadithContent.appendChild(hadithList);
            }
            
            // إعداد الترقيم
            function setupPagination() {
                // تصفية الأحاديث حسب الفئة المحددة
                let filteredHadiths = hadithDatabase;
                
                if (currentFilter === 'featured') {
                    filteredHadiths = getFeaturedHadiths();
                } else if (currentFilter === 'daily') {
                    filteredHadiths = getDailyHadiths();
                }
                
                const totalPages = Math.ceil(filteredHadiths.length / itemsPerPage);
                
                if (totalPages <= 1) {
                    pagination.innerHTML = '';
                    return;
                }
                
                let paginationHTML = '';
                
                // زر السابق
                paginationHTML += `
                    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;
                
                // الصفحة الأولى
                if (currentPage > 2) {
                    paginationHTML += `
                        <button class="pagination-btn" data-page="1">1</button>
                    `;
                }
                
                // نقاط إذا كانت الصفحات كثيرة
                if (currentPage > 3) {
                    paginationHTML += `<span class="pagination-dots">...</span>`;
                }
                
                // الصفحات المحيطة بالصفحة الحالية
                const startPage = Math.max(1, currentPage - 1);
                const endPage = Math.min(totalPages, currentPage + 1);
                
                for (let i = startPage; i <= endPage; i++) {
                    paginationHTML += `
                        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                            ${i}
                        </button>
                    `;
                }
                
                // نقاط إذا كانت الصفحات كثيرة
                if (currentPage < totalPages - 2) {
                    paginationHTML += `<span class="pagination-dots">...</span>`;
                }
                
                // الصفحة الأخيرة
                if (currentPage < totalPages - 1) {
                    paginationHTML += `
                        <button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>
                    `;
                }
                
                // زر التالي
                paginationHTML += `
                    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                `;
                
                // معلومات الصفحة والقفز إلى صفحة محددة
                paginationHTML += `
                    <div class="pagination-info">
                        <span>الصفحة ${currentPage} من ${totalPages}</span>
                    </div>
                    <div class="pagination-jump">
                        <input type="number" id="jumpToPage" min="1" max="${totalPages}" placeholder="رقم الصفحة">
                        <button id="jumpBtn">انتقل</button>
                    </div>
                `;
                
                pagination.innerHTML = paginationHTML;
                
                // إضافة مستمعي الأحداث لأزرار الترقيم
                document.querySelectorAll('.pagination-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const page = parseInt(this.dataset.page);
                        if (!isNaN(page)) {
                            displayHadiths(page);
                            window.scrollTo({
                                top: hadithContent.offsetTop - 100,
                                behavior: 'smooth'
                            });
                        }
                    });
                });
                
                // إضافة حدث للقفز إلى صفحة محددة
                document.getElementById('jumpBtn').addEventListener('click', function() {
                    const pageInput = document.getElementById('jumpToPage');
                    const page = parseInt(pageInput.value);
                    
                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                        displayHadiths(page);
                        window.scrollTo({
                            top: hadithContent.offsetTop - 100,
                            behavior: 'smooth'
                        });
                    } else {
                        showToast('يرجى إدخال رقم صفحة صحيح', true);
                    }
                });
                
                // السماح بالضغط على Enter في حقل القفز
                document.getElementById('jumpToPage').addEventListener('keyup', function(e) {
                    if (e.key === 'Enter') {
                        document.getElementById('jumpBtn').click();
                    }
                });
            }
            
            // إنشاء عنصر الحديث
            function createHadithElement(hadith) {
                const hadithItem = document.createElement('div');
                hadithItem.className = 'hadith-item';
                
                const hadithHeader = document.createElement('div');
                hadithHeader.className = 'hadith-header';
                
                const favoriteBtn = document.createElement('button');
                favoriteBtn.className = 'favorite-btn';
                
                // تحقق إذا كان الحديث مفضلاً
                const favorites = JSON.parse(localStorage.getItem('favoriteHadiths')) || [];
                if (favorites.includes(hadith.id)) {
                    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                } else {
                    favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                }
                
                favoriteBtn.onclick = (e) => {
                    e.stopPropagation();
                    toggleFavorite(hadith.id, favoriteBtn);
                };
                
                hadithHeader.appendChild(favoriteBtn);
                
                const hadithText = document.createElement('div');
                hadithText.className = 'hadith-text';
                hadithText.textContent = hadith.text;
                
                const hadithMeta = document.createElement('div');
                hadithMeta.className = 'hadith-meta';
                hadithMeta.textContent = `${hadith.source} - ${hadith.sourceDetails}`;
                
                const hadithGrade = document.createElement('div');
                hadithGrade.className = `hadith-grade grade-${getGradeClass(hadith.grade)}`;
                
                // إضافة مؤشر قوة الحديث
                const strength = getHadithStrength(hadith.grade);
                let strengthDots = '';
                
                for (let i = 1; i <= 5; i++) {
                    strengthDots += `<div class="strength-dot ${i <= strength ? 'active' : ''}"></div>`;
                }
                
                hadithGrade.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>${hadith.grade || 'صحيح'} - صححه ${hadith.gradedBy || 'علماء الحديث'}</span>
                    <div class="strength-meter">
                        <span class="strength-label">قوة الحديث:</span>
                        <div class="strength-dots">
                            ${strengthDots}
                        </div>
                    </div>
                `;
                
                const hadithTags = document.createElement('div');
                hadithTags.className = 'hadith-tags';
                
                if (hadith.tags && hadith.tags.length > 0) {
                    hadith.tags.forEach(tag => {
                        const tagElement = document.createElement('span');
                        tagElement.className = 'hadith-tag';
                        tagElement.textContent = tag;
                        hadithTags.appendChild(tagElement);
                    });
                }
                
                const shareBtn = document.createElement('button');
                shareBtn.className = 'share-btn';
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> مشاركة';
                shareBtn.onclick = (e) => {
                    e.stopPropagation();
                    shareHadith(hadith);
                };
                
                hadithItem.appendChild(hadithHeader);
                hadithItem.appendChild(hadithText);
                hadithItem.appendChild(hadithMeta);
                hadithItem.appendChild(hadithGrade);
                hadithItem.appendChild(hadithTags);
                hadithItem.appendChild(shareBtn);
                
                return hadithItem;
            }
            
            // الحصول على الأحاديث المميزة حسب الوقت الحالي
            function getFeaturedHadiths() {
                const now = new Date();
                const dayOfWeek = now.getDay(); // 0 = الأحد, 1 = الاثنين, ..., 6 = السبت
                const month = now.getMonth() + 1; // 1 = يناير, ..., 12 = ديسمبر
                
                let featuredTags = [];
                
                // تحديد الوسوم حسب الوقت الحالي
                if (month === 9) { // رمضان
                    featuredTags = ["صوم", "رمضان", "قيام", "تهجد"];
                } else if (dayOfWeek === 5) { // الجمعة
                    featuredTags = ["جمعة", "صلاة", "خطبة", "دعاء"];
                } else if (month === 12) { // ذو الحجة
                    featuredTags = ["حج", "أضحية", "عرفة"];
                } else {
                    // وسوم عامة
                    featuredTags = ["إيمان", "أخلاق", "صلاة", "زكاة"];
                }
                
                // تصفية الأحاديث التي تحتوي على الوسوم المحددة
                return hadithDatabase.filter(hadith => 
                    hadith.tags && hadith.tags.some(tag => featuredTags.includes(tag))
                );
            }
            
            // الحصول على الأحاديث اليومية
            function getDailyHadiths() {
                // استخدام تاريخ اليوم لاختيار حديث معين
                const today = new Date();
                const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
                
                // اختيار الأحاديث بناءً على يوم السنة
                return hadithDatabase.filter((hadith, index) => index % hadithDatabase.length === dayOfYear % hadithDatabase.length);
            }
            
            // عرض الأحاديث المفضلة
            function displayFavorites() {
                const favorites = JSON.parse(localStorage.getItem('favoriteHadiths')) || [];
                favoritesContent.innerHTML = '';
                
                if (favorites.length === 0) {
                    favoritesContent.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-info-circle"></i>
                            <p>لا توجد أحاديث في المفضلة</p>
                        </div>
                    `;
                    return;
                }
                
                const favoriteHadiths = hadithDatabase.filter(hadith => favorites.includes(hadith.id));
                const hadithList = document.createElement('div');
                hadithList.className = 'hadith-list';
                
                favoriteHadiths.forEach(hadith => {
                    hadithList.appendChild(createHadithElement(hadith));
                });
                
                favoritesContent.appendChild(hadithList);
            }

            // البحث عن الأحاديث
            function searchHadiths() {
                const searchTerm = searchInput.value.trim().toLowerCase();
                const normalizedSearchTerm = normalizeArabicText(searchTerm);
                
                if (searchTerm === '') {
                    searchResults.style.display = 'none';
                    hadithContent.style.display = 'block';
                    pagination.style.display = 'flex';
                    return;
                }
                
                // البحث في قاعدة البيانات الحالية (المصفاة حسب الكتاب)
                const results = hadithDatabase.filter(hadith => {
                    const text = normalizeArabicText(hadith.text.toLowerCase());
                    const source = normalizeArabicText(hadith.source.toLowerCase());
                    const grade = hadith.grade ? normalizeArabicText(hadith.grade.toLowerCase()) : '';
                    const tags = hadith.tags ? hadith.tags.map(tag => normalizeArabicText(tag.toLowerCase())).join(' ') : '';
                    
                    return text.includes(normalizedSearchTerm) || 
                           source.includes(normalizedSearchTerm) ||
                           grade.includes(normalizedSearchTerm) ||
                           tags.includes(normalizedSearchTerm);
                });
                
                displaySearchResults(results);
            }
            
            // عرض نتائج البحث
            function displaySearchResults(results) {
                searchResults.innerHTML = '';
                pagination.style.display = 'none';
                
                if (results.length === 0) {
                    searchResults.innerHTML = '<p class="no-results">لا توجد نتائج مطابقة للبحث. حاول استخدام كلمات أخرى.</p>';
                } else {
                    const resultList = document.createElement('div');
                    resultList.className = 'hadith-list';
                    
                    results.forEach(hadith => {
                        resultList.appendChild(createHadithElement(hadith));
                    });
                    
                    searchResults.appendChild(resultList);
                }
                
                searchResults.style.display = 'block';
                hadithContent.style.display = 'none';
            }

            // إدارة الأحاديث المفضلة
            function toggleFavorite(hadithId, button) {
                let favorites = JSON.parse(localStorage.getItem('favoriteHadiths')) || [];
                const index = favorites.indexOf(hadithId);
                
                if (index === -1) {
                    favorites.push(hadithId);
                    button.innerHTML = '<i class="fas fa-heart"></i>';
                    showToast('تم إضافة الحديث إلى المفضلة');
                } else {
                    favorites.splice(index, 1);
                    button.innerHTML = '<i class="far fa-heart"></i>';
                    showToast('تم إزالة الحديث من المفضلة');
                }
                
                localStorage.setItem('favoriteHadiths', JSON.stringify(favorites));
                
                // إذا كانت قائمة المفضلة مفتوحة، قم بتحديثها
                if (favoritesSection.classList.contains('active')) {
                    displayFavorites();
                }
            }

            // مشاركة الحديث
            async function shareHadith(hadith) {
                try {
                    if (navigator.share) {
                        await navigator.share({
                            title: `حديث من ${hadith.source}`,
                            text: `${hadith.text}\n\n${hadith.source} - ${hadith.sourceDetails}`,
                        });
                    } else {
                        await navigator.clipboard.writeText(
                            `${hadith.text}\n\n${hadith.source} - ${hadith.sourceDetails}\n\nمشاركة من تطبيق توبة`
                        );
                        showToast('تم نسخ الحديث إلى الحافظة!');
                    }
                } catch (err) {
                    console.error('خطأ في المشاركة:', err);
                    showToast('حدث خطأ أثناء المشاركة', true);
                }
            }

            // عرض مؤشر التحميل
            function showLoader() {
                hadithContent.innerHTML = `
                    <div class="loader">
                        <i class="fas fa-spinner fa-spin"></i> جاري تحميل الأحاديث...
                    </div>
                `;
            }
            
            // عرض هيكل التحميل
            function showSkeletonLoader() {
                hadithContent.innerHTML = '';
                
                const skeletonList = document.createElement('div');
                skeletonList.className = 'hadith-list';
                
                for (let i = 0; i < 5; i++) {
                    const skeletonItem = document.createElement('div');
                    skeletonItem.className = 'hadith-item skeleton';
                    skeletonItem.innerHTML = `
                        <div class="skeleton-header"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text" style="width: 80%"></div>
                        <div class="skeleton-text" style="width: 60%"></div>
                        <div class="skeleton-text" style="width: 40%"></div>
                        <div class="skeleton-footer"></div>
                    `;
                    skeletonList.appendChild(skeletonItem);
                }
                
                hadithContent.appendChild(skeletonList);
            }

            // عرض رسالة تنبيه
            function showToast(message, isError = false) {
                notification.textContent = message;
                notification.className = 'notification';
                notification.classList.add(isError ? 'error' : 'success');
                
                setTimeout(() => {
                    notification.classList.remove('success', 'error');
                }, 3000);
            }

            // أحداث DOM
            searchBtn.addEventListener('click', searchHadiths);
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    searchHadiths();
                }
            });
            
            // زر القائمة المنسدلة للأجهزة المحمولة
            hamburger.addEventListener('click', function() {
                navLinks.classList.toggle('active');
            });

            // زر العودة للأعلى
            scrollTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.add('active');
                } else {
                    scrollTopBtn.classList.remove('active');
                }
            });
            
            document.getElementById('current-year').textContent = new Date().getFullYear();
            
            // إدارة القوائم المنسدلة
            const dropdownBtns = document.querySelectorAll('.dropdown-btn');
            dropdownBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropdown = this.closest('.dropdown');
                    dropdown.classList.toggle('active');
                });
            });

            document.addEventListener('click', function() {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            });
            
            // تصفية الأحاديث حسب الفئة
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // إزالة النشط من جميع الأزرار
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    // إضافة النشط للزر المحدد
                    this.classList.add('active');
                    
                    const filter = this.dataset.filter;
                    currentFilter = filter;
                    
                    if (filter === 'all') {
                        favoritesSection.classList.remove('active');
                        hadithContent.style.display = 'block';
                        displayHadiths(1);
                        setupPagination();
                    } else if (filter === 'featured') {
                        favoritesSection.classList.remove('active');
                        hadithContent.style.display = 'block';
                        displayHadiths(1);
                        setupPagination();
                    } else if (filter === 'daily') {
                        favoritesSection.classList.remove('active');
                        hadithContent.style.display = 'block';
                        displayHadiths(1);
                        setupPagination();
                    }
                });
            });
            
            // زر المفضلة
            favoritesBtn.addEventListener('click', function() {
                // إزالة النشط من جميع الأزرار
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // إضافة النشط لزر المفضلة
                this.classList.add('active');
                
                favoritesSection.classList.add('active');
                hadithContent.style.display = 'none';
                pagination.style.display = 'none';
                
                displayFavorites();
            });
        });