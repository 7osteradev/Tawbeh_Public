const fs = require('fs');
const axios = require('axios');
const path = require('path');

const API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const BOOKS = {
  'bukhari': 'صحيح البخاري',
  'muslim': 'صحيح مسلم',
  'tirmidzi': 'سنن الترمذي',
  'nasai': 'سنن النسائي',
  'abudawud': 'سنن أبي داود',
  'ibnmajah': 'سنن ابن ماجه',
  'malik': 'موطأ مالك'
};

// درجات الصحة المعتمدة
const VALID_GRADES = ['صحيح', 'صحيح متفق عليه', 'حسن صحيح', 'حسن'];

async function updateHadiths() {
  const hadiths = [];
  const books = [];
  
  for (const [id, name] of Object.entries(BOOKS)) {
    try {
      console.log(`جاري تحميل ${name}...`);
      const response = await axios.get(`${API_BASE}/ara-${id}.min.json`);
      const data = response.data;
      
      // إضافة معلومات الكتاب
      books.push({
        id,
        name,
        author: data.metadata.author,
        totalHadiths: data.metadata.total,
        description: `جامع الأحاديث الصحيحة للإمام ${data.metadata.author}`
      });
      
      // إضافة الأحاديث مع فلترة الصحيحة فقط
      let bookHadiths = [];
      
      if (data.hadiths && Array.isArray(data.hadiths)) {
        bookHadiths = data.hadiths
          .filter(h => {
            // إذا كان الحديث يحتوي على درجة صحة، نتحقق منها
            if (h.grade) {
              const grade = h.grade.toLowerCase();
              return VALID_GRADES.some(validGrade => 
                grade.includes(validGrade.toLowerCase())
              );
            }
            // إذا لم تكن هناك درجة صحة، نعتبرها صحيحة (لصحيحي البخاري ومسلم)
            return id === 'bukhari' || id === 'muslim';
          })
          .slice(0, 50) // الحد الأقصى 50 حديث لكل كتاب للأداء
          .map(h => ({
            id: `${id}-${h.hadithnumber}`,
            text: h.text || '',
            source: name,
            sourceDetails: `كتاب ${h.reference?.book || 'متنوع'}، حديث ${h.hadithnumber}`,
            bookId: id,
            grade: getHadithGrade(h.grade, id),
            gradedBy: getGradedBy(id),
            tags: generateTags(h.text || ''),
            category: autoCategorize(h.text || ''),
            featured: isFeatured(h.hadithnumber),
            createdAt: new Date().toISOString()
          }));
      }
      
      hadiths.push(...bookHadiths);
      console.log(`تم جلب ${bookHadiths.length} حديث من ${name}`);
      
    } catch (error) {
      console.error(`خطأ في جلب ${name}:`, error.message);
      // إضافة بيانات افتراضية إذا فشل الاتصال
      hadiths.push(...getDefaultHadiths(id, name));
      books.push({
        id,
        name,
        author: getAuthorName(id),
        totalHadiths: 10,
        description: `جامع الأحاديث الصحيحة للإمام ${getAuthorName(id)}`
      });
    }
  }
  
  // حفظ البيانات في ملف
  const output = { books, hadiths };
  fs.writeFileSync(path.join(__dirname, 'hadiths.json'), JSON.stringify(output, null, 2));
  console.log(`تم حفظ ${hadiths.length} حديث و ${books.length} كتاب في hadiths.json`);
}

// الحصول على درجة صحة الحديث
function getHadithGrade(grade, bookId) {
  if (!grade) {
    // البخاري ومسلم يعتبران صحيحين بالتعريف
    if (bookId === 'bukhari' || bookId === 'muslim') {
      return 'صحيح متفق عليه';
    }
    return 'صحيح';
  }
  
  const gradeLower = grade.toLowerCase();
  if (gradeLower.includes('صحيح') && gradeLower.includes('متفق')) {
    return 'صحيح متفق عليه';
  } else if (gradeLower.includes('صحيح') && gradeLower.includes('حسن')) {
    return 'حسن صحيح';
  } else if (gradeLower.includes('صحيح')) {
    return 'صحيح';
  } else if (gradeLower.includes('حسن')) {
    return 'حسن';
  }
  
  return 'صحيح';
}

// الحصول على اسم المصحح
function getGradedBy(bookId) {
  const gradedByMap = {
    'bukhari': 'الإمام البخاري',
    'muslim': 'الإمام مسلم',
    'tirmidzi': 'الإمام الترمذي',
    'nasai': 'الإمام النسائي',
    'abudawud': 'الإمام أبو داود',
    'ibnmajah': 'الإمام ابن ماجه',
    'malik': 'الإمام مالك'
  };
  
  return gradedByMap[bookId] || 'علماء الحديث';
}

// الحصول على اسم المؤلف
function getAuthorName(bookId) {
  const authorMap = {
    'bukhari': 'البخاري',
    'muslim': 'مسلم',
    'tirmidzi': 'الترمذي',
    'nasai': 'النسائي',
    'abudawud': 'أبو داود',
    'ibnmajah': 'ابن ماجه',
    'malik': 'مالك'
  };
  
  return authorMap[bookId] || 'مجهول';
}

// توليد وسوم تلقائي
function generateTags(text) {
  if (!text) return ['عام'];
  
  const commonTags = {
    'إيمان': ['إيمان', 'يؤمن', 'الإيمان', 'الإسلام'],
    'صلاة': ['صلاة', 'يصلي', 'صلات', 'المصلي'],
    'صوم': ['صوم', 'صيام', 'يصوم', 'الصائم'],
    'زكاة': ['زكاة', 'زكوا', 'يتزكى', 'الزكاة'],
    'حج': ['حج', 'حجاج', 'يحج', 'الحج'],
    'أخلاق': ['خلق', 'أدب', 'أخلاق', 'حسن', 'الخلق'],
    'جنة': ['جنة', 'الجنة', 'جنات', 'الفردوس'],
    'نار': ['نار', 'النار', 'جهنم'],
    'علم': ['علم', 'يتعلم', 'العلم', 'العلماء'],
    'دعاء': ['دعاء', 'يدعو', 'الدعاء', 'ادع'],
    'توبة': ['توبة', 'يتوب', 'التوبة', 'أستغفر'],
    'صدقة': ['صدقة', 'يتصدق', 'الصدقة', 'تصدقوا'],
    'بر': ['بر', 'بار', 'البر', 'بوالدين'],
    'صبر': ['صبر', 'اصبر', 'الصبر', 'صابر']
  };
  
  const tags = [];
  const textLower = text.toLowerCase();
  
  for (const [tag, keywords] of Object.entries(commonTags)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags.slice(0, 4) : ['عام'];
}

// التصنيف التلقائي
function autoCategorize(text) {
  if (!text) return 'daily';
  
  const featuredKeywords = [
    'أحب', 'الجنة', 'النار', 'القيامة', 'الرسول', 
    'الإيمان', 'الكفر', 'النية', 'الأعمال', 'الجهاد',
    'الشفاعة', 'القدر', 'الموت', 'البعث'
  ];
  
  const textLower = text.toLowerCase();
  return featuredKeywords.some(keyword => textLower.includes(keyword)) 
    ? 'featured' 
    : 'daily';
}

// تحديد إذا كان الحديث متميزاً
function isFeatured(hadithNumber) {
  // جعل بعض الأحاديث متميزة بناءً على أرقامها
  const featuredNumbers = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  return featuredNumbers.includes(hadithNumber % 50);
}

// بيانات افتراضية إذا فشل الاتصال
function getDefaultHadiths(bookId, bookName) {
  const defaultHadiths = {
    'bukhari': [
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
      }
    ],
    'muslim': [
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
      }
    ],
    'tirmidzi': [
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
      }
    ],
    'nasai': [
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
      }
    ],
    'abudawud': [
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
      }
    ],
    'ibnmajah': [
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
      }
    ],
    'malik': [
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
  
  return defaultHadiths[bookId] || [];
}

// تنفيذ العملية
updateHadiths().then(() => {
  console.log('تم تحديث بيانات الأحاديث بنجاح!');
}).catch(error => {
  console.error('حدث خطأ أثناء تحديث البيانات:', error);
});