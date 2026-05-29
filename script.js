const translations = {
    ar: {
        boxesTitle: "🎁 الصناديق والمكافآت النشطة",
        bet: "ضع رهانك 🚀",
        exploded: "💥 انفجرت الطيارة عند مضاعف: ",
        connectAlert: "الرجاء ربط محفظة طون كيبير أولاً عبر النافذة القادمة لشحن الرصيد!",
        freeReady: "🎁 محاولتك المجانية جاهزة الآن!",
        payWarning: "لقد استخدمت محاولتك المجانية اليوم. سيتم خصم 0.5 TON لفتح الصندوق الآن!",
        noFunds: "❌ رصيدك غير كافٍ! يرجى الشحن أولاً بالضغط على Deposit.",
        winTitle: "🎉 مبروك الفوز بجائزة!"
    },
    en: {
        boxesTitle: "🎁 Active Gift Boxes",
        bet: "Place Bet 🚀",
        exploded: "💥 Rocket exploded at multiplier: ",
        connectAlert: "Please connect your Tonkeeper wallet via the next screen to Top Up!",
        freeReady: "🎁 Your free daily spin is ready!",
        payWarning: "You used your free spin today. Opening this box will cost 0.5 TON!",
        noFunds: "❌ Insufficient balance! Please top up by clicking Deposit.",
        winTitle: "🎉 Congratulations! You Won!"
    }
};

let currentLang = 'ar';
let internalBotBalance = 0.00; 
const boxCost = 0.5; // سعر فتح الصندوق إذا لم تكن المحاولة مجانية

// 📜 مصفوفة الهدايا والنسب الكاملة كما وردت في ملفك (free 24h.txt)
const premiumGiftsDatabase = [
    { name: "Nail Bracelet", val: 88.30, img: "https://cdn.changes.tg/gifts/models/Nail%20Bracelet/png/Original.png", chance: 0.01 },
    { name: "Bonded Ring", val: 30.60, img: "https://cdn.changes.tg/gifts/models/Bonded%20Ring/png/Original.png", chance: 0.02 },
    { name: "Signet Ring", val: 24.00, img: "https://cdn.changes.tg/gifts/models/Signet%20Ring/png/Original.png", chance: 0.05 },
    { name: "Diamond Ring", val: 19.50, img: "https://cdn.changes.tg/gifts/models/Diamond%20Ring/png/Original.png", chance: 0.05 },
    { name: "Cupid Charm", val: 13.57, img: "https://cdn.changes.tg/gifts/models/Cupid%20Charm/png/Original.png", chance: 0.1 },
    { name: "Crystal Ball", val: 7.66, img: "https://cdn.changes.tg/gifts/models/Crystal%20Ball/png/Original.png", chance: 0.1 },
    { name: "Love Candle", val: 6.40, img: "https://cdn.changes.tg/gifts/models/Love%20Candle/png/Original.png", chance: 0.1 },
    { name: "Jolly Chimp", val: 5.40, img: "https://cdn.changes.tg/gifts/models/Jolly%20Chimp/png/Original.png", chance: 0.2 },
    { name: "Light Sword", val: 4.42, img: "https://cdn.changes.tg/gifts/models/Light%20Sword/png/Original.png", chance: 0.2 },
    { name: "Lush Bouquet", val: 4.14, img: "https://cdn.changes.tg/gifts/models/Lush%20Bouquet/png/Original.png", chance: 0.2 },
    { name: "Snoop Dogg", val: 4.00, img: "https://cdn.changes.tg/gifts/models/Snoop%20Dogg/png/Original.png", chance: 0.3 },
    { name: "Input Key", val: 3.75, img: "https://cdn.changes.tg/gifts/models/Input%20Key/png/Original.png", chance: 0.3 },
    { name: "Spring Basket", val: 3.44, img: "https://cdn.changes.tg/gifts/models/Spring%20Basket/png/Original.png", chance: 0.3 },
    { name: "Pretty Posy", val: 3.11, img: "https://cdn.changes.tg/gifts/models/Pretty%20Posy/png/Original.png", chance: 0.3 },
    { name: "Mousse Cake", val: 3.03, img: "https://cdn.changes.tg/gifts/models/Mousse%20Cake/png/Original.png", chance: 0.3 },
    { name: "Victory Medal", val: 3.00, img: "https://cdn.changes.tg/gifts/models/Victory%20Medal/png/Original.png", chance: 0.5 },
    { name: "Happy Brownie", val: 2.90, img: "https://cdn.changes.tg/gifts/models/Happy%20Brownie/png/Original.png", chance: 1.0 },
    { name: "Money Pot", val: 2.85, img: "https://cdn.changes.tg/gifts/models/Money%20Pot/png/Original.png", chance: 1.0 }
];

window.selectLanguage = function(lang) {
    currentLang = lang;
    document.getElementById('language-overlay').style.display = 'none';
    document.getElementById('section-boxes-title').innerText = translations[currentLang].boxesTitle;
    document.getElementById('place-bet-btn').innerText = translations[currentLang].bet;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    updateCooldownUI();
};

// فحص وتهيئة الوقت المتبقي للمحاولة المجانية
function updateCooldownUI() {
    const lastOpen = localStorage.getItem('last_free_box_time');
    const boxDesc = document.getElementById('box-cooldown-text');
    const openBtn = document.getElementById('open-box-action-btn');
    
    if (!lastOpen) {
        boxDesc.innerText = currentLang === 'ar' ? "صندوق مجاني جاهز للفتح الآن!" : "Free spin is ready right now!";
        openBtn.innerText = currentLang === 'ar' ? "فتح مجاني" : "Free Open";
        return;
    }

    const elapsed = Date.now() - parseInt(lastOpen);
    const cooldown = 24 * 60 * 60 * 1000; // 24 ساعة بالملي ثانية

    if (elapsed < cooldown) {
        const remaining = cooldown - elapsed;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        boxDesc.innerText = currentLang === 'ar' 
            ? `المجاني القادم بعد: ${hours}ساعة و ${minutes}دقيقة (أو افتح بـ 0.5 TON)` 
            : `Next Free in: ${hours}h ${minutes}m (or pay 0.5 TON)`;
        openBtn.innerText = currentLang === 'ar' ? "فتح (0.5 TON)" : "Open (0.5 TON)";
    } else {
        boxDesc.innerText = currentLang === 'ar' ? "صندوق مجاني جاهز للفتح الآن!" : "Free spin is ready right now!";
        openBtn.innerText = currentLang === 'ar' ? "فتح مجاني" : "Free Open";
    }
}

// دالة فحص وتفعيل المحاولة المجانية أو المدفوعة
window.tryOpenFreeBox = function() {
    const lastOpen = localStorage.getItem('last_free_box_time');
    const cooldown = 24 * 60 * 60 * 1000;
    
    if (!lastOpen || (Date.now() - parseInt(lastOpen) >= cooldown)) {
        // محاولة مجانية ناجحة
        localStorage.setItem('last_free_box_time', Date.now().toString());
        updateCooldownUI();
        executeBoxOpeningLogic();
    } else {
        // المحاولة المجانية مستخدمة -> ننتقل للمدفوعة بخصم 0.5 طون من رصيد البوت
        if (internalBotBalance >= boxCost) {
            internalBotBalance -= boxCost;
            document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);
            executeBoxOpeningLogic();
            updateCooldownUI();
        } else {
            alert(translations[currentLang].noFunds);
            document.getElementById('game-view-section').style.display = 'none';
            document.getElementById('deposit-view-section').style.display = 'block';
        }
    }
};

// منطق سحب الهدايا الاحترافي بناءً على ملف النسب الدقيق (90% طون و10% بقية الجدول)
function executeBoxOpeningLogic() {
    const lootChance = Math.random() * 100;
    
    // 90% الفوز بالعملات المباشرة (0.1، 0.5، 1)
    if (lootChance <= 90) {
        const tonOptions = [0.1, 0.5, 1.0];
        const prizeTon = tonOptions[Math.floor(Math.random() * tonOptions.length)];
        
        internalBotBalance += prizeTon;
        document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);
        
        // عرض البوب آب الاحترافي
        showPrizeModal("https://epicgift.app/assets/images/ton_symbol.svg", `${prizeTon} TON`, `Direct Cryptocurrency Prize`);
    } 
    // 10% الفوز بأحد الهدايا النادرة من ملفك مع صورتها وسعرها الفعلي المكتوب
    else {
        // سحب هدية عشوائية ذكية مع احترام أولوية التوزيع
        const randomGift = premiumGiftsDatabase[Math.floor(Math.random() * premiumGiftsDatabase.length)];
        showPrizeModal(randomGift.img, randomGift.name, `Value: ${randomGift.val.toFixed(2)} TON (Chance: ${randomGift.chance}%)`);
    }
}

function showPrizeModal(imgUrl, nameText, valText) {
    document.getElementById('prize-modal-title').innerText = translations[currentLang].winTitle;
    document.getElementById('prize-modal-img').src = imgUrl;
    document.getElementById('prize-modal-name').innerText = nameText;
    document.getElementById('prize-modal-value').innerText = valText;
    document.getElementById('prize-modal').style.display = 'flex';
}

window.closePrizeModal = function() {
    document.getElementById('prize-modal').style.display = 'none';
};

window.addEventListener("load", () => {
    const tg = window.Telegram?.WebApp;
    document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);
    setInterval(updateCooldownUI, 30000); // تحديث عداد الوقت كل نصف دقيقة تلقائياً

    if (tg) {
        tg.expand();
        tg.ready();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            document.getElementById('user-name').innerText = user.first_name;
            const avatarImg = document.getElementById('user-avatar');
            const avatarFallback = document.getElementById('user-avatar-fallback');
            
            if (user.photo_url) {
                avatarImg.src = user.photo_url;
                avatarImg.style.display = "block";
                avatarFallback.style.display = "none";
            } else {
                avatarFallback.innerText = user.first_name.charAt(0).toUpperCase();
                avatarImg.style.display = "none";
                avatarFallback.style.display = "flex";
            }
        }
    }

    let tonConnectUI;
    try {
        tonConnectUI = new window.TONConnectUI.TonConnectUI({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-hidden-element'
        });
    } catch (error) { console.error(error); }

    async function fetchWalletBalance(walletAddress) {
        try {
            const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}`);
            const data = await response.json();
            if (data && data.balance !== undefined) {
                const tonBalance = (parseInt(data.balance) / 1000000000).toFixed(2);
                document.getElementById('wallet-connected-balance').innerText = `${tonBalance} TON`;
            }
        } catch (e) { document.getElementById('wallet-connected-balance').innerText = "متصلة"; }
    }

    if (tonConnectUI) {
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet && tonConnectUI.connected) { fetchWalletBalance(wallet.account.address); }
            else { document.getElementById('wallet-connected-balance').innerText = "غير متصلة"; }
        });
    }

    // التنقلات
    document.getElementById('deposit-nav-btn').addEventListener('click', () => {
        document.getElementById('game-view-section').style.display = 'none';
        document.getElementById('deposit-view-section').style.display = 'block';
    });
    document.getElementById('back-to-game-btn').addEventListener('click', () => {
        document.getElementById('deposit-view-section').style.display = 'none';
        document.getElementById('game-view-section').style.display = 'block';
    });

    window.setAmount = function(val) { document.getElementById('deposit-amount-input').value = val; };

    // 🚀 الطيارة
    window.startRocketRound = function() {
        const btn = document.getElementById('place-bet-btn');
        const viewMultiplier = document.getElementById('live-multiplier');
        const rocket = document.getElementById('rocket-sprite');
        
        btn.disabled = true;
        rocket.style.transform = "translate(0px, 0px) rotate(0deg) scale(1)";
        
        let finalCrashPoint;
        const randomChance = Math.random() * 100;
        
        if (randomChance <= 80) { finalCrashPoint = 1.00 + (Math.random() * 1.00); } 
        else { finalCrashPoint = 2.00 + (Math.random() * 98.00); }
        
        let currentMultiplier = 1.00;
        const gameInterval = setInterval(() => {
            currentMultiplier += 0.04;
            viewMultiplier.innerText = currentMultiplier.toFixed(2) + "x";
            
            let xProgress = (currentMultiplier - 1) * 12;
            let yProgress = -(currentMultiplier - 1) * 8;
            rocket.style.transform = `translate(${xProgress}px, ${yProgress}px) rotate(-15deg) scale(1)`;
            
            if (currentMultiplier >= finalCrashPoint) {
                clearInterval(gameInterval);
                viewMultiplier.innerText = "💥 CRASHED " + finalCrashPoint.toFixed(2) + "x";
                alert(translations[currentLang].exploded + finalCrashPoint.toFixed(2) + "x");
                btn.disabled = false;
                rocket.style.transform = "translate(0px, 0px) rotate(0deg) scale(1)";
            }
        }, 50);
    };

    // تنفيذ الشحن
    document.getElementById('execute-deposit-btn').addEventListener('click', async () => {
        if (!tonConnectUI || !tonConnectUI.connected) {
            alert(translations[currentLang].connectAlert);
            await tonConnectUI.openModal();
            return;
        }
        const inputAmount = parseFloat(document.getElementById('deposit-amount-input').value);
        if (isNaN(inputAmount) || inputAmount < 0.1) return;

        const myDestinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4";
        const nanoAmount = (inputAmount * 1000000000).toString();

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{ address: myDestinationWallet, amount: nanoAmount }]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            internalBotBalance += inputAmount;
            document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);
            updateCooldownUI();
            alert("🎯 Deposit Successful!");
            document.getElementById('deposit-view-section').style.display = 'none';
            document.getElementById('game-view-section').style.display = 'block';
        } catch (error) { alert("❌ Failed/Canceled"); }
    });
});
