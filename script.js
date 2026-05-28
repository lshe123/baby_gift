window.addEventListener("load", () => {
    const tg = window.Telegram?.WebApp;
    
    // رصيد البوت الداخلي الافتراضي للمستخدم (يمكنك ربطه بقاعدة بيانات لاحقاً)
    let internalBotBalance = 0.012; 
    document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(3);

    // 1. جلب صورة واسم المستخدم من تليجرام
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

    // 2. تهيئة مكتبة TON Connect في الخلفية
    let tonConnectUI;
    try {
        tonConnectUI = new window.TONConnectUI.TonConnectUI({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-hidden-element'
        });
    } catch (error) {
        console.error("خطأ تهيئة المحفظة:", error);
    }

    // دالة فحص رصيد المحفظة الخارجية لعرضه في خانة الشحن
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

    // 3. نظام تنقل الواجهات (مبادلة واجهة اللعبة بواجهة الإيداع)
    const gameView = document.getElementById('game-view-section');
    const depositView = document.getElementById('deposit-view-section');
    
    document.getElementById('deposit-nav-btn').addEventListener('click', () => {
        gameView.style.display = 'none';
        depositView.style.display = 'block';
    });

    document.getElementById('back-to-game-btn').addEventListener('click', () => {
        depositView.style.display = 'none';
        gameView.style.display = 'block';
    });

    // دالة الأزرار السريعة لتحديد المبلغ (+1, +10)
    window.setAmount = function(val) {
        document.getElementById('deposit-amount-input').value = val;
    };

    // 4. الضغط على زر الشحن الكبير (Top Up) وفتح محفظة Tonkeeper فوراً
    document.getElementById('execute-deposit-btn').addEventListener('click', async () => {
        // إذا لم تكن المحفظة مرتبطة، نفتح نافذة الربط أولاً
        if (!tonConnectUI || !tonConnectUI.connected) {
            alert("يرجى اختيار محفظتك وربطها أولاً ليتم توجيهك لعملية الدفع!");
            await tonConnectUI.openModal();
            return;
        }

        const inputAmount = parseFloat(document.getElementById('deposit-amount-input').value);
        if (isNaN(inputAmount) || inputAmount < 0.1) {
            alert("الحد الأدنى للشحن هو 0.1 TON");
            return;
        }

        // عنوان محفظتك الشخصية لاستقبال الأموال الشاحنة
        const myDestinationWallet = "UQBfaYCuGyjtzwd0ryubNJBsxRW5oQAxLT6WSXzPhfEzwVO4";
        const nanoAmount = (inputAmount * 1000000000).toString();

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
                {
                    address: myDestinationWallet,
                    amount: nanoAmount,
                    payload: btoa(JSON.stringify({ userId: tg?.initDataUnsafe?.user?.id || 0, action: "TOP_UP" }))
                }
            ]
        };

        try {
            alert("سيتم توجيهك الآن إلى تطبيق المحفظة (Tonkeeper) لتأكيد عملية الشحن...");
            await tonConnectUI.sendTransaction(transaction);
            
            // عند نجاح المعاملة، يتم إضافة الرصيد إلى رصيد البوت في الهيدر ترحيبياً
            internalBotBalance += inputAmount;
            document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(3);
            
            alert("🎯 تم استلام الشحنة بنجاح وتحديث رصيدك داخل البوت!");
            depositView.style.display = 'none';
            gameView.style.display = 'block';
        } catch (error) {
            alert("❌ تم إلغاء عملية الدفع أو أن الرصيد بمحفظتك غير كافٍ.");
        }
    });

    // دالة الشراء المباشر للصناديق باستخدام رصيد البوت المشحون
    window.buyItem = function(price, name) {
        if (internalBotBalance >= price) {
            internalBotBalance -= price;
            document.getElementById('header-balance-view').innerText = internalBotBalance.toFixed(3);
            alert(`🎉 مبروك! نجحت في شراء ${name} وتم خصم القيمة من رصيدك الشاحن.`);
        } else {
            alert("❌ رصيدك الحالي غير كافٍ! اضغط على زر Deposit في الأعلى لشحن حسابك عبر Tonkeeper.");
            gameView.style.display = 'none';
            depositView.style.display = 'block';
        }
    };
});
