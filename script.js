// الانتظار حتى تكتمل واجهة الـ HTML بالكامل قبل تشغيل السكريبت
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. تهيئة تطبيق تليجرام المصغر وتوسيعه
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        // جلب اسم المستخدم وعرضه بالكامل
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.innerText = tg.initDataUnsafe.user.first_name;
            }
        }
    }

    // 2. تهيئة TON Connect لربط المحفظة
    const tonConnectUI = new TONConnectUI.TonConnectUI({
        manifestUrl: window.location.origin + '/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-btn'
    });

    // دالة لجلب رصيد المحفظة باستخدام سيرفر tonapi.io الآمن
    async function fetchAndDisplayBalance(walletAddress) {
        try {
            const balanceView = document.getElementById('balance-view');
            if (!balanceView) return;
            
            balanceView.innerText = "⏳ جاري تحديث الرصيد...";
            
            const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}`);
            const data = await response.json();
            
            if (data && data.balance !== undefined) {
                const nanoBalance = data.balance; 
                const tonBalance = (parseInt(nanoBalance) / 1000000000).toFixed(2); 
                balanceView.innerText = `💎 رصيدك: ${tonBalance} TON`;
            } else {
                balanceView.innerText = "💎 متصل بالمحفظة";
            }
        } catch (error) {
            console.error("خطأ في جلب الرصيد:", error);
            const balanceView = document.getElementById('balance-view');
            if (balanceView) balanceView.innerText = "💎 متصل بالمحفظة";
        }
    }

    // مراقبة حالة اتصال وفصل المحفظة
    tonConnectUI.onStatusChange((wallet) => {
        const balanceView = document.getElementById('balance-view');
        if (!balanceView) return;

        if (wallet && tonConnectUI.connected) {
            const rawAddress = wallet.account.address;
            fetchAndDisplayBalance(rawAddress);
        } else {
            balanceView.innerText = "💰 نظام الجوائز";
        }
    });

    // جعل دالة الشراء متاحة عالمياً لكي يقرأها الـ HTML عند الضغط على الأزرار
    window.buyItem = async function(amountInTon, itemName) {
        if (!tonConnectUI.connected) {
            alert('الرجاء ربط محفظة Tonkeeper الخاصة بك أولاً عبر الزر الموجود في الأعلى!');
            tonConnectUI.openModal();
            return;
        }

        const destinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4"; 
        const nanoAmount = (amountInTon * 1000000000).toString();

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
            messages: [
                {
                    address: destinationWallet,
                    amount: nanoAmount,
                    payload: btoa(JSON.stringify({
                        userId: tg?.initDataUnsafe?.user?.id || 0,
                        item: itemName
                    }))
                }
            ]
        };

        try {
            if (tg?.MainButton) {
                tg.MainButton.setText("جاري فتح المحفظة وتأكيد الدفع...");
                tg.MainButton.show();
            }

            await tonConnectUI.sendTransaction(transaction);
            alert("تم إرسال عملية الدفع بنجاح! جاري فحص بلوكشين TON لتسليم مكافأتك.");
            
            if (tonConnectUI.account) {
                fetchAndDisplayBalance(tonConnectUI.account.address);
            }
            
        } catch (error) {
            alert("تم إلغاء عملية الدفع أو فشل الاتصال بالمحفظة.");
            console.error("خطأ في المعاملة:", error);
        } finally {
            if (tg?.MainButton) tg.MainButton.hide();
        }
    };
});
