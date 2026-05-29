// نظام الترجمة واللغتين عند فتح البوت
const translations = {
    ar: {
        welcome: "أهلاً بك",
        boxesTitle: "🎁 الصناديق والهدايا النشطة",
        bet: "ضع رهانك",
        insufficient: "رصيدك غير كافٍ!",
        winTon: "مبروك! فزت بجائزة عملات مباشرة بقيمة: ",
        winGift: "يا لك من محظوظ! فزت بهدية نادرة وقيمة قيمتها تتراوح بين 5 إلى 5000 تون: ",
        exploded: "💥 انفجرت الطيارة عند مضاعف: "
    },
    en: {
        welcome: "Welcome",
        boxesTitle: "🎁 Active Gift Boxes",
        bet: "Place Bet",
        insufficient: "Insufficient balance!",
        winTon: "Congrats! You won a direct TON prize: ",
        winGift: "Lucky! You won a rare gift item valued between 5 to 5000 TON: ",
        exploded: "💥 Rocket exploded at multiplier: "
    }
};

let currentLang = 'en';

// دالة اختيار اللغة عند تشغيل الـ Open لأول مرة
window.selectLanguage = function(lang) {
    currentLang = lang;
    document.getElementById('language-overlay').style.display = 'none';
    document.getElementById('section-boxes-title').innerText = translations[currentLang].boxesTitle;
    document.getElementById('place-bet-btn').innerText = translations[currentLang].bet;
    
    if(lang === 'en') {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
    } else {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
    }
};

// 1. منطق لعبة الطيارة (Rocket) بالنسب الدقيقة المطلوبة
window.startRocketRound = function() {
    const btn = document.getElementById('place-bet-btn');
    const viewMultiplier = document.getElementById('live-multiplier');
    const rocket = document.getElementById('rocket-sprite');
    
    btn.disabled = true;
    rocket.style.transform = "translate(0px, 0px) scale(1)";
    
    // تحديد نقطة الانفجار بناءً على الاحتمالات المطلوبة:
    let finalCrashPoint;
    const randomChance = Math.random() * 100; // نسبة من 0 إلى 100
    
    if (randomChance <= 80) {
        // نسبة 80% تنفجر الطيارة بين 1.00 و 2.00
        finalCrashPoint = 1.00 + (Math.random() * 1.00);
    } else {
        // نسبة 20% ترتفع الطيارة وتصل وتنفجر بين 2.00 و 100.00
        finalCrashPoint = 2.00 + (Math.random() * 98.00);
    }
    
    let currentMultiplier = 1.00;
    const gameInterval = setInterval(() => {
        currentMultiplier += 0.05;
        viewMultiplier.innerText = currentMultiplier.toFixed(2) + "x";
        
        // تحريك الطيارة لأعلى لإعطاء شكل اللعبة الأصلي
        let xProgress = (currentMultiplier - 1) * 8;
        let yProgress = -(currentMultiplier - 1) * 5;
        rocket.style.transform = `translate(${xProgress}px, ${yProgress}px) scale(1.1)`;
        
        if (currentMultiplier >= finalCrashPoint) {
            clearInterval(gameInterval);
            viewMultiplier.innerText = "💥 CROWED " + finalCrashPoint.toFixed(2) + "x";
            alert(translations[currentLang].exploded + finalCrashPoint.toFixed(2) + "x");
            btn.disabled = false;
            rocket.style.transform = "translate(0px, 0px) scale(1)";
        }
    }, 60);
};

// 2. منطق فتح الصناديق (نفس الأسماء والمحتويات مع تغيير نسب الجوائز كما طلبت)
window.openGiftBox = function(boxName) {
    const lootChance = Math.random() * 100;
    
    // نسبة 90% الفوز بجوائز عملة التون المباشرة (0.1 أو 0.5 أو 1 تون)
    if (lootChance <= 90) {
        const tonPrizes = [0.1, 0.5, 1.0];
        const randomTon = tonPrizes[Math.floor(Math.random() * tonPrizes.length)];
        alert(`${translations[currentLang].winTon} ${randomTon} TON`);
    } 
    // نسبة 10% (بقية الـ 100) تفوز بالهدايا التي يتراوح سعرها بين 5 تون و 5000 تون
    else {
        const giftItems = ["Nail Bracelet", "Bonded Ring", "Durov's Cap", "Heart Locket", "Stellar Rocket"];
        const randomGift = giftItems[Math.floor(Math.random() * giftItems.length)];
        const estimatedValue = Math.floor(5 + Math.random() * 4995); // يتراوح من 5 إلى 5000
        alert(`${translations[currentLang].winGift} [${randomGift}] بقيمة تقريبية ${estimatedValue} TON`);
    }
};

// التعامل مع النوافذ وتوصيل المحفظة الأساسي
document.getElementById('deposit-nav-btn').addEventListener('click', () => {
    document.getElementById('game-view-section').style.display = 'none';
    document.getElementById('deposit-view-section').style.display = 'block';
});
document.getElementById('back-to-game-btn').addEventListener('click', () => {
    document.getElementById('deposit-view-section').style.display = 'none';
    document.getElementById('game-view-section').style.display = 'block';
});
