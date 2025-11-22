const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'hadiths.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// تحميل بيانات الأحاديث
let hadiths = [];
let books = [];

// بيانات افتراضية شاملة
const DEFAULT_DATA = {
  books: [
    { id: 'bukhari', name: 'صحيح البخاري', author: 'الإمام البخاري', totalHadiths: 7563, description: 'أصح كتاب بعد القرآن الكريم' },
    { id: 'muslim', name: 'صحيح مسلم', author: 'الإمام مسلم', totalHadiths: 5362, description: 'ثاني أصح الكتب بعد صحيح البخاري' },
    { id: 'tirmidzi', name: 'سنن الترمذي', author: 'الإمام الترمذي', totalHadiths: 3956, description: 'جامع الترمذي' },
    { id: 'nasai', name: 'سنن النسائي', author: 'الإمام النسائي', totalHadiths: 5765, description: 'المجتبى من السنن' },
    { id: 'abudawud', name: 'سنن أبي داود', author: 'الإمام أبو داود', totalHadiths: 5274, description: 'سنن أبي داود' },
    { id: 'ibnmajah', name: 'سنن ابن ماجه', author: 'الإمام ابن ماجه', totalHadiths: 4341, description: 'سنن ابن ماجه' },
    { id: 'malik', name: 'موطأ مالك', author: 'الإمام مالك', totalHadiths: 1844, description: 'موطأ الإمام مالك' }
  ],
  hadiths: [
    // صحيح البخاري
    {
      id: 'bukhari-1',
      text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله، فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها، فهجرته إلى ما هاجر إليه",
      source: "صحيح البخاري",
      sourceDetails: "كتاب بدء الوحي، حديث 1",
      tags: ["نية", "أعمال", "هجرة"],
      category: "featured",
      bookId: "bukhari",
      grade: "صحيح متفق عليه",
      gradedBy: "الإمام البخاري",
      featured: true
    },
    {
      id: 'bukhari-2',
      text: "الكلمة الطيبة صدقة",
      source: "صحيح البخاري",
      sourceDetails: "كتاب الأدب، حديث 2",
      tags: ["أخلاق", "كلمة طيبة", "صدقة"],
      category: "daily",
      bookId: "bukhari",
      grade: "صحيح",
      gradedBy: "الإمام البخاري",
      featured: false
    },
    {
      id: 'bukhari-3',
      text: "تبسمك في وجه أخيك صدقة",
      source: "صحيح البخاري",
      sourceDetails: "كتاب الأدب، حديث 3",
      tags: ["أخلاق", "تبسم", "صدقة"],
      category: "daily",
      bookId: "bukhari",
      grade: "صحيح",
      gradedBy: "الإمام البخاري",
      featured: false
    },
    // صحيح مسلم
    {
      id: 'muslim-43',
      text: "بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمداً رسول الله، وإقام الصلاة، وإيتاء الزكاة، وحج البيت، وصوم رمضان",
      source: "صحيح مسلم",
      sourceDetails: "كتاب الإيمان، حديث 43",
      tags: ["إسلام", "أركان", "صلاة", "زكاة", "صوم"],
      category: "featured",
      bookId: "muslim",
      grade: "صحيح متفق عليه",
      gradedBy: "الإمام مسلم",
      featured: true
    },
    {
      id: 'muslim-224',
      text: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن",
      source: "صحيح مسلم",
      sourceDetails: "كتاب البر والصلة، حديث 224",
      tags: ["أخلاق", "تقوى", "توبة"],
      category: "featured",
      bookId: "muslim",
      grade: "صحيح",
      gradedBy: "الإمام مسلم",
      featured: true
    },
    // سنن الترمذي
    {
      id: 'tirmidzi-2317',
      text: "من حسن إسلام المرء تركه ما لا يعنيه",
      source: "سنن الترمذي",
      sourceDetails: "كتاب الزهد، حديث 2317",
      tags: ["إسلام", "أخلاق"],
      category: "featured",
      bookId: "tirmidzi",
      grade: "حسن",
      gradedBy: "الإمام الترمذي",
      featured: true
    },
    // سنن النسائي
    {
      id: 'nasai-1',
      text: "إن الله لا ينظر إلى صوركم وأموالكم، ولكن ينظر إلى قلوبكم وأعمالكم",
      source: "سنن النسائي",
      sourceDetails: "كتاب الإيمان، حديث 1",
      tags: ["قلوب", "أعمال", "تقوى"],
      category: "featured",
      bookId: "nasai",
      grade: "صحيح",
      gradedBy: "الإمام النسائي",
      featured: true
    },
    // سنن أبي داود
    {
      id: 'abudawud-4342',
      text: "أفضل الجهاد كلمة حق عند سلطان جائر",
      source: "سنن أبي داود",
      sourceDetails: "كتاب الملاحم، حديث 4342",
      tags: ["جهاد", "حق", "شجاعة"],
      category: "daily",
      bookId: "abudawud",
      grade: "حسن",
      gradedBy: "الإمام أبو داود",
      featured: false
    },
    // سنن ابن ماجه
    {
      id: 'ibnmajah-1',
      text: "طلب العلم فريضة على كل مسلم",
      source: "سنن ابن ماجه",
      sourceDetails: "المقدمة، حديث 1",
      tags: ["علم", "فريضة", "تعلم"],
      category: "featured",
      bookId: "ibnmajah",
      grade: "حسن",
      gradedBy: "الإمام ابن ماجه",
      featured: true
    },
    // موطأ مالك
    {
      id: 'malik-1',
      text: "بلغوا عني ولو آية، وحدثوا عن بني إسرائيل ولا حرج، ومن كذب علي متعمدا فليتبوأ مقعده من النار",
      source: "موطأ مالك",
      sourceDetails: "المقدمة، حديث 1",
      tags: ["بلاغ", "علم", "أمانة"],
      category: "featured",
      bookId: "malik",
      grade: "صحيح",
      gradedBy: "الإمام مالك",
      featured: true
    }
  ]
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      hadiths = data.hadiths || DEFAULT_DATA.hadiths;
      books = data.books || DEFAULT_DATA.books;
      
      console.log(`تم تحميل ${hadiths.length} حديث و ${books.length} كتاب`);
    } else {
      // إذا لم يكن الملف موجوداً، استخدم البيانات الافتراضية
      hadiths = DEFAULT_DATA.hadiths;
      books = DEFAULT_DATA.books;
      saveData();
      console.log('تم استخدام البيانات الافتراضية');
    }
  } catch (err) {
    console.error('خطأ في تحميل البيانات:', err);
    // استخدام البيانات الافتراضية في حالة الخطأ
    hadiths = DEFAULT_DATA.hadiths;
    books = DEFAULT_DATA.books;
  }
}

function saveData() {
  try {
    const data = { hadiths, books };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('تم حفظ البيانات بنجاح');
  } catch (err) {
    console.error('خطأ في حفظ البيانات:', err);
  }
}

// تحميل البيانات عند بدء التشغيل
loadData();

// Routes
// جلب جميع الأحاديث
app.get('/api/hadiths', (req, res) => {
  const { bookId } = req.query;
  let filteredHadiths = hadiths;
  
  // فلترة حسب الكتاب
  if (bookId && bookId !== 'all') {
    filteredHadiths = hadiths.filter(h => h.bookId === bookId);
  }
  
  res.json({ hadiths: filteredHadiths, books });
});

// جلب حديث معين
app.get('/api/hadiths/:id', (req, res) => {
  const hadith = hadiths.find(h => h.id === req.params.id);
  if (hadith) {
    res.json(hadith);
  } else {
    res.status(404).json({ error: 'الحديث غير موجود' });
  }
});

// جلب الكتب
app.get('/api/books', (req, res) => {
  res.json(books);
});

// تحديث بيانات الأحاديث
app.post('/api/update-hadiths', async (req, res) => {
  try {
    const { updateHadiths } = require('./update-hadiths');
    await updateHadiths();
    loadData(); // إعادة تحميل البيانات بعد التحديث
    res.json({ message: 'تم تحديث بيانات الأحاديث بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث البيانات' });
  }
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
});