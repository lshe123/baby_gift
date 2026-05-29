// لغات البوت المترجمة للتبديل الفوري
const translations = {
    ar: {
        boxesTitle: "🎁 الصناديق والمكافآت النشطة",
        bet: "ضع رهانك 🚀",
        winTon: "مبروك! فزت بجائزة عملات مباشرة بقيمة: ",
        winGift: "يا لك من محظوظ! فزت بهدية نادرة وقيمة قيمتها تتراوح بين 5 إلى 5000 تون: ",
        exploded: "💥 انفجرت الطيارة عند مضاعف: ",
        connectAlert: "الرجاء ربط محفظة طون كيبير أولاً عبر النافذة القادمة لشحن الرصيد!"
    },
    en: {
        boxesTitle: "🎁 Active Gift Boxes",
        bet: "Place Bet 🚀",
        winTon: "Congrats! You won a direct TON prize: ",
        winGift: "Lucky! You won a rare gift item valued between 5 to 5000 TON: ",
        exploded: "💥 Rocket exploded at multiplier: ",
        connectAlert: "Please connect your Tonkeeper wallet via the next screen to Top Up!"
    }
};

let currentLang = 'ar';
let internalBotBalance = 0.00; // الرصيد الافتراضي تم تصفيره 0.00 كما طلبت بالملي

window.selectLanguage = function(lang) {
    currentLang = lang;
    document.getElementById('language-overlay').style.display = 'none';
    document.getElementById('section-boxes-title').innerText = translations[currentLang].boxesTitle;
    document.getElementById('place-bet-btn').innerText = translations[currentLang].bet;
    
    if(lang === 'en') {
        document.documentElement.dir = 'ltr';
    } else {
        document.documentElement.dir = 'rtl';
    }
};

window.addEventListener("load", () => {
    const tg = window.Telegram?.WebApp;
    
    // إظهار وتحديث الرصيد الافتراضي الأولي في الهيدر
    document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);

    // معالجة بيانات تليجرام بدقة وضمان عدم ظهور أيقونة الصورة مكسورة
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
                // وضع الحرف الأول من اسم المستخدم داخل الدائرة تلقائياً لمنع ظهور الأيقونة المكسورة
                avatarFallback.innerText = user.first_name.charAt(0).toUpperCase();
                avatarImg.style.display = "none";
                avatarFallback.style.display = "flex";
            }
        }
    }

    // تهيئة مكتبة اتصال الـ TON Connect بربط خلفي ذكي
    let tonConnectUI;
    try {
        tonConnectUI = new window.TONConnectUI.TonConnectUI({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-hidden-element'
        });
    } catch (error) {
        console.error("خطأ تهيئة المحفظة:", error);
    }

    async function fetchWalletBalance(walletAddress) {
        try {
            const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}`);
            const data = await response.json();
            if (data && data.balance !== undefined) {
                const tonBalance = (parseInt(data.balance) / 1000000000).toFixed(2);
                document.getElementById('wallet-connected-balance').innerText = `${tonBalance} TON`;
            }
        } catch (e) {
            document.getElementById('wallet-connected-balance').innerText = "متصلة";
        }
    }

    if (tonConnectUI) {
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet && tonConnectUI.connected) {
                fetchWalletBalance(wallet.account.address);
            } else {
                document.getElementById('wallet-connected-balance').innerText = "غير متصلة";
            }
        });
    }

    // حركة وتنقل الواجهات والصفحات داخلياً بالبوت
    document.getElementById('deposit-nav-btn').addEventListener('click', () => {
        document.getElementById('game-view-section').style.display = 'none';
        document.getElementById('deposit-view-section').style.display = 'block';
    });
    document.getElementById('back-to-game-btn').addEventListener('click', () => {
        document.getElementById('deposit-view-section').style.display = 'none';
        document.getElementById('game-view-section').style.display = 'block';
    });

    window.setAmount = function(val) {
        document.getElementById('deposit-amount-input').value = val;
    };

    // 🚀 تشغيل الطيارة وإجبارها على الشروط الدقيقة الجديدة المطلوبة
    window.startRocketRound = function() {
        const btn = document.getElementById('place-bet-btn');
        const viewMultiplier = document.getElementById('live-multiplier');
        const rocket = document.getElementById('rocket-sprite');
        
        btn.disabled = true;
        rocket.style.transform = "translate(0px, 0px) scale(1)";
        
        let finalCrashPoint;
        const randomChance = Math.random() * 100; // ميزان عشوائي لنسب الفوز والخسارة
        
        if (randomChance <= 80) {
            // شرط 1: تنفجر بين 1.00 و 2.00 بنسبة 80% في المئة
            finalCrashPoint = 1.00 + (Math.random() * 1.00);
        } else {
            // شرط 2: ترتفع من 2.00 وتصل لـ 100 وتنفجر بنسبة 20% في المئة
            finalCrashPoint = 2.00 + (Math.random() * 98.00);
        }
        
        let currentMultiplier = 1.00;
        const gameInterval = setInterval(() => {
            currentMultiplier += 0.04;
            viewMultiplier.innerText = currentMultiplier.toFixed(2) + "x";
            
            let xProgress = (currentMultiplier - 1) * 9;
            let yProgress = -(currentMultiplier - 1) * 6;
            rocket.style.transform = `translate(${xProgress}px, ${yProgress}px) scale(1.1)`;
            
            if (currentMultiplier >= finalCrashPoint) {
                clearInterval(gameInterval);
                viewMultiplier.innerText = "💥 CRASHED " + finalCrashPoint.toFixed(2) + "x";
                alert(translations[currentLang].exploded + finalCrashPoint.toFixed(2) + "x");
                btn.disabled = false;
                rocket.style.transform = "translate(0px, 0px) scale(1)";
            }
        }, 50);
    };

    // 📦 معالجة فتح الصناديق بالنسب الفائزة والشروط المطلوبة تماماً
    window.openGiftBox = function(boxName) {
        const lootChance = Math.random() * 100;
        
        // الاحتمال الأول: نسبة 90% تفوز بالعملات السهلة (0.1 تون أو 0.5 تون أو 1 تون)
        if (lootChance <= 90) {
            const tonOptions = [0.1, 0.5, 1.0];
            const prizeTon = tonOptions[Math.floor(Math.random() * tonOptions.length)];
            
            // إضافة الجائزة لرصيد الهيدر فوراً
            internalBotBalance += prizeTon;
            document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);
            
            alert(`${translations[currentLang].winTon} ${prizeTon} TON ✨`);
        } 
        // الاحتمال الثاني: نسبة الفوز 1% أو الباقي للهدايا الكبرى التي تتراوح قيمتها من 5 إلى 5000 تون
        else {
            const rareGifts = ["ساعة رولكس الملكية", "سيارة تيسلا مصغرة", "مفتاح دوروف الماسي", "خاتم الطاقة المشحون"];
            const prizeGift = rareGifts[Math.floor(Math.random() * rareGifts.length)];
            const randomValue = Math.floor(5 + Math.random() * 4995); // يتراوح قيمته بين 5 و 5000 تون
            
            alert(`${translations[currentLang].winGift} [${prizeGift}] بقيمة افتراضية توازي ${randomValue} TON!`);
        }
    };

    // تنفيذ عمليات الشحن والتحويل التلقائي لتطبيق Tonkeeper
    document.getElementById('execute-deposit-btn').addEventListener('click', async () => {
        if (!tonConnectUI || !tonConnectUI.connected) {
            alert(translations[currentLang].connectAlert);
            await tonConnectUI.openModal();
            return;
        }

        const inputAmount = parseFloat(document.getElementById('deposit-amount-input').value);
        if (isNaN(inputAmount) || inputAmount < 0.1) {
            alert("أقل كمية إيداع هي 0.1 TON");
            return;
        }

        const myDestinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4";
        const nanoAmount = (inputAmount * 1000000000).toString();

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
                {
                    address: myDestinationWallet,
                    amount: nanoAmount,
                    payload: btoa(JSON.stringify({ userId: tg?.initDataUnsafe?.user?.id || 0, type: "DEPOSIT" }))
                }
            ]
        };

        try {
            await tonConnectUI.sendTransaction(transaction);
            
            // تحديث رصيد البوت مباشرة عند نجاح الشحن من المحفظة
            internalBotBalance += inputAmount;
            document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(2);
            
            alert("🎯 تم استلام إيداعك بنجاح وتحديث رصيد حسابك بالبوت!");
            document.getElementById('deposit-view-section').style.display = 'none';
            document.getElementById('game-view-section').style.display = 'block';
        } catch (error) {
            alert("❌ ألغيت المعاملة أو الرصيد غير كافٍ في محفظتك.");
        }
    });
});
