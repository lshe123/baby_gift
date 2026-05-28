// 1. تهيئة تطبيق تليجرام المصغر وتوسيعه لملء الشاشة تلقائياً
const tg = window.Telegram.WebApp;
tg.expand(); 

// جلب اسم المستخدم وعرضه بالكامل داخل التطبيق
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}

// 2. تهيئة TON Connect لربط محفظة Tonkeeper
const tonConnectUI = new TONConnectUI.TonConnectUI({
    manifestUrl: window.location.origin + '/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-btn'
});

// دالة لجلب رصيد المحفظة باستخدام tonapi.io (آمن ولا يسبب حظر CORS للمتصفحات)
async function fetchAndDisplayBalance(walletAddress) {
    try {
        const balanceView = document.getElementById('balance-view');
        balanceView.innerText = "⏳ جاري تحديث الرصيد...";
        
        // استخدام سيرفر tonapi السريع والمفتوح للمتصفحات
        const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}`);
        const data = await response.json();
        
        if (data && data.balance !== undefined) {
            const nanoBalance = data.balance; // الرصيد بالنانو تون
            const tonBalance = (parseInt(nanoBalance) / 1000000000).toFixed(2); // تحويله إلى TON مع تقريب رقمين
            
            balanceView.innerText = `💎 رصيدك: ${tonBalance} TON`;
        } else {
            balanceView.innerText = "💎 متصل بالمحفظة";
        }
    } catch (error) {
        console.error("خطأ في جلب الرصيد:", error);
        document.getElementById('balance-view').innerText = "💎 متصل بالمحفظة";
    }
}

// مراقبة حالة المحفظة (إذا اتصل المستخدم أو فصل المحفظة)
tonConnectUI.onStatusChange((wallet) => {
    const balanceView = document.getElementById('balance-view');
    if (wallet && tonConnectUI.connected) {
        const rawAddress = wallet.account.address;
        fetchAndDisplayBalance(rawAddress);
    } else {
        balanceView.innerText = "💰 نظام الجوائز";
    }
});

// 3. دالة معالجة عمليات الدفع لشراء الصناديق والميزات
async function buyItem(amountInTon, itemName) {
    if (!tonConnectUI.connected) {
        alert('الرجاء ربط محفظة Tonkeeper الخاصة بك أولاً عبر الزر الموجود في الأعلى!');
        tonConnectUI.openModal();
        return;
    }

    // عنوان محفظتك الحقيقية لاستقبال رصيد TON
    const destinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4"; 
    const nanoAmount = (amountInTon * 1000000000).toString();

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5, // صلاحية الطلب 5 دقائق
        messages: [
            {
                address: destinationWallet,
                amount: nanoAmount,
                payload: btoa(JSON.stringify({
                    userId: tg.initDataUnsafe?.user?.id || 0,
                    item: itemName
                }))
            }
        ]
    };

    try {
        tg.MainButton.setText("جاري فتح المحفظة وتأكيد الدفع...");
        tg.MainButton.show();

        const result = await tonConnectUI.sendTransaction(transaction);
        alert("تم إرسال عملية الدفع بنجاح! جاري فحص بلوكشين TON لتسليم مكافأتك.");
        
        // تحديث الرصيد بعد الدفع
        if (tonConnectUI.account) {
            fetchAndDisplayBalance(tonConnectUI.account.address);
        }
        
    } catch (error) {
        alert("تم إلغاء عملية الدفع أو فشل الاتصال بالمحفظة.");
        console.error("خطأ في المعاملة:", error);
    } finally {
        tg.MainButton.hide();
    }
}
