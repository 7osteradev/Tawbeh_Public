        document.addEventListener('DOMContentLoaded', function() {
            const hamburger = document.getElementById('hamburger');
            const navLinks = document.getElementById('navLinks');
            const scrollTopBtn = document.getElementById('scrollTop');
            const notification = document.getElementById('notification');
            const errorMessage = document.getElementById('errorMessage');
            const retryErrorButton = document.getElementById('retryErrorButton');
            const prayerTimesSection = document.getElementById('prayer-times-section');
            
            const sunriseTime = document.getElementById('sunriseTime');
            const fajrTime = document.getElementById('fajrTime');
            const dhuhrTime = document.getElementById('dhuhrTime');
            const asrTime = document.getElementById('asrTime');
            const maghribTime = document.getElementById('maghribTime');
            const ishaTime = document.getElementById('ishaTime');
            
            const nextPrayerInfo = document.getElementById('nextPrayerInfo');
            const remainingTime = document.getElementById('remainingTime');
            
            const compassStatus = document.getElementById('compassStatus');
            const qiblaDegree = document.getElementById('qiblaDegree');
            const compassAccuracy = document.getElementById('compassAccuracy');
            const startCompass = document.getElementById('startCompass');
            const stopCompass = document.getElementById('stopCompass');
            const compassArrow = document.querySelector('.compass-arrow');
            const compassMarkers = document.getElementById('compassMarkers');
            
            const prayerAlert = document.getElementById('prayerAlert');
            const alertPrayerName = document.getElementById('alertPrayerName');
            const athanAudio = document.getElementById('athanAudio');
            const stopAthan = document.getElementById('stopAthan');
            const closeAlert = document.getElementById('closeAlert');
            const athanButtons = document.querySelectorAll('.athan-btn');
            
            let prayerTimesData = {};
            let nextPrayerTimer = null;
            let compassWatchId = null;
            let userLocation = {};
            let activeAlarms = {
                fajr: false,
                dhuhr: false,
                asr: false,
                maghrib: false,
                isha: false
            };
            
            // التحقق مما إذا كان الجهاز محمولاً
            function isMobileDevice() {
                return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
            };

            initPage();

            function initPage() {
                hamburger.addEventListener('click', toggleMenu);
                
                scrollTopBtn.addEventListener('click', scrollToTop);
                window.addEventListener('scroll', toggleScrollTopButton);
                
                // إخفاء أزرار البوصلة إذا كان الجهاز ليس محمولاً
                if (!isMobileDevice()) {
                    startCompass.style.display = 'none';
                    stopCompass.style.display = 'none';
                    compassStatus.textContent = "هذه الميزة متاحة فقط على الأجهزة المحمولة";
                } else {
                    startCompass.addEventListener('click', startCompassFunction);
                    stopCompass.addEventListener('click', stopCompassFunction);
                }
                
                stopAthan.addEventListener('click', stopAthanFunction);
                closeAlert.addEventListener('click', closeAlertFunction);
                retryErrorButton.addEventListener('click', fetchPrayerTimes);
                
                athanButtons.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const prayer = this.getAttribute('data-prayer');
                        toggleAthanAlarm(prayer);
                    });
                });
                
                createCompassMarkers();
                fetchPrayerTimes();
                loadAlarms();
                
                // تحديث السنة الحالية
                document.getElementById('current-year').textContent = new Date().getFullYear();
            }

            function createCompassMarkers() {
                // إضافة علامات الاتجاهات على البوصلة
                for (let i = 0; i < 360; i += 15) {
                    const marker = document.createElement('div');
                    marker.className = 'compass-marker';
                    if (i % 90 === 0) {
                        marker.className += ' main';
                        const directionText = document.createElement('div');
                        directionText.style.position = 'absolute';
                        directionText.style.left = '50%';
                        directionText.style.transform = 'translateX(-50%)';
                        directionText.style.top = '15px';
                        directionText.style.fontSize = '12px';
                        directionText.style.fontWeight = 'bold';
                        
                        if (i === 0) directionText.textContent = 'N';
                        else if (i === 90) directionText.textContent = 'E';
                        else if (i === 180) directionText.textContent = 'S';
                        else if (i === 270) directionText.textContent = 'W';
                        
                        marker.appendChild(directionText);
                    }
                    marker.style.transform = `rotate(${i}deg) translateY(-95%)`;
                    compassMarkers.appendChild(marker);
                }
            }

            function toggleMenu() {
                navLinks.classList.toggle('active');
                const isExpanded = navLinks.classList.contains('active');
                hamburger.setAttribute('aria-expanded', isExpanded);
            }

            function scrollToTop() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

            function toggleScrollTopButton() {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.add('active');
                } else {
                    scrollTopBtn.classList.remove('active');
                }
            }

            function showNotification(message, type) {
                notification.textContent = message;
                notification.className = 'notification ' + type;
                
                setTimeout(() => {
                    notification.classList.remove('success', 'error');
                    setTimeout(() => {
                        notification.className = 'notification';
                    }, 500);
                }, 3000);
            }

            function showError() {
                errorMessage.classList.remove('hidden');
                prayerTimesSection.classList.add('hidden');
            }

            function hideError() {
                errorMessage.classList.add('hidden');
                prayerTimesSection.classList.remove('hidden');
            }

            function fetchPrayerTimes() {
                const loadingText = "جاري التحميل...";
                
                sunriseTime.textContent = loadingText;
                fajrTime.textContent = loadingText;
                dhuhrTime.textContent = loadingText;
                asrTime.textContent = loadingText;
                maghribTime.textContent = loadingText;
                ishaTime.textContent = loadingText;
                nextPrayerInfo.textContent = "جاري تحديد موعد الصلاة القادمة...";
                remainingTime.textContent = "--:--:--";
                
                hideError();

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const latitude = position.coords.latitude;
                            const longitude = position.coords.longitude;
                            userLocation = { latitude, longitude };
                            fetchPrayerTimesData(latitude, longitude);
                        },
                        error => {
                            console.error('Error getting location:', error);
                            fetchLocationByIP();
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                        }
                    );
                } else {
                    fetchLocationByIP();
                }
            }

            function fetchLocationByIP() {
                fetch('https://ipapi.co/json/')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data && data.latitude && data.longitude) {
                            userLocation = { latitude: data.latitude, longitude: data.longitude };
                            fetchPrayerTimesData(data.latitude, data.longitude, data.city, data.country_name);
                        } else {
                            throw new Error('Invalid location data');
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching location by IP:', error);
                        showError();
                        showNotification("تعذر تحديد موقعك. يرجى التحقق من اتصال الإنترنت", "error");
                    });
            }

            function fetchPrayerTimesData(latitude, longitude, city = '', country = '') {
                // إضافة التاريخ الحالي لضمان الحصول على أوقات اليوم الصحيحة
                const today = new Date();
                const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
                const method = 4;
                const apiUrl = `https://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

                fetch(apiUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("API Response:", data);
                        
                        if (data && data.data && data.data.timings) {
                            const timings = data.data.timings;
                            prayerTimesData = {
                                timings: timings,
                                date: data.data.date,
                                meta: data.data.meta
                            };
                            
                            displayPrayerTimes(timings);
                            
                            // حساب الصلاة التالية فوراً
                            calculateNextPrayer(timings);
                            
                            // بدء العد التنازلي كل ثانية
                            if (nextPrayerTimer) clearInterval(nextPrayerTimer);
                            nextPrayerTimer = setInterval(() => calculateNextPrayer(timings), 1000);
                            
                            checkAlarms();
                            
                            // إظهار رسالة نجاح
                            showNotification("تم تحميل مواقيت الصلاة بنجاح", "success");
                        } else {
                            throw new Error('Prayer times data not available');
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching prayer times:', error);
                        showError();
                        showNotification("تعذر جلب مواقيت الصلاة. يرجى التحقق من اتصال الإنترنت", "error");
                    });
            }

            function displayPrayerTimes(timings) {
                sunriseTime.textContent = convertTo12HourFormat(timings.Sunrise);
                fajrTime.textContent = convertTo12HourFormat(timings.Fajr);
                dhuhrTime.textContent = convertTo12HourFormat(timings.Dhuhr);
                asrTime.textContent = convertTo12HourFormat(timings.Asr);
                maghribTime.textContent = convertTo12HourFormat(timings.Maghrib);
                ishaTime.textContent = convertTo12HourFormat(timings.Isha);
            }

            function convertTo12HourFormat(time) {
                const [hours, minutes] = time.split(':');
                let period = 'ص';
                let adjustedHours = parseInt(hours);

                if (adjustedHours >= 12) {
                    period = 'م';
                    if (adjustedHours > 12) {
                        adjustedHours -= 12;
                    }
                }

                if (adjustedHours === 0) {
                    adjustedHours = 12;
                }

                return `${adjustedHours}:${minutes} ${period}`;
            }

            // دالة محسنة لحساب الوقت المتبقي للصلاة التالية مع حساب الثواني
            function calculateNextPrayer(timings) {
                const now = new Date();
                const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
                
                // تحويل أوقات الصلاة إلى ثوانٍ من بداية اليوم
                const prayerTimesInSeconds = {
                    Fajr: convertTimeToSeconds(timings.Fajr),
                    Dhuhr: convertTimeToSeconds(timings.Dhuhr),
                    Asr: convertTimeToSeconds(timings.Asr),
                    Maghrib: convertTimeToSeconds(timings.Maghrib),
                    Isha: convertTimeToSeconds(timings.Isha)
                };
                
                let nextPrayer = null;
                let nextPrayerName = '';
                let timeRemainingInSeconds = 0;
                
                // البحث عن الصلاة التالية
                const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                
                for (const prayer of prayers) {
                    if (prayerTimesInSeconds[prayer] > currentTimeInSeconds) {
                        nextPrayer = prayer;
                        nextPrayerName = getPrayerArabicName(prayer);
                        timeRemainingInSeconds = prayerTimesInSeconds[prayer] - currentTimeInSeconds;
                        break;
                    }
                }
                
                // إذا لم نجد صلاة تالية (أي أننا بعد العشاء)، نعتبر الفجر هو الصلاة التالية (في اليوم التالي)
                if (!nextPrayer) {
                    nextPrayer = 'Fajr';
                    nextPrayerName = getPrayerArabicName('Fajr');
                    // الوقت المتبقي = (24 ساعة - الوقت الحالي) + وقت الفجر
                    timeRemainingInSeconds = (24 * 3600 - currentTimeInSeconds) + prayerTimesInSeconds.Fajr;
                }
                
                // تحويل الثواني إلى ساعات ودقائق وثواني
                const hours = Math.floor(timeRemainingInSeconds / 3600);
                const minutes = Math.floor((timeRemainingInSeconds % 3600) / 60);
                const seconds = timeRemainingInSeconds % 60;
                
                // تحديث واجهة المستخدم
                nextPrayerInfo.innerHTML = `الوقت المتبقي لصلاة <span style="color: var(--gold); font-weight: bold;">${nextPrayerName}</span>:`;
                remainingTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // التحقق إذا حان وقت صلاة حالية
                checkCurrentPrayer(prayerTimesInSeconds, currentTimeInSeconds);
            }

            // دالة لتحويل الوقت من صيغة "HH:MM" إلى ثوانٍ
            function convertTimeToSeconds(timeStr) {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return (hours * 60 + minutes) * 60;
            }

            // دالة محسنة للتحقق من الصلاة الحالية باستخدام الثواني
            function checkCurrentPrayer(prayerTimesInSeconds, currentTimeInSeconds) {
                const prayerThreshold = 120; // 120 ثانية (دقيقتين)
                
                const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
                
                for (const prayer of prayers) {
                    // التحقق إذا كنا ضمن نطاق 2 دقيقة من وقت الصلاة
                    if (Math.abs(currentTimeInSeconds - prayerTimesInSeconds[prayer]) <= prayerThreshold) {
                        if (activeAlarms[prayer.toLowerCase()]) {
                            showPrayerAlert(prayer);
                            break;
                        }
                    }
                }
            }

            function getPrayerArabicName(prayer) {
                const prayerNames = {
                    'Fajr': 'الفجر',
                    'Dhuhr': 'الظهر',
                    'Asr': 'العصر',
                    'Maghrib': 'المغرب',
                    'Isha': 'العشاء',
                    'Sunrise': 'الشروق'
                };
                return prayerNames[prayer] || prayer;
            }

            function startCompassFunction() {
                if (!isMobileDevice()) {
                    showNotification("هذه الميزة متاحة فقط على الأجهزة المحمولة", "error");
                    return;
                }

                if (!userLocation.latitude || !userLocation.longitude) {
                    showNotification("يتم استخدام موقع مكة المكرمة للبوصلة", "error");
                    userLocation = { latitude: 21.3891, longitude: 39.8579 };
                }

                if (window.DeviceOrientationEvent) {
                    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                        DeviceOrientationEvent.requestPermission()
                            .then(permissionState => {
                                if (permissionState === 'granted') {
                                    initCompass();
                                } else {
                                    showNotification("تم رفض صلاحيات البوصلة", "error");
                                }
                            })
                            .catch(console.error);
                    } else {
                        initCompass();
                    }
                } else {
                    compassStatus.textContent = "المتصفح أو الجهاز لا يدعم البوصلة";
                    showNotification("المتصفح أو الجهاز لا يدعم البوصلة", "error");
                }
            }

            function initCompass() {
                compassStatus.textContent = "جاري تحديد اتجاه القبلة...";
                startCompass.disabled = true;
                stopCompass.disabled = false;

                const qiblaDirection = Qibla(userLocation.latitude, userLocation.longitude);
                qiblaDegree.textContent = `الزاوية: ${Math.round(qiblaDirection)}°`;

                window.addEventListener('deviceorientation', handleCompass);
            }

            function handleCompass(event) {
                if (event.alpha !== null) {
                    const alpha = event.alpha;
                    const compassHeading = 360 - alpha;
                    const qiblaDirection = Qibla(userLocation.latitude, userLocation.longitude);
                    const angle = (compassHeading - qiblaDirection + 360) % 360;
                    
                    compassArrow.style.transform = `translateX(-50%) rotate(${angle}deg)`;
                    compassStatus.textContent = "البوصلة نشطة - وجه الجهاز نحو القبلة";
                    
                    // عرض دقة البيانات إذا كانت متاحة
                    if (event.webkitCompassAccuracy !== undefined) {
                        const accuracy = event.webkitCompassAccuracy;
                        compassAccuracy.textContent = `الدقة: ${accuracy}°`;
                    }
                }
            }

            function stopCompassFunction() {
                window.removeEventListener('deviceorientation', handleCompass);
                compassStatus.textContent = "البوصلة متوقفة";
                compassArrow.style.transform = "translateX(-50%) rotate(0deg)";
                startCompass.disabled = false;
                stopCompass.disabled = true;
                compassAccuracy.textContent = "الدقة: --";
            }

            function toggleAthanAlarm(prayer) {
                activeAlarms[prayer] = !activeAlarms[prayer];
                updateAthanButton(prayer);
                saveAlarms();
                
                const prayerName = getPrayerArabicName(prayer.charAt(0).toUpperCase() + prayer.slice(1));
                const message = activeAlarms[prayer] ? 
                    `تم تفعيل التنبيه لصلاة ${prayerName}` : 
                    `تم إلغاء التنبيه لصلاة ${prayerName}`;
                
                showNotification(message, "success");
            }

            function updateAthanButton(prayer) {
                const button = document.querySelector(`.athan-btn[data-prayer="${prayer}"]`);
                if (button) {
                    if (activeAlarms[prayer]) {
                        button.innerHTML = '<i class="fas fa-bell-slash"></i> إلغاء التنبيه';
                        button.style.backgroundColor = "#f44336";
                    } else {
                        button.innerHTML = '<i class="fas fa-bell"></i> تنبيه';
                        button.style.backgroundColor = "";
                    }
                }
            }

            function showPrayerAlert(prayer) {
                const prayerName = getPrayerArabicName(prayer);
                alertPrayerName.textContent = `حان وقت صلاة ${prayerName}`;
                
                athanAudio.currentTime = 0;
                athanAudio.play().catch(e => console.error('Error playing athan:', e));
                
                prayerAlert.style.display = 'flex';
                
                setTimeout(() => {
                    if (!prayerAlert.style.display || prayerAlert.style.display !== 'none') {
                        stopAthanFunction();
                    }
                }, 5 * 60 * 1000);
            }

            function stopAthanFunction() {
                athanAudio.pause();
                athanAudio.currentTime = 0;
                prayerAlert.style.display = 'none';
            }

            function closeAlertFunction() {
                stopAthanFunction();
            }

            function checkAlarms() {
                if (!prayerTimesData.timings) return;
                
                const now = new Date();
                const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
                const prayerTimesInSeconds = {
                    fajr: convertTimeToSeconds(prayerTimesData.timings.Fajr),
                    dhuhr: convertTimeToSeconds(prayerTimesData.timings.Dhuhr),
                    asr: convertTimeToSeconds(prayerTimesData.timings.Asr),
                    maghrib: convertTimeToSeconds(prayerTimesData.timings.Maghrib),
                    isha: convertTimeToSeconds(prayerTimesData.timings.Isha)
                };
                
                const prayerThreshold = 120; // 120 ثانية (دقيقتين)
                
                for (const [prayer, time] of Object.entries(prayerTimesInSeconds)) {
                    if (Math.abs(currentTimeInSeconds - time) <= prayerThreshold && activeAlarms[prayer]) {
                        showPrayerAlert(prayer);
                        break;
                    }
                }
            }

            function saveAlarms() {
                localStorage.setItem('prayerAlarms', JSON.stringify(activeAlarms));
            }

            function loadAlarms() {
                const savedAlarms = localStorage.getItem('prayerAlarms');
                if (savedAlarms) {
                    activeAlarms = JSON.parse(savedAlarms);
                    
                    for (const prayer in activeAlarms) {
                        if (activeAlarms[prayer]) {
                            updateAthanButton(prayer);
                        }
                    }
                }
            }
        });