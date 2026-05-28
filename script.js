window.addEventListener("load", () => {
    // 1. تهيئة تطبيق تليجرام المصغر وتوسيعه بالكامل
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.innerText = tg.initDataUnsafe.user.first_name;
            }
        }
    }

    // 2. تهيئة وتوليد زر المحفظة بشكل صارم وضمان حقنه في الـ HTML
    let tonConnectUI;
    
    function initTonConnect() {
        const targetDiv = document.getElementById('ton-connect-btn');
        if (!targetDiv) return;

        try {
            // استخدام الرابط المباشر للمكتبة المعرفة في النافذة العالمية للمتصفح
            tonConnectUI = new window.TONConnectUI.TonConnectUI({
                manifestUrl: window.location.origin + '/tonconnect-manifest.json',
                buttonRootId: 'ton-connect-btn'
            });
            
            console.log("تمت تهيئة TON Connect بنجاح.");
        } catch (error) {
            console.error("خطأ أثناء محاولة بناء زر المحفظة:", error);
        }
    }

    // تشغيل دالة بناء الزر فوراً
    initTonConnect();

    // دالة فحص وجلب رصيد المحفظة من سيرفر عالي السرعة وبدون حظر متصفحات
    async function fetchAndDisplayBalance(walletAddress) {
        try {
            const balanceView = document.getElementById('balance-view');
            if (!balanceView) return;
            balanceView.innerText = "⏳ جاري تحديث الرصيد...";
            
            const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}`);
            const data = await response.json();
            
            if (data && data.balance !== undefined) {
                const tonBalance = (parseInt(data.balance) / 1000000000).toFixed(2); 
                balanceView.innerText = `💎 رصيدك: ${tonBalance} TON`;
            } else {
                balanceView.innerText = "💎 متصل بالمحفظة";
            }
        } catch (error) {
            const balanceView = document.getElementById('balance-view');
            if (balanceView) balanceView.innerText = "💎 متصل بالمحفظة";
        }
    }

    // مراقبة حالة اتصال وفصل المحفظة
    if (tonConnectUI) {
        tonConnectUI.onStatusChange((wallet) => {
            const balanceView = document.getElementById('balance-view');
            if (!balanceView) return;
            if (wallet && tonConnectUI.connected) {
                fetchAndDisplayBalance(wallet.account.address);
            } else {
                balanceView.innerText = "💰 نظام الجوائز";
            }
        });
    }

    // دالة الدفع وشراء الصناديق داخل اللعبة
    window.buyItem = async function(amountInTon, itemName) {
        if (!tonConnectUI || !tonConnectUI.connected) {
            alert('الرجاء ربط محفظة Tonkeeper الخاصة بك أولاً عبر الزر الموجود في الأعلى!');
            tonConnectUI?.openModal();
            return;
        }

        const destinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4"; 
        const nanoAmount = (amountInTon * 1000000000).toString();

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
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
            alert("تم إرسال عملية الدفع بنجاح!");
            if (tonConnectUI.account) fetchAndDisplayBalance(tonConnectUI.account.address);
        } catch (error) {
            alert("تم إلغاء عملية الدفع.");
        } finally {
            if (tg?.MainButton) tg.MainButton.hide();
        }
    };
});
