window.addEventListener("load", () => {
    const tg = window.Telegram?.WebApp;
    
    // 1. جلب بيانات المستخدم وصورته من تليجرام مباشرة
    if (tg) {
        tg.expand();
        tg.ready();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            document.getElementById('user-name').innerText = user.first_name;
            
            const avatarImg = document.getElementById('user-avatar');
            if (user.photo_url) {
                avatarImg.src = user.photo_url;
            } else {
                avatarImg.src = "https://api.dicebear.com/7.x/bottts/svg?seed=" + user.id;
            }
        }
    }

    // 2. تهيئة مكتبة الـ TON Connect الأساسية
    let tonConnectUI;
    try {
        tonConnectUI = new window.TONConnectUI.TonConnectUI({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-btn'
        });
    } catch (error) {
        console.error("خطأ في تهيئة المحفظة:", error);
    }

    // دالة فحص وتحديث الرصيد الفعلي من البلوكشين مباشرة
    async function fetchAndDisplayBalance(walletAddress) {
        try {
            const balanceView = document.getElementById('balance-view');
            if (!balanceView) return;

            const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}`);
            const data = await response.json();
            
            if (data && data.balance !== undefined) {
                const tonBalance = (parseInt(data.balance) / 1000000000).toFixed(3); 
                balanceView.innerText = tonBalance; 
            } else {
                balanceView.innerText = "0.00";
            }
        } catch (error) {
            console.error("خطأ أثناء جلب الرصيد:", error);
        }
    }

    // 3. معالجة فتح قائمة المحافظ (Modal) عند الضغط على زر ربط المحفظة المخصص
    const customWalletBtn = document.getElementById('custom-wallet-btn');
    const walletText = document.getElementById('wallet-text-placeholder');

    if (customWalletBtn && tonConnectUI) {
        customWalletBtn.addEventListener('click', async () => {
            if (tonConnectUI.connected) {
                await tonConnectUI.disconnect();
            } else {
                // إجبار واجهة المكتبة على فتح نافذة اختيار المحفظة (Tonkeeper وغيرها)
                await tonConnectUI.openModal();
            }
        });

        // مراقبة الاتصال وتغيير الواجهة بشكل فوري وديناميكي
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet && tonConnectUI.connected) {
                walletText.innerText = "متصل 👑";
                customWalletBtn.style.background = "#27ae60"; 
                fetchAndDisplayBalance(wallet.account.address);
            } else {
                walletText.innerText = "ربط المحفظة";
                customWalletBtn.style.background = "#24a1de"; 
                document.getElementById('balance-view').innerText = "0.00";
            }
        });
    }

    // دالة معالجة الدفع وعمليات الشراء داخل البوت
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
