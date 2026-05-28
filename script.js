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

// دالة لجلب رصيد المحفظة من البلوكشين وعرضه في التطبيق
async function fetchAndDisplayBalance(walletAddress) {
    try {
        const balanceView = document.getElementById('balance-view');
        balanceView.innerText = "⏳ جاري تحديث الرصيد...";
        
        // استخدام API مجاني وسريع من Toncenter لقراءة رصيد المحفظة
        const response = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${walletAddress}`);
        const data = await response.json();
        
        if (data && data.ok && data.result) {
            const nanoBalance = data.result.balance; // الرصيد بالنانو تون
            const tonBalance = (parseInt(nanoBalance) / 1000000000).toFixed(2); // تحويله إلى TON وتقريبه لرقمان بعد الفاصلة
            
            // عرض الرصيد في الأعلى بدلاً من الكلمة القديمة
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
        // إذا اتصل بنجاح، نأخذ عنوان محفظته الحقيقي ونمرره لدالة جلب الرصيد
        const rawAddress = wallet.account.address;
        fetchAndDisplayBalance(rawAddress);
    } else {
        // إذا قام بفصل المحفظة، نعيد النص الأصلي
        balanceView.innerText = "💰 نظام الجوائز";
    }
});

// 3. دالة معالجة عمليات الدفع لشراء الصناديق والميزات
async function buyItem(amountInTon, itemName) {
    // التأكد من أن المستخدم قام بربط محفظته أولاً
    if (!tonConnectUI.connected) {
        alert('الرجاء ربط محفظة Tonkeeper الخاصة بك أولاً عبر الزر الموجود في الأعلى!');
        tonConnectUI.openModal();
        return;
    }

    // ⚠️ هام جداً: استبدل هذا العنوان الافتراضي بعقد أو عنوان محفظتك الحقيقية لتستقبل رصيد TON
    const destinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4"; 

    // تحويل قيمة الـ TON إلى نانو تون (1 TON = 1,000,000,000 NanoTON)
    const nanoAmount = (amountInTon * 1000000000).toString();

    // تجهيز بنية المعاملة لإرسالها لمحفظة المستخدم
    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5, // صلاحية الطلب 5 دقائق فقط
        messages: [
            {
                address: destinationWallet,
                amount: nanoAmount,
                // إرفاق بيانات تفصيلية (Payload) لتعريف السيرفر بهوية المشتري
                payload: btoa(JSON.stringify({
                    userId: tg.initDataUnsafe?.user?.id || 0,
                    item: itemName
                }))
            }
        ]
    };

    try {
        // إظهار زر التليجرام الرئيسي لإبلاغ المستخدم بالمعالجة
        tg.MainButton.setText("جاري فتح المحفظة وتأكيد الدفع...");
        tg.MainButton.show();

        // فتح تطبيق المحفظة (Tonkeeper) لتأكيد المعاملة ودفع الـ TON
        const result = await tonConnectUI.sendTransaction(transaction);
        
        alert("تم إرسال عملية الدفع بنجاح! جاري فحص بلوكشين TON لتسليم مكافأتك.");
        console.log("رمز تأكيد الدفع الإلكتروني (BOC):", result.boc);
        
        // تحديث الرصيد مرة أخرى بعد نجاح الدفع
        if (tonConnectUI.account) {
            fetchAndDisplayBalance(tonConnectUI.account.address);
        }
        
    } catch (error) {
        alert("تم إلغاء عملية الدفع أو فشل الاتصال بالمحفظة.");
        console.error("خطأ في المعاملة:", error);
    } finally {
        // إخفاء زر تليجرام بعد الانتهاء
        tg.MainButton.hide();
    }
}
