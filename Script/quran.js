        const readers = [
            {id: "maher", name: "ماهر المعيقلي"},
            {id: "hudhaify", name: "علي الحذيفي"},
            {id: "minshawi", name: "محمد صديق المنشاوي"}
        ];

        let audio = null;
        let currentSurah = 1;
        let currentReader = readers[0];
        let surahsList = [];
        let currentSurahAyahsCount = 0;
        let ayahTimings = [];
        let currentHighlightedAyah = null;
        let searchTimeout = null;
        
        document.addEventListener('DOMContentLoaded', async function() {
            await loadSurahsList();
            setupEventListeners();
            loadSurah(currentSurah);
            
            initScrollTopButton();
            
            initHamburgerMenu();
        });

        async function loadSurahsList() {
            try {
                const response = await axios.get('https://api.alquran.cloud/v1/surah');
                surahsList = response.data.data;
                
                const surahSelect = document.querySelector('.surah-select');
                surahSelect.innerHTML = '';
                
                surahsList.forEach(surah => {
                    const option = document.createElement('option');
                    option.value = surah.number;
                    option.textContent = `${surah.englishName} - ${surah.name}`;
                    if (surah.number == 1) option.selected = true;
                    surahSelect.appendChild(option);
                });
                
            } catch (error) {
                console.error('Error loading surahs list:', error);
                showNotification('حدث خطأ في تحميل قائمة السور. يرجى تحديث الصفحة.', 'error');
                document.getElementById('quran-text').innerHTML = 
                    '<div class="error-message">حدث خطأ في تحميل قائمة السور. يرجى تحديث الصفحة.</div>';
            }
        }

        async function loadSurah(surahNumber) {
            const quranText = document.getElementById('quran-text');
            quranText.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>جاري تحميل السورة...</p>
                </div>
            `;
            
            try {
                const surahInfo = surahsList.find(s => s.number == surahNumber);
                document.querySelector('.surah-name').textContent = surahInfo.name;
                
                const ayahsResponse = await axios.get(
                    `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alquran-simple`
                );
                const ayahs = ayahsResponse.data.data.ayahs;
                currentSurahAyahsCount = ayahs.length;
                
                generateAyahTimings(ayahs.length);
                
                let html = '<div class="ayahs-container">';
                
                if (surahNumber !== 9) {
                    html += '<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
                }
                
                ayahs.forEach(ayah => {
                    let ayahText = ayah.text;
                    
                    if (ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
                        ayahText = ayahText.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', '').trim();
                    }
                    
                    html += `
                        <span class="ayah" data-ayah="${ayah.numberInSurah}" data-surah="${surahNumber}">
                            ${ayahText}
                            <span class="ayah-number">${ayah.numberInSurah}</span>
                            <div class="tafsir-popup">
                                <div class="tafsir-title">
                                    <i class="fas fa-book"></i> تفسير الطبري (${surahInfo.name}:${ayah.numberInSurah})
                                </div>
                                <div class="tafsir-text" id="tafsir-${surahNumber}-${ayah.numberInSurah}">
                                    <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
                                    جاري تحميل التفسير...
                                </div>
                            </div>
                        </span>
                    `;
                });
                
                html += '</div>';
                quranText.innerHTML = html;
                
                document.querySelectorAll('.ayah').forEach(ayahEl => {
                    ayahEl.addEventListener('mouseenter', function() {
                        const popup = this.querySelector('.tafsir-popup');
                        popup.style.display = 'block';
                        
                        const ayahNum = this.getAttribute('data-ayah');
                        const surahNum = this.getAttribute('data-surah');
                        loadTafsir(surahNum, ayahNum);
                    });
                    
                    ayahEl.addEventListener('mouseleave', function() {
                        const popup = this.querySelector('.tafsir-popup');
                        popup.style.display = 'none';
                    });
                });
                
            } catch (error) {
                showNotification('حدث خطأ أثناء تحميل السورة. يرجى المحاولة لاحقًا.', 'error');
                quranText.innerHTML = '<div class="error-message">حدث خطأ أثناء تحميل السورة. يرجى المحاولة لاحقًا.</div>';
                console.error('Error loading surah:', error);
            }
        }

        function generateAyahTimings(totalAyahs) {
            ayahTimings = [];
            for (let i = 0; i < totalAyahs; i++) {
                ayahTimings.push({
                    start: (i / totalAyahs) * 100,
                    end: ((i + 1) / totalAyahs) * 100
                });
            }
        }

        async function loadTafsir(surahNumber, ayahNumber) {
            const tafsirEl = document.getElementById(`tafsir-${surahNumber}-${ayahNumber}`);
            if (!tafsirEl.innerHTML.includes('جاري تحميل التفسير...')) return;
            
            try {
                const response = await axios.get(
                    `https://quranenc.com/api/v1/translation/aya/arabic_moyassar/${surahNumber}/${ayahNumber}`
                );
                
                if (response.data.result && response.data.result.translation) {
                    tafsirEl.innerHTML = response.data.result.translation;
                } else {
                    tafsirEl.innerHTML = 'لا يوجد تفسير متاح لهذه الآية.';
                }
            } catch (error) {
                console.error('Error loading tafsir:', error);
                try {
                    const backupResponse = await axios.get(
                        `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.maududi`
                    );
                    tafsirEl.innerHTML = backupResponse.data.data.text || 'لا يوجد تفسير متاح.';
                } catch (backupError) {
                    tafsirEl.innerHTML = 'تعذر تحميل التفسير. يرجى المحاولة لاحقًا.';
                }
            }
        }

        async function playSurah() {
            if (audio && audio.currentTime > 0) {
                audio.play().catch(e => {
                    console.error('Error playing audio:', e);
                    showAudioError();
                });
                document.querySelector('.play-btn').style.display = 'none';
                document.querySelector('.pause-btn').style.display = 'flex';
                return;
            }
            
            if (audio) {
                audio.pause();
                audio = null;
            }
            
            currentReader = readers[document.querySelector('.reader-select').selectedIndex];
            currentSurah = document.querySelector('.surah-select').value;
            
            document.querySelector('.play-btn').style.display = 'none';
            document.querySelector('.pause-btn').style.display = 'flex';
            document.querySelector('.progress-bar').style.width = '0%';
            
            const audioPath = `audio/${currentReader.id}/${currentSurah.toString().padStart(3, '0')}.mp3`;
            
            audio = new Audio(audioPath);
            
            audio.addEventListener('canplaythrough', function() {
                updateTimeDisplay();
                document.querySelector('.pause-btn').innerHTML = `<i class="fas fa-pause"></i> إيقاف`;
                audio.play().catch(e => {
                    console.error('Error playing audio:', e);
                    showAudioError();
                });
            });
            
            audio.addEventListener('error', function() {
                console.error('Error loading audio file');
                showAudioError();
            });
            
            audio.addEventListener('timeupdate', function() {
                const progress = (audio.currentTime / audio.duration) * 100;
                document.querySelector('.progress-bar').style.width = `${progress}%`;
                updateTimeDisplay();
                
                highlightCurrentAyah(progress);
            });
            
            audio.addEventListener('ended', function() {
                document.querySelector('.play-btn').style.display = 'flex';
                document.querySelector('.pause-btn').style.display = 'none';
                
                if (currentHighlightedAyah) {
                    currentHighlightedAyah.classList.remove('highlighted');
                    currentHighlightedAyah = null;
                }
            });
        }

        function highlightCurrentAyah(progress) {
            if (!ayahTimings.length) return;
            
            const currentAyah = ayahTimings.findIndex(
                timing => progress >= timing.start && progress < timing.end
            );
            
            if (currentAyah !== -1) {
                const ayahNum = currentAyah + 1;
                const ayahElement = document.querySelector(`.ayah[data-ayah="${ayahNum}"]`);
                
                if (ayahElement && ayahElement !== currentHighlightedAyah) {
                    if (currentHighlightedAyah) {
                        currentHighlightedAyah.classList.remove('highlighted');
                    }
                    
                    ayahElement.classList.add('highlighted');
                    currentHighlightedAyah = ayahElement;
                    
                    ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function seekAudio(seconds) {
            if (!audio) return;
            
            const newTime = audio.currentTime + seconds;
            
            if (newTime < 0) {
                audio.currentTime = 0;
            } else if (newTime > audio.duration) {
                audio.currentTime = audio.duration;
            } else {
                audio.currentTime = newTime;
            }
            
            updateTimeDisplay();
        }

        function setAudioPosition(e) {
            if (!audio) return;
            
            const progressContainer = document.getElementById('progress-container');
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pos * audio.duration;
        }

        function pauseSurah() {
            if (audio) {
                audio.pause();
                document.querySelector('.play-btn').style.display = 'flex';
                document.querySelector('.pause-btn').style.display = 'none';
                
                if (currentHighlightedAyah) {
                    currentHighlightedAyah.classList.remove('highlighted');
                    currentHighlightedAyah = null;
                }
            }
        }

        function updateTimeDisplay() {
            if (!audio) return;
            
            const currentTime = formatTime(audio.currentTime);
            const duration = formatTime(audio.duration);
            
            document.querySelector('.current-time').textContent = currentTime;
            document.querySelector('.duration').textContent = duration;
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function showAudioError() {
            document.querySelector('.play-btn').style.display = 'flex';
            document.querySelector('.pause-btn').style.display = 'none';
            document.querySelector('.pause-btn').innerHTML = `<i class="fas fa-pause"></i> إيقاف`;
            
            showNotification('تعذر تحميل التلاوة! يرجى التأكد من وجود ملفات الصوت.', 'error');
        }

        function performSearch() {
            const query = document.getElementById('quran-search').value.trim();
            if (!query) return;
            
            const cleanQuery = removeDiacritics(query);
            
            const surahMatch = surahsList.find(surah => {
                const cleanName = surah.name.replace('سورة', '').trim();
                const cleanEnglish = surah.englishName.toLowerCase();
                
                return (
                    surah.number.toString() === cleanQuery ||
                    cleanName === cleanQuery ||
                    removeDiacritics(cleanName) === cleanQuery ||
                    cleanEnglish === cleanQuery.toLowerCase() ||
                    cleanEnglish.includes(cleanQuery.toLowerCase())
                );
            });
            
            if (surahMatch) {
                currentSurah = surahMatch.number;
                document.querySelector('.surah-select').value = currentSurah;
                loadSurah(currentSurah);
                return;
            }
            
            const versePattern = /^(\d+):(\d+)$/;
            const verseMatch = query.match(versePattern);
            if (verseMatch) {
                const surahNum = verseMatch[1];
                const ayahNum = verseMatch[2];
                currentSurah = parseInt(surahNum);
                document.querySelector('.surah-select').value = currentSurah;
                loadSurah(currentSurah).then(() => {
                    scrollToAyah(ayahNum);
                });
                return;
            }
            
            searchInCurrentSurah(cleanQuery);
        }
        
        function removeDiacritics(text) {
            return text
                .normalize('NFD')
                .replace(/[\u064B-\u065F\u0610-\u061A]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
        
        function normalizeText(text) {
            let normalized = removeDiacritics(text);
            
            normalized = normalized.replace(/\bال/g, '');
            normalized = normalized.replace(/\bاَل/g, '');
            
            return normalized;
        }
        
        function scrollToAyah(ayahNum) {
            document.querySelectorAll('.ayah.highlighted').forEach(el => {
                el.classList.remove('highlighted');
            });
            
            const ayahElement = document.querySelector(`.ayah[data-ayah="${ayahNum}"]`);
            if (ayahElement) {
                ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ayahElement.classList.add('highlighted');
                
                setTimeout(() => {
                    ayahElement.classList.remove('highlighted');
                }, 5000);
            }
        }
        
        function searchInCurrentSurah(query) {
            const ayahs = document.querySelectorAll('.ayah');
            let found = false;
            
            document.querySelectorAll('.ayah.highlighted').forEach(el => {
                el.classList.remove('highlighted');
            });
            
            // تطبيع نص البحث
            const normalizedQuery = normalizeText(query);
            
            for (let ayah of ayahs) {
                const ayahText = ayah.textContent.replace(/\d+$/, '').trim();
                const cleanAyahText = normalizeText(ayahText);
                
                if (cleanAyahText.includes(normalizedQuery)) {
                    ayah.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    ayah.classList.add('highlighted');
                    found = true;
                    
                    setTimeout(() => {
                        ayah.classList.remove('highlighted');
                    }, 5000);
                    
                    break;
                }
            }
            
            if (!found) {
                // إذا لم يتم العثور على النص في السورة الحالية، البحث في جميع السور
                searchInAllSurahs(query);
            }
        }
        
        async function searchInAllSurahs(query) {
            try {
                const response = await axios.get(`https://api.alquran.cloud/v1/search/${query}/all/ar.alquran-simple`);
                
                if (response.data.data && response.data.data.matches && response.data.data.matches.length > 0) {
                    const match = response.data.data.matches[0];
                    const surahNum = match.surah.number;
                    const ayahNum = match.numberInSurah;
                    
                    currentSurah = surahNum;
                    document.querySelector('.surah-select').value = currentSurah;
                    
                    loadSurah(currentSurah).then(() => {
                        setTimeout(() => {
                            scrollToAyah(ayahNum);
                        }, 1000);
                    });
                } else {
                    showNotification('لم يتم العثور على النص في القرآن الكريم.', 'error');
                }
            } catch (error) {
                console.error('Error searching in all surahs:', error);
                showNotification('لم يتم العثور على النص في السورة الحالية.', 'error');
            }
        }
        
        function showSearchSuggestions(query) {
            const suggestionsContainer = document.getElementById('search-suggestions');
            
            if (!query || query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            // تصفية السور التي تطابق الاستعلام
            const matchedSurahs = surahsList.filter(surah => {
                const cleanName = surah.name.replace('سورة', '').trim();
                const cleanEnglish = surah.englishName.toLowerCase();
                const cleanQuery = removeDiacritics(query.toLowerCase());
                
                return (
                    cleanName.includes(query) ||
                    removeDiacritics(cleanName).includes(cleanQuery) ||
                    cleanEnglish.includes(cleanQuery) ||
                    surah.number.toString() === query
                );
            });
            
            if (matchedSurahs.length > 0) {
                suggestionsContainer.innerHTML = '';
                
                matchedSurahs.slice(0, 5).forEach(surah => {
                    const suggestion = document.createElement('div');
                    suggestion.className = 'search-suggestion';
                    suggestion.textContent = `${surah.name} (${surah.englishName})`;
                    
                    suggestion.addEventListener('click', () => {
                        document.getElementById('quran-search').value = surah.name;
                        suggestionsContainer.style.display = 'none';
                        currentSurah = surah.number;
                        document.querySelector('.surah-select').value = currentSurah;
                        loadSurah(currentSurah);
                    });
                    
                    suggestionsContainer.appendChild(suggestion);
                });
                
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        }
        
        function setupEventListeners() {
            document.querySelector('.play-btn').addEventListener('click', playSurah);
            document.querySelector('.pause-btn').addEventListener('click', pauseSurah);
            
            document.querySelectorAll('.seek-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const seconds = parseInt(this.getAttribute('data-seek'));
                    seekAudio(seconds);
                });
            });
            
            document.getElementById('progress-container').addEventListener('click', setAudioPosition);
            
            document.querySelector('.surah-select').addEventListener('change', function() {
                currentSurah = this.value;
                loadSurah(currentSurah);
                if (audio) pauseSurah();
            });
            
            document.querySelector('.reader-select').addEventListener('change', function() {
                currentReader = readers[this.selectedIndex];
                if (audio) pauseSurah();
            });
            
            document.getElementById('search-btn').addEventListener('click', performSearch);
            
            const searchInput = document.getElementById('quran-search');
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            // إضافة البحث أثناء الكتابة مع تأخير
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const query = this.value.trim();
                
                if (query.length > 1) {
                    showSearchSuggestions(query);
                } else {
                    document.getElementById('search-suggestions').style.display = 'none';
                }
                
                // بحث تلقائي بعد توقف الكتابة بمقدار 800 مللي ثانية
                searchTimeout = setTimeout(() => {
                    if (query.length > 2) {
                        performSearch();
                    }
                }, 800);
            });
            
            // إخفاء suggestions عند النقر خارجها
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.search-container')) {
                    document.getElementById('search-suggestions').style.display = 'none';
                }
            });
        }

        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            
            setTimeout(() => {
                notification.className = 'notification';
            }, 5000);
        }

        function initScrollTopButton() {
            const scrollTopBtn = document.getElementById('scrollTop');
            
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.add('active');
                } else {
                    scrollTopBtn.classList.remove('active');
                }
            });
            
            scrollTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        function initHamburgerMenu() {
            const hamburger = document.getElementById('hamburger');
            const navLinks = document.getElementById('navLinks');
            
            hamburger.addEventListener('click', function() {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                navLinks.classList.toggle('active');
            });
        }

        document.getElementById('current-year').textContent = new Date().getFullYear();